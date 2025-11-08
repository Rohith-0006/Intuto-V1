# Intuto – AI-Powered Visual Tutor & Presentation Generator

Intuto is an AI application that transforms long, static PDFs into interactive visual presentations. It generates structured slides, AI-created visuals, and provides a natural voice-based tutor that explains every topic. Intuto solves the problem of boring, inaccessible PDFs by enabling users to learn through visuals, conversations, and guided audio explanations.

---

## 🚀 What Intuto Does (Brief Overview)

- Converts any PDF into a clean, structured slide deck.
- Generates professional, context-aware background images for each slide.
- Provides an AI Tutor that explains slides through natural voice output.
- Offers a RAG-enabled chat interface grounded in the original PDF.
- Automatically jumps to relevant slides based on the conversation.
- Supports voice input, interactive navigation, and persistent sessions.

---

## 💡 Idea, Technology Stack & Tools Used

### The Idea
Intuto reimagines how people consume documents by turning static PDFs into dynamic learning experiences with:
- AI-generated slides  
- Visuals that add clarity  
- A conversational assistant  
- A voice-based tutor for hands-free learning  

### Technology Stack

**Frontend**
- React  
- TypeScript  
- Tailwind CSS  

**AI Models**
- **Gemini 2.5 Flash** — slide generation, RAG chat, slide relevance detection  
- **Gemini 2.5 Flash Image** — background visual creation  
- **Gemini Flash Lite** — fast tutor explanation generation  
- **OpenAI TTS (`tts-1`)** — high-quality text-to-speech  

**Browser Tools**
- `pdf.js` — PDF parsing and text extraction  
- Web Speech API — voice-to-text  
- Web Audio API — audio playback  
- Local Storage — saving sessions  

### System Flow
1. PDF uploaded → text extracted using `pdf.js`.  
2. Gemini generates structured slide JSON.  
3. Gemini Image API creates visuals for each slide.  
4. Slides rendered in the UI.  
5. RAG chat uses the PDF text as grounding.  
6. Gemini Flash Lite generates tutor explanations.  
7. OpenAI TTS speaks them with smooth playback.  

---

## 🎥 Product Demo

**Demo Video:**  
https://drive.google.com/file/d/11i-sd-W9jTxbJLdlPYQhtF4hbei47ttK/view?usp=sharing

---

## 📦 Project Structure

