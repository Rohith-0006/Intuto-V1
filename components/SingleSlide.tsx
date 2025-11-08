import React from 'react';
import { Slide } from '../types';

interface SingleSlideProps {
  slide: Slide;
  index: number;
}

const SingleSlide: React.FC<SingleSlideProps> = ({ slide, index }) => {

  return (
    <div className="w-full h-full flex flex-col animate-fade-in rounded-xl overflow-hidden text-white shadow-2xl bg-slate-900">
      
      {/* Image Section - 25% Height with Gradient Blend */}
      <div className="relative w-full h-[25%] flex-shrink-0">
        {slide.imageUrl ? (
            <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover"/>
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <i className="fa-solid fa-image text-5xl text-slate-600"></i>
          </div>
        )}
        {/* Gradient Overlay for seamless transition */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent"></div>
      </div>

      {/* Text Section - 75% height and scrolls */}
      <div className="h-[75%] p-8 md:p-12 lg:p-16 overflow-y-auto">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight drop-shadow-lg">
              {slide.title}
            </h2>
            <ul className="space-y-5 text-slate-200 list-none">
              {slide.content.map((point, i) =>
                point.text.trim() ? (
                  <li key={i} className="flex items-start text-lg md:text-xl drop-shadow-sm">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-500/20 text-indigo-300 rounded-full mr-5 mt-1">
                          <i className={`fa-solid ${point.icon}`}></i>
                      </div>
                      <span className="flex-1">{point.text}</span>
                  </li>
                ) : null
              )}
            </ul>
          </div>
      </div>

    </div>
  );
};

export default SingleSlide;