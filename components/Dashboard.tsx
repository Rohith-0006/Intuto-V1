import React, { useRef, useState } from 'react';
import { Space } from '../types';

interface DashboardProps {
  onFileChange: (file: File) => void;
  spaces: Space[];
  onSelectSpace: (spaceId: string) => void;
  onDeleteSpace: (spaceId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onFileChange, spaces, onSelectSpace, onDeleteSpace }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileChange(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileChange(file);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    onDeleteSpace(spaceId);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf"
      />

      {/* Main Upload Bar */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Intuto
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          Instantly transform any PDF document into a beautiful, engaging presentation with AI-powered visuals and summaries.
        </p>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
          className={`relative max-w-3xl mx-auto p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
            isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <i className="fa-solid fa-file-pdf text-5xl text-indigo-500 mb-4"></i>
            <p className="text-lg font-semibold text-slate-800">
              Drag & Drop your PDF here
            </p>
            <p className="text-slate-500 mb-4">or</p>
            <button
              type="button"
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Choose File
            </button>
          </div>
        </div>
      </div>

      {/* Existing Spaces Section */}
      {spaces.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Spaces</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {spaces.map(space => (
              <div key={space.id} onClick={() => onSelectSpace(space.id)} className="group relative bg-white border border-gray-200 rounded-lg text-left hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                <button
                  onClick={(e) => handleDeleteClick(e, space.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-10"
                  aria-label="Delete space"
                >
                  <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
                <div className="h-32 bg-gray-100 rounded-t-lg flex items-center justify-center">
                    <i className="fa-solid fa-file-pdf text-5xl text-gray-400"></i>
                </div>
                <div className="p-4 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">{space.name}</h3>
                    <p className="text-sm text-gray-500">{space.slides.length} slides</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;