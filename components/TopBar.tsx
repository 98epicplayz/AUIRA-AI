import React from 'react';
import type { User } from '../types';
import { SettingsIcon, LogoIcon } from './icons';

interface TopBarProps {
  user: User;
  onUpgradeClick: () => void;
  onSettingsClick: () => void;
}

const PlanBadge: React.FC<{ plan: string }> = ({ plan }) => {
  const baseClasses = "px-3 py-1 text-sm font-semibold rounded-full";
  const planClasses = {
    'Starter': "bg-gray-600 text-gray-200",
    'Pro': "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
    'Ultimate': "bg-gradient-to-r from-pink-500 to-purple-600 text-white",
  };
  return <span className={`${baseClasses} ${planClasses[plan] || planClasses.Starter}`}>{plan}</span>;
};


const TopBar: React.FC<TopBarProps> = ({ user, onUpgradeClick, onSettingsClick }) => {
  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-gray-900/50 backdrop-blur-sm text-white flex items-center px-4 md:px-6 z-30">
      <div className="flex items-center gap-3">
        <LogoIcon className="h-8 w-8"/>
        <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Auira AI</span>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-4">
            <PlanBadge plan={user.plan} />
            {user.plan !== 'Ultimate' && (
                <button
                    onClick={onUpgradeClick}
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:scale-105 transform transition-transform"
                >
                    Upgrade ✨
                </button>
            )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-400 hidden sm:block">{user.email}</span>
        <button onClick={onSettingsClick} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <SettingsIcon className="w-6 h-6 text-gray-300"/>
        </button>
      </div>
    </div>
  );
};

export default TopBar;
