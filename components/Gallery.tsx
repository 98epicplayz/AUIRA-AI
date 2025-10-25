import React from 'react';
import type { GalleryItem } from '../types';
import { GalleryItemType } from '../types';
import { TrashIcon } from './icons';

interface GalleryProps {
  items: GalleryItem[];
  onDeleteItem: (id: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ items, onDeleteItem }) => {
  const sortedItems = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="h-full bg-gray-800 text-white p-6 pt-20 overflow-y-auto animate-fade-in">
      <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        Your Gallery
      </h1>
      {sortedItems.length === 0 ? (
        <div className="flex items-center justify-center h-full -mt-16">
            <p className="text-gray-400">Your generated images and videos will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedItems.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg shadow-lg aspect-square bg-gray-900">
              {item.type === GalleryItemType.IMAGE ? (
                <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
              ) : (
                <video src={item.url} controls className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between">
                <p className="text-white text-sm line-clamp-3">{item.prompt}</p>
                <button 
                    onClick={() => onDeleteItem(item.id)} 
                    className="self-end p-2 rounded-full bg-red-500/50 hover:bg-red-500 transition-colors"
                    aria-label="Delete item"
                >
                    <TrashIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;