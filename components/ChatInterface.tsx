import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

// Fix: Add necessary type definitions for the Web Speech API to resolve TypeScript errors.
// The SpeechRecognition API is not part of the standard DOM library types.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

// Check for SpeechRecognition API
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognitionIsSupported = !!SpeechRecognitionAPI;

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isChatting: boolean;
  onInteractionStart: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatHistory, onSendMessage, isChatting, onInteractionStart }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userStoppedRecording = useRef(false);

  // Ref to hold the latest input value to avoid stale closure in onend
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    if (!recognitionIsSupported) {
      console.warn("Speech recognition not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // onend will also be called, which will handle state updates.
    };
    
    recognition.onend = () => {
        setIsRecording(false);
        // If the recording was stopped by the user, send the message
        if (userStoppedRecording.current) {
            userStoppedRecording.current = false; // Reset flag
            const messageToSend = inputRef.current;
            if (messageToSend.trim()) {
                onSendMessage(messageToSend);
                setInput('');
            }
        }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onend = null; // Prevent onend from firing on unmount
      recognition.stop();
    };
  }, [onSendMessage]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chatHistory, isChatting]);

  const handleSend = () => {
    if (input.trim()) {
      onInteractionStart();
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };
  
  const handleMicClick = () => {
    if (!recognitionRef.current) return;
    
    onInteractionStart();

    if (isRecording) {
      userStoppedRecording.current = true; // Set flag to send message on 'end'
      recognitionRef.current.stop();
    } else {
      userStoppedRecording.current = false; // Ensure flag is false when starting
      setInput(''); // Clear input before starting a new recording
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800">Chat with Document</h2>
      </div>

      <div className="flex-grow p-4 overflow-y-auto bg-white">
        <div className="flex flex-col space-y-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none shadow' : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isChatting && (
             <div className="flex justify-start">
               <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-bl-none px-4 py-3">
                 <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-200"></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-400"></span>
                 </div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white">
        <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={onInteractionStart}
            placeholder="Ask a question..."
            rows={1}
            className="flex-grow bg-transparent text-slate-800 placeholder-slate-500 focus:outline-none resize-none p-2"
          />
          {recognitionIsSupported && (
            <button
              onClick={handleMicClick}
              disabled={isChatting}
              className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg disabled:cursor-not-allowed transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isChatting}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-200 text-slate-500 rounded-lg disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-slate-300 transition-colors"
            aria-label="Send message"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;