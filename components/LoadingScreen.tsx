import React from 'react';
import { LogoIcon } from './icons';

interface LoadingScreenProps {
  isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-transparent transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="animate-fade-in text-center">
        <LogoIcon className="h-24 w-24 mx-auto mb-4" />
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Auira AI
        </h1>
      </div>
    </div>
  );
};

export default LoadingScreen;