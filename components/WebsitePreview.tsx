
import React, { useMemo } from 'react';
import type { WebsiteCloneData } from '../types';
import { CloseIcon, CodeIcon, GithubIcon } from './icons';

interface WebsitePreviewProps {
  cloneData: WebsiteCloneData;
  onClose: () => void;
}

const WebsitePreview: React.FC<WebsitePreviewProps> = ({ cloneData, onClose }) => {
  const { html, css, js } = cloneData;

  const srcDoc = useMemo(() => {
    return `
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
      </html>
    `;
  }, [html, css, js]);

  const handleDownload = (filename: string, content: string, mimeType: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-40 animate-fade-in">
        <div className="absolute top-0 right-0 h-full w-full md:w-3/4 lg:w-2/3 bg-gray-800 shadow-2xl flex flex-col transform transition-transform duration-500 ease-in-out" style={{ transform: 'translateX(0)', animation: 'slideInFromRight 0.5s ease-out' }}>
            <div className="p-4 bg-gray-900 flex items-center justify-between border-b border-gray-700/50">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Website Clone Preview</h2>
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        handleDownload('index.html', html, 'text/html');
                        handleDownload('style.css', css, 'text/css');
                        handleDownload('script.js', js, 'application/javascript');
                      }}
                      className="flex items-center gap-2 p-2 text-sm rounded-lg bg-gray-700 hover:bg-purple-600 transition-colors"
                      aria-label="Download code files"
                    >
                      <CodeIcon className="w-5 h-5" /> Download
                    </button>
                    <button 
                      onClick={() => alert('This would open a GitHub OAuth flow to create a new repository with these files.')}
                      className="flex items-center gap-2 p-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                      aria-label="Connect to GitHub"
                    >
                      <GithubIcon className="w-5 h-5" /> Connect
                    </button>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Close preview">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <div className="flex-grow bg-white">
                <iframe
                    srcDoc={srcDoc}
                    title="Website Preview"
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-none"
                />
            </div>
        </div>
        <style>{`
          @keyframes slideInFromRight {
            0% { transform: translateX(100%); }
            100% { transform: translateX(0); }
          }
        `}</style>
    </div>
  );
};

export default WebsitePreview;
