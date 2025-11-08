import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex-shrink-0 bg-white px-4 sm:px-6 lg:px-8 border-b border-slate-200">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-indigo-600">
              <path fillRule="evenodd" d="M2.25 4.125c0-1.036.84-1.875 1.875-1.875h15.75c1.035 0 1.875.84 1.875 1.875V19.5A1.875 1.875 0 0 1 19.875 21.375H4.125A1.875 1.875 0 0 1 2.25 19.5V4.125Zm1.5.75V19.5h15.75V4.875H3.75Z" clipRule="evenodd" />
              <path d="M6.75 6.375a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Z" />
               <path d="M6.75 9.375a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Z" />
               <path d="M6.75 12.375a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H7.5a.75.75 0 0 1-.75-.75Z" />
            </svg>
            <span className="font-bold text-xl text-slate-800">Intuto</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;