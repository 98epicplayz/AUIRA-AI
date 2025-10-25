import React, { useState } from 'react';
import type { Chat } from '../types';
import { PlusIcon, LogoutIcon } from './icons';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newName: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onLogout,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const handleRename = (chat: Chat) => {
    setRenamingId(chat.id);
    setNewName(chat.name);
  };

  const handleRenameSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (newName.trim()) {
      onRenameChat(id, newName.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="w-64 bg-black/30 backdrop-blur-lg text-white flex flex-col h-full border-r border-gray-700/50 pt-16 z-10">
      <div className="p-4 flex-grow flex flex-col overflow-hidden">
        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            {chats.map((chat) => (
                <div
                key={chat.id}
                className={`group flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                    activeChatId === chat.id ? 'bg-gray-700/50' : 'hover:bg-gray-800/50'
                }`}
                onClick={() => onSelectChat(chat.id)}
                >
                {renamingId === chat.id ? (
                    <form onSubmit={(e) => handleRenameSubmit(e, chat.id)} className="flex-grow">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={(e) => handleRenameSubmit(e, chat.id)}
                        className="w-full bg-gray-600 text-white p-1 rounded"
                        autoFocus
                    />
                    </form>
                ) : (
                    <span className="flex-grow truncate">{chat.name}</span>
                )}
                <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleRename(chat);}} className="p-1 hover:text-purple-400">
                    ✏️
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id);}} className="p-1 hover:text-pink-500">
                    🗑️
                    </button>
                </div>
                </div>
            ))}
        </div>
      </div>
      <div className="p-4 border-t border-gray-700/50 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          New Chat
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
        >
          <LogoutIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;