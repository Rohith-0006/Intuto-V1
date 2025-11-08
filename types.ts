export interface BulletPoint {
  text: string;
  icon: string; // e.g., 'fa-flask', 'fa-seedling'
}

export interface Slide {
  title: string;
  content: BulletPoint[]; // Changed from string to a structured array
  imageUrl?: string; // Stores the URL for a content-relevant image
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface Space {
    id: string;
    name: string;
    createdAt: string;
    pdfText: string;
    slides: Slide[];
    chatHistory: ChatMessage[];
    currentSlide: number;
    isChatting?: boolean;
}