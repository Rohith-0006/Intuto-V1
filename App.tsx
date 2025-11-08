
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Slide, ChatMessage, Space } from './types';
import { extractTextFromPdf } from './services/pdfService';
import { generateSlides, streamChatWithDocument, findMostRelevantSlide, streamSlideExplanation } from './services/geminiService';
import { StreamingTTSPlayer } from './services/ttsService';
import SlideViewer from './components/SlideViewer';
import ChatInterface from './components/ChatInterface';
import LoadingSpinner from './components/LoadingSpinner';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import TutorControlPanel from './components/TutorControlPanel';

type AppState = 'dashboard' | 'processing' | 'editor' | 'error';
export type TutoringState = 'idle' | 'running' | 'paused' | 'generating';
export type TutoringMode = 'rapid' | 'normal';

export default function App() {
  const [appState, setAppState] = useState<AppState>('dashboard');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  // Tutoring state
  const [tutoringState, setTutoringState] = useState<TutoringState>('idle');
  const [tutoringMode, setTutoringMode] = useState<TutoringMode>('normal');
  const [currentTutoringSlideIndex, setCurrentTutoringSlideIndex] = useState(0);
  const [tutoringError, setTutoringError] = useState<string | null>(null);


  const ttsPlayerRef = useRef<StreamingTTSPlayer | null>(null);
  const prefetchedAudioRef = useRef<{ index: number; buffer: AudioBuffer } | null>(null);
  const isTutoringStepActiveRef = useRef(false);


  useEffect(() => {
    ttsPlayerRef.current = new StreamingTTSPlayer();
    return () => {
      ttsPlayerRef.current?.stop();
    };
  }, []);
  
  useEffect(() => {
    try {
      const item = window.localStorage.getItem('spaces');
      if (item) {
        setSpaces(JSON.parse(item));
      }
    } catch (err) {
      console.error("Failed to load spaces from localStorage:", err);
      setSpaces([]);
    }
  }, []);

  useEffect(() => {
    try {
      const lightweightSpaces = spaces.map(space => ({
        ...space,
        pdfText: '',
        slides: space.slides.map(({ imageUrl, ...rest }) => rest),
      }));
      window.localStorage.setItem('spaces', JSON.stringify(lightweightSpaces));
    } catch (err) {
      console.error("Failed to set localStorage value (quota may be exceeded):", err);
    }
  }, [spaces]);


  const activeSpace = spaces.find(s => s.id === activeSpaceId);

  const handleSetCurrentSlide = useCallback((index: number) => {
    setSpaces(prevSpaces => prevSpaces.map(s => 
      s.id === activeSpaceId ? { ...s, currentSlide: index } : s
    ));
  }, [activeSpaceId]);

  const handleEndTutoring = useCallback(() => {
      ttsPlayerRef.current?.stop();
      prefetchedAudioRef.current = null;
      setTutoringState('idle');
      setCurrentTutoringSlideIndex(0);
  }, []);
  
  useEffect(() => {
    ttsPlayerRef.current?.stop();
    handleEndTutoring();
  }, [activeSpaceId, handleEndTutoring]);
  
  // --- Tutoring Logic ---
  const generateAudioForSlide = useCallback(async (slideIndex: number) => {
    if (!activeSpace || slideIndex < 0 || slideIndex >= activeSpace.slides.length) {
        return null;
    }
    const slide = activeSpace.slides[slideIndex];
    let fullExplanation = '';
    try {
        const stream = streamSlideExplanation(slide, tutoringMode);
        for await (const chunk of stream) {
            fullExplanation += chunk;
        }
        if (fullExplanation.trim() && ttsPlayerRef.current) {
            return await ttsPlayerRef.current.generateAudio(fullExplanation.trim());
        }
        return null;
    } catch (err) {
        // Re-throw the specific error to be handled by the effect hook
        throw err;
    }
  }, [activeSpace, tutoringMode]);

  useEffect(() => {
    if (tutoringState !== 'running' || !activeSpace || isTutoringStepActiveRef.current) {
        return;
    }

    let isCancelled = false;

    const playAndPrefetch = async () => {
        isTutoringStepActiveRef.current = true;
        try {
            if (isCancelled || currentTutoringSlideIndex >= activeSpace.slides.length) {
                handleEndTutoring();
                return;
            }

            handleSetCurrentSlide(currentTutoringSlideIndex);
            setTutoringState('generating');

            let currentAudioBuffer: AudioBuffer | null;

            if (prefetchedAudioRef.current?.index === currentTutoringSlideIndex) {
                currentAudioBuffer = prefetchedAudioRef.current.buffer;
                prefetchedAudioRef.current = null;
            } else {
                currentAudioBuffer = await generateAudioForSlide(currentTutoringSlideIndex);
            }

            if (isCancelled || !currentAudioBuffer) {
                if (!isCancelled) {
                    console.error(`Failed to get audio for slide ${currentTutoringSlideIndex}, ending session.`);
                    handleEndTutoring();
                }
                return;
            }

            const nextSlideIndex = currentTutoringSlideIndex + 1;
            if (nextSlideIndex < activeSpace.slides.length) {
                generateAudioForSlide(nextSlideIndex).then(buffer => {
                    if (buffer && !isCancelled) {
                        prefetchedAudioRef.current = { index: nextSlideIndex, buffer: buffer };
                    }
                }).catch(prefetchError => {
                    console.warn(`Failed to prefetch audio for slide ${nextSlideIndex}:`, prefetchError);
                });
            }

            setTutoringState('running');
            
            if (ttsPlayerRef.current) {
                // Await the promise that resolves when audio finishes playing.
                await ttsPlayerRef.current.playAudio(currentAudioBuffer);
            }
            
            // Add a small delay for a more natural transition.
            await new Promise(resolve => setTimeout(resolve, 250));

            // Only advance if the process hasn't been cancelled (e.g., by pausing).
            if (!isCancelled) {
                setCurrentTutoringSlideIndex(prev => prev + 1);
            }

        } catch (err: any) {
            console.error("Tutoring session failed:", err);
            setTutoringError(err.message || "An unknown error occurred during tutoring.");
            handleEndTutoring();
        } finally {
            isTutoringStepActiveRef.current = false;
        }
    };
    
    playAndPrefetch();

    return () => {
        isCancelled = true;
    };
  }, [tutoringState, currentTutoringSlideIndex, activeSpace, generateAudioForSlide, handleEndTutoring, handleSetCurrentSlide]);


  const handleStartTutoring = async (mode: TutoringMode) => {
      setTutoringError(null);
      // Ensure the audio context is resumed by a user gesture. This is crucial
      // for browsers that block audio from playing without direct interaction.
      await ttsPlayerRef.current?.resumeContext();
      ttsPlayerRef.current?.stop();
      prefetchedAudioRef.current = null;
      
      setTutoringMode(mode);
      setCurrentTutoringSlideIndex(0);
      setTutoringState('running');
  };

  const handlePauseTutoring = () => {
      ttsPlayerRef.current?.stop();
      setTutoringState('paused');
  };

  const handleResumeTutoring = () => {
      setTutoringState('running');
  };

  const handleRestartTutoring = () => {
      handleStartTutoring(tutoringMode);
  };

  const handleDismissTutoringError = () => {
    setTutoringError(null);
  };
  
  const handleChatInteractionStart = () => {
      if (tutoringState === 'running' || tutoringState === 'generating') {
          handlePauseTutoring();
      }
  };
  // --- End of Tutoring Logic ---


  const handleFileChange = async (file: File) => {
    if (!file) return;

    setAppState('processing');
    setError('');

    try {
      const text = await extractTextFromPdf(file);
      const generatedSlides = await generateSlides(text);
      
      const newSpace: Space = {
        id: `space_${Date.now()}`,
        name: file.name.replace(/\.pdf$/i, ''),
        createdAt: new Date().toISOString(),
        pdfText: text,
        slides: generatedSlides,
        chatHistory: [
          { sender: 'ai', text: `I have created ${generatedSlides.length} slides from your document. You can now ask me any questions about its content.` }
        ],
        currentSlide: 0,
      };

      setSpaces([newSpace, ...spaces]);
      setActiveSpaceId(newSpace.id);
      setAppState('editor');

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to process your document. Please try again. Error: ${errorMessage}`);
      setAppState('error');
    }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !activeSpace) return;
    
    handleChatInteractionStart();
    ttsPlayerRef.current?.stop();
    
    const userMessage: ChatMessage = { sender: 'user', text: message };
    const aiMessagePlaceholder: ChatMessage = { sender: 'ai', text: '' };

    setSpaces(prevSpaces => prevSpaces.map(space => 
        space.id === activeSpaceId 
            ? { ...space, chatHistory: [...space.chatHistory, userMessage, aiMessagePlaceholder], isChatting: true }
            : space
    ));
    
    let fullAiResponse = '';
    
    try {
      const stream = streamChatWithDocument(activeSpace.pdfText, message);

      for await (const chunk of stream) {
        fullAiResponse += chunk;
        
        setSpaces(prevSpaces => prevSpaces.map(space => {
          if (space.id === activeSpaceId) {
            const newHistory = [...space.chatHistory];
            newHistory[newHistory.length - 1].text = fullAiResponse;
            return { ...space, chatHistory: newHistory };
          }
          return space;
        }));
      }

      if (fullAiResponse.trim()) {
          ttsPlayerRef.current?.speak(fullAiResponse.trim());

        try {
            const slideIndex = await findMostRelevantSlide(message, fullAiResponse, activeSpace.slides);
            if (slideIndex >= 0 && slideIndex < activeSpace.slides.length) {
                handleSetCurrentSlide(slideIndex);
            }
        } catch (slideError) {
            console.error("Could not determine relevant slide:", slideError);
        }
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during chat.';
      const aiErrorMessage: ChatMessage = { sender: 'ai', text: `Sorry, I encountered an error: ${errorMessage}` };

      setSpaces(prevSpaces => prevSpaces.map(space => {
        if (space.id === activeSpaceId) {
          const newHistory = [...space.chatHistory.slice(0, -1), aiErrorMessage];
          return { ...space, chatHistory: newHistory };
        }
        return space;
      }));
    } finally {
      setSpaces(prevSpaces => prevSpaces.map(space => 
        space.id === activeSpaceId ? { ...space, isChatting: false } : space
      ));
    }
}, [activeSpace, activeSpaceId, setSpaces, handleSetCurrentSlide]);

  const handleSelectSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId);
    setAppState('editor');
  };

  const handleBackToDashboard = () => {
      setActiveSpaceId(null);
      setAppState('dashboard');
      setError('');
  };

  const handleDeleteSpace = (spaceIdToDelete: string) => {
    if (window.confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
        setSpaces(prevSpaces => prevSpaces.filter(space => space.id !== spaceIdToDelete));
        if (activeSpaceId === spaceIdToDelete) {
            handleBackToDashboard();
        }
    }
  };


  const renderContent = () => {
    switch (appState) {
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <LoadingSpinner />
            <p className="mt-4 text-lg text-slate-600 text-center">
              Processing your document...<br />Generating slides and unique visual assets.
            </p>
          </div>
        );
      case 'editor':
        if (!activeSpace) {
            return <div className="flex flex-col items-center justify-center h-full">
                <p className="text-red-500">Error: Could not find the active session.</p>
                <button onClick={handleBackToDashboard} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md">Go to Dashboard</button>
            </div>
        }
        return (
          <div className="flex w-full h-full p-4 md:p-6 lg:p-8 gap-6 overflow-hidden">
            <div className="flex-grow h-full overflow-hidden">
              <SlideViewer slides={activeSpace.slides} currentSlide={activeSpace.currentSlide} setCurrentSlide={handleSetCurrentSlide} onReset={handleBackToDashboard}/>
            </div>
            <div className="w-full md:w-[280px] lg:w-[320px] flex-shrink-0 h-full flex flex-col gap-6">
              <div className="flex-shrink-0">
                <TutorControlPanel 
                  tutoringState={tutoringState}
                  tutoringError={tutoringError}
                  onStart={handleStartTutoring}
                  onPause={handlePauseTutoring}
                  onResume={handleResumeTutoring}
                  onRestart={handleRestartTutoring}
                  onEnd={handleEndTutoring}
                  onDismissError={handleDismissTutoringError}
                />
              </div>

              <div className="flex-grow min-h-0">
                <ChatInterface 
                  chatHistory={activeSpace.chatHistory} 
                  onSendMessage={handleSendMessage} 
                  isChatting={!!activeSpace.isChatting}
                  onInteractionStart={handleChatInteractionStart}
                />
              </div>
            </div>
          </div>
        );
      case 'error':
         return <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 text-center mb-4">{error}</p>
            <button
              onClick={handleBackToDashboard}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
         </div>
      case 'dashboard':
      default:
        return <Dashboard onFileChange={handleFileChange} spaces={spaces} onSelectSpace={handleSelectSpace} onDeleteSpace={handleDeleteSpace} />;
    }
  };

  return (
    <main className="h-screen w-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
       {appState !== 'editor' && <Header />}
       <div className="flex-grow overflow-auto">
          {renderContent()}
       </div>
    </main>
  );
}
