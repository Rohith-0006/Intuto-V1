import React from 'react';
import { Slide } from '../types';
import SingleSlide from './SingleSlide';

interface SlideViewerProps {
  slides: Slide[];
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
  onReset: () => void;
}

const SlideViewer: React.FC<SlideViewerProps> = ({ slides, currentSlide, setCurrentSlide, onReset }) => {
  const goToNextSlide = () => {
    setCurrentSlide(Math.min(currentSlide + 1, slides.length - 1));
  };

  const goToPrevSlide = () => {
    setCurrentSlide(Math.max(currentSlide - 1, 0));
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-6">
       <div className="w-full lg:w-[300px] bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col flex-shrink-0">
         <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800">Outline</h2>
            <button onClick={onReset} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                <i className="fa-solid fa-arrow-left mr-2"></i>Dashboard
            </button>
         </div>
         <div className="overflow-y-auto flex-grow pr-2">
            <ul className="space-y-2">
                {slides.map((slide, index) => (
                    <li key={index}>
                        <button
                            onClick={() => setCurrentSlide(index)}
                            className={`w-full text-left p-3 rounded-lg transition-colors text-sm flex items-start ${
                                currentSlide === index
                                ? 'bg-blue-600 text-white font-semibold shadow'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                            }`}
                        >
                            <span className={`font-mono mr-3 ${currentSlide === index ? 'text-blue-200' : 'text-slate-400'}`}>{String(index + 1).padStart(2, '0')}</span>
                            <span className="flex-1">{slide.title}</span>
                        </button>
                    </li>
                ))}
            </ul>
         </div>
      </div>

      <div className="flex-grow flex flex-col">
        <div className="flex-grow bg-white rounded-xl shadow-sm border border-slate-200">
            {slides.length > 0 && <SingleSlide slide={slides[currentSlide]} index={currentSlide} />}
        </div>
        <div className="flex items-center justify-between mt-4 p-2">
            <button
              onClick={goToPrevSlide}
              disabled={currentSlide === 0}
              className="px-6 py-2 rounded-lg bg-white border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors font-semibold text-slate-700"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i> Prev
            </button>
            <span className="text-slate-500 font-medium">
              Slide {currentSlide + 1} of {slides.length}
            </span>
            <button
              onClick={goToNextSlide}
              disabled={currentSlide === slides.length - 1}
              className="px-6 py-2 rounded-lg bg-white border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors font-semibold text-slate-700"
            >
              Next <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          </div>
      </div>
    </div>
  );
};

export default SlideViewer;