import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Slide, BulletPoint } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const slideGenerationSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'A concise and engaging title for the slide. Should be impactful.'
        },
        content: {
          type: Type.ARRAY,
          description: 'The main content of the slide, broken down into a maximum of 4 clear, concise bullet points.',
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: 'The text for a single bullet point.'
              },
              icon: {
                type: Type.STRING,
                description: 'A relevant Font Awesome 6 Solid icon name (e.g., "fa-flask", "fa-seedling", "fa-chart-line") that visually represents the bullet point.'
              }
            },
            required: ['text', 'icon']
          }
        }
      },
      required: ['title', 'content']
    }
};

async function generateContentImage(slideTitle: string): Promise<string | undefined> {
    const model = 'gemini-2.5-flash-image';
    const prompt = `Generate a high-quality, professional photo that visually represents the concept of: '${slideTitle}'. The image should be clean, modern, and suitable for a presentation slide. Avoid text, logos, clutter, and distracting elements. The main subject should be clear and aesthetically pleasing.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        return undefined;
    } catch (error) {
        console.error(`Error generating image for slide "${slideTitle}":`, error);
        return undefined; // Return undefined if image generation fails
    }
}


export async function generateSlides(pdfText: string): Promise<Slide[]> {
    const model = 'gemini-2.5-flash';
    const prompt = `You are a world-class presentation designer and instructional expert. Your task is to analyze the following document text and transform it into an exceptionally high-quality, visually stunning, and informative slide presentation.

    For each slide:
    1.  **Title:** Craft a powerful, engaging title that captures the essence of the slide's content.
    2.  **Content:** Deconstruct the information into clear, insightful bullet points. **Crucially, to maintain a clean and readable layout, each slide must contain a maximum of FOUR (4) bullet points.** Prioritize the most important information.
    3.  **Visuals:** For EACH bullet point, suggest a highly relevant Font Awesome 6 Solid icon name (e.g., "fa-flask", "fa-seedling", "fa-chart-line") that provides a strong visual anchor for the text.

    The final output must be a JSON array of slide objects, adhering strictly to the provided schema. Do not include any introductory or concluding text outside of the JSON structure.

    DOCUMENT TEXT:
    ---
    ${pdfText}
    ---
    
    Generate the best slide presentation imaginable from the text provided.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: slideGenerationSchema,
            },
        });

        const jsonText = response.text;
        if (!jsonText || jsonText.trim() === '') {
            console.warn("Received empty JSON text from API for slides.");
            return [];
        }
        
        const slidesWithoutImages = JSON.parse(jsonText) as Omit<Slide, 'imageUrl'>[];

        // Enforce the 4 bullet point limit client-side for robustness
        const slidesWithLimitedPoints = slidesWithoutImages.map(slide => ({
            ...slide,
            content: slide.content.slice(0, 4) // Keep only the first 4 bullet points
        }));

        // Generate images for each slide in parallel
        const imagePromises = slidesWithLimitedPoints.map(slide => generateContentImage(slide.title));
        const imageUrls = await Promise.all(imagePromises);

        // Combine slides with their generated images
        const slidesWithImages = slidesWithLimitedPoints.map((slide, index) => ({
            ...slide,
            imageUrl: imageUrls[index],
        }));
        
        return slidesWithImages;

    } catch (error) {
        console.error("Error generating slides:", error);
        throw new Error("Failed to generate slides from the document.");
    }
}

export async function* streamChatWithDocument(pdfText: string, userQuery: string) {
    const model = 'gemini-2.5-flash';
    const prompt = `You are a helpful assistant with deep knowledge of the following document. Your task is to answer the user's question based *only* on the provided text. If the answer is not in the text, say so. Be concise and helpful.

    DOCUMENT TEXT:
    ---
    ${pdfText}
    ---

    USER QUESTION:
    ${userQuery}`;

    try {
        const response = await ai.models.generateContentStream({
            model: model,
            contents: prompt,
        });
        
        for await (const chunk of response) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Error in chat stream:", error);
        throw new Error("Failed to get a streaming response from the AI.");
    }
}

export async function findMostRelevantSlide(userQuery: string, aiResponse: string, slides: Slide[]): Promise<number> {
    if (slides.length === 0) return -1;

    const model = 'gemini-2.5-flash';
    const slideListForPrompt = slides.map((slide, index) => `Index ${index}: ${slide.title}`).join('\n');
    
    const prompt = `You are an expert at mapping conversational context to presentation content. Based on the following user query and AI response, identify which of the provided slides is the most relevant. Your response must be only the index of that slide.

    USER QUERY:
    ---
    ${userQuery}
    ---

    AI RESPONSE:
    ---
    ${aiResponse}
    ---

    AVAILABLE SLIDES:
    ---
    ${slideListForPrompt}
    ---

    Return a JSON object with the single most relevant slide index. For example: {"slideIndex": 2}`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        slideIndex: {
                            type: Type.INTEGER,
                            description: "The index of the most relevant slide from the list."
                        }
                    },
                    required: ['slideIndex']
                },
            },
        });
        
        const jsonResponse = JSON.parse(response.text);
        const slideIndex = jsonResponse.slideIndex;

        if (typeof slideIndex === 'number' && slideIndex >= 0 && slideIndex < slides.length) {
            return slideIndex;
        }

        return -1; // Return -1 if index is invalid
    } catch (error) {
        console.error("Error finding relevant slide:", error);
        throw new Error("Failed to determine the most relevant slide.");
    }
}

export async function* streamSlideExplanation(slide: Slide, mode: 'rapid' | 'normal') {
    const model = 'gemini-flash-lite-latest';
    const wordCount = mode === 'rapid' ? 'about 40 words, which is roughly 15 seconds of speech' : 'about 75 words, which is roughly 30 seconds of speech';
    
    const prompt = `You are an expert presenter. Explain the following slide content clearly and concisely, as if you were giving a live presentation. Keep your explanation to ${wordCount}. Do not introduce yourself or use pleasantries like "In this slide...". Just provide the direct explanation of the slide content.

    SLIDE TITLE: ${slide.title}

    SLIDE BULLET POINTS:
    ${slide.content.map(p => `- ${p.text}`).join('\n')}

    Your spoken explanation:`;

    try {
        const response = await ai.models.generateContentStream({
            model: model,
            contents: prompt,
        });
        
        for await (const chunk of response) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Error in slide explanation stream:", error);
        throw new Error("Failed to get a streaming explanation from the AI.");
    }
}