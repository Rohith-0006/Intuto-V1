// NOTE: This service is now configured to use the OpenAI Text-to-Speech API.
// The provided API key is used directly as requested. For production environments, it is
// strongly recommended to manage API keys securely using environment variables.
const TTS_API_KEY = "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";
const TTS_API_URL = "https://api.openai.com/v1/audio/speech";

export class StreamingTTSPlayer {
    private audioContext: AudioContext | null = null;
    private sourceNodes = new Set<AudioBufferSourceNode>();

    constructor() {
        // Avoid creating AudioContext until a user interaction.
    }

    private getAudioContext(): AudioContext {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtor) {
                throw new Error("Web Audio API is not supported in this browser.");
            }
            // Use the browser's default sample rate; decodeAudioData will handle the source sample rate.
            this.audioContext = new AudioCtor();
        }
        return this.audioContext;
    }

    /**
     * Resumes the audio context if it's in a suspended state.
     * This is crucial to call from a user gesture (e.g., a click handler)
     * to comply with browser autoplay policies.
     */
    public async resumeContext(): Promise<void> {
        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume().catch(err => console.error("Failed to resume audio context:", err));
        }
    }

    async generateAudio(text: string): Promise<AudioBuffer | null> {
        if (!text.trim()) return null;
        
        try {
            const response = await fetch(TTS_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TTS_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'tts-1', // Using tts-1 as a substitute for 'got-4o-mini-tts'.
                    input: text,
                    voice: 'nova', // Using 'nova' voice as a substitute for 'Sage'.
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                const errorMessage = errorBody.error?.message || `TTS request failed with status ${response.status}`;
                console.error("TTS API Error:", errorMessage, errorBody);
                throw new Error(errorMessage);
            }

            const audioData = await response.arrayBuffer();
            const ctx = this.getAudioContext();
            
            // Web Audio API's decodeAudioData can handle various formats like MP3.
            return await ctx.decodeAudioData(audioData);

        } catch (error: any) {
            console.error("Error generating audio:", error);
            const lowerCaseError = error.message.toLowerCase();
            if (lowerCaseError.includes('insufficient_quota')) {
                 throw new Error("You have exceeded your API quota for audio generation. Please check your plan and billing details.");
            }
             if (lowerCaseError.includes('invalid') && lowerCaseError.includes('key')) {
                throw new Error("The provided API key is not valid. Please check your credentials.");
            }
            throw new Error(`An unexpected error occurred while generating the audio track: ${error.message}`);
        }
    }

    async playAudio(audioBuffer: AudioBuffer): Promise<void> {
        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') {
            // This is a fallback, but resumeContext should be called on user interaction.
            await ctx.resume();
        }

        // Stop any previous audio to ensure only one clip plays at a time.
        this.stop();

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        const promise = new Promise<void>((resolve) => {
            source.onended = () => {
                this.sourceNodes.delete(source);
                resolve();
            };
        });

        this.sourceNodes.add(source);
        source.start(0); // Play immediately.
        return promise;
    }

    async speak(text: string): Promise<void> {
        const audioBuffer = await this.generateAudio(text);
        if (audioBuffer) {
            await this.playAudio(audioBuffer);
        }
    }

    stop(): void {
        if (!this.audioContext) return;
        
        // Iterate over a copy as `source.stop()` will trigger `onended` which modifies the set.
        for (const source of new Set(this.sourceNodes)) {
            try {
                source.stop();
            } catch (e) {
                // Ignore errors from stopping already-stopped sources
            }
        }
        // The onended handler will clear the sourceNodes set.
    }
}
