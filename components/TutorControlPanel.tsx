import React, { useState } from 'react';
import { TutoringState, TutoringMode } from '../App';

interface TutorControlPanelProps {
  tutoringState: TutoringState;
  tutoringError: string | null;
  onStart: (mode: TutoringMode) => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onEnd: () => void;
  onDismissError: () => void;
}

const TutorControlPanel: React.FC<TutorControlPanelProps> = ({
  tutoringState,
  tutoringError,
  onStart,
  onPause,
  onResume,
  onRestart,
  onEnd,
  onDismissError,
}) => {
  const [showModeSelection, setShowModeSelection] = useState(false);

  const handleStartClick = () => {
    setShowModeSelection(true);
  };

  const handleModeSelect = (mode: TutoringMode) => {
    setShowModeSelection(false);
    onStart(mode);
  };
  
  const renderErrorState = () => {
    const isQuotaError = tutoringError && /quota|billing|limit|exhausted/i.test(tutoringError);
    const isInvalidKeyError = tutoringError && /invalid|not valid/i.test(tutoringError);

    return (
        <div className="text-center">
            <div className="text-red-500 mb-3">
                <i className="fa-solid fa-circle-exclamation text-3xl"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Audio Generation Failed</h3>
            
            {isInvalidKeyError ? (
                <p className="text-sm text-slate-500 mb-4 px-2">
                    The API key for the audio service appears to be invalid. Please check the key and try again.
                </p>
            ) : isQuotaError ? (
                <p className="text-sm text-slate-500 mb-4 px-2">
                    You've encountered an API quota or billing limit for the audio generation service. Please check your account status with the provider.
                </p>
            ) : (
                <p className="text-sm text-slate-500 mb-4 px-2">{tutoringError}</p>
            )}

            <button
                onClick={onDismissError}
                className="w-full px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all"
            >
                Dismiss
            </button>
        </div>
    );
  };

  const renderIdleState = () => (
    <div className="text-center">
      {!showModeSelection ? (
        <>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Auto Tutor</h3>
          <p className="text-sm text-slate-500 mb-4">Let AI walk you through your presentation.</p>
          <button
            onClick={handleStartClick}
            className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
          >
            <i className="fa-solid fa-play mr-2"></i>Start Session
          </button>
        </>
      ) : (
        <>
           <h3 className="text-lg font-bold text-slate-800 mb-2">Select Speed</h3>
           <p className="text-sm text-slate-500 mb-4">Choose the pace of your session.</p>
           <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleModeSelect('rapid')} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
              <i className="fa-solid fa-forward-fast mr-2"></i>Rapid
            </button>
            <button onClick={() => handleModeSelect('normal')} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
              <i className="fa-solid fa-forward mr-2"></i>Normal
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderActiveState = () => {
    let statusText = "Session in progress...";
    if (tutoringState === 'paused') statusText = "Session Paused";
    if (tutoringState === 'generating') statusText = "Generating explanation...";

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Auto Tutor</h3>
                <span className={`text-sm font-semibold px-2 py-1 rounded-md ${
                    tutoringState === 'running' ? 'bg-green-100 text-green-800' :
                    tutoringState === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                }`}>
                    {tutoringState === 'running' && <i className="fa-solid fa-circle text-xs text-green-500 mr-1 animate-pulse"></i>}
                    {statusText}
                </span>
            </div>
            <div className="flex items-center justify-around">
                <button 
                    onClick={onRestart}
                    className="flex flex-col items-center text-slate-500 hover:text-indigo-600 transition-colors"
                    aria-label="Restart Session"
                >
                    <i className="fa-solid fa-repeat text-xl"></i>
                    <span className="text-xs mt-1 font-semibold">Restart</span>
                </button>
                {tutoringState === 'running' || tutoringState === 'generating' ? (
                    <button 
                        onClick={onPause}
                        className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
                        aria-label="Pause Session"
                    >
                        <i className="fa-solid fa-pause"></i>
                    </button>
                ) : (
                    <button 
                        onClick={onResume}
                        className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
                        aria-label="Resume Session"
                    >
                        <i className="fa-solid fa-play"></i>
                    </button>
                )}
                <button 
                    onClick={onEnd}
                    className="flex flex-col items-center text-slate-500 hover:text-red-600 transition-colors"
                    aria-label="End Session"
                >
                    <i className="fa-solid fa-stop text-xl"></i>
                    <span className="text-xs mt-1 font-semibold">End</span>
                </button>
            </div>
        </div>
    );
  };
  

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 min-h-[150px] flex flex-col justify-center">
      {tutoringError
        ? renderErrorState()
        : tutoringState === 'idle'
        ? renderIdleState()
        : renderActiveState()}
    </div>
  );
};

export default TutorControlPanel;