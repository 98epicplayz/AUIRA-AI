import React, { useState } from 'react';
import type { User, AiSettings } from '../types';
import { Plan } from '../types';
import { PLAN_DETAILS } from '../constants';

interface SettingsProps {
  user: User;
  settings: AiSettings;
  onSettingsChange: (newSettings: AiSettings) => void;
  onOpenPricingModal: () => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean;}> = ({ checked, onChange, disabled }) => (
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" disabled={disabled} />
        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
    </label>
);

const SettingRow: React.FC<{title: string; description: string; children: React.ReactNode; disabled?: boolean;}> = ({ title, description, children, disabled = false }) => (
    <div className={`flex justify-between items-center py-4 border-b border-gray-700/50 ${disabled ? 'opacity-50' : ''}`}>
        <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 max-w-sm">{description}</p>
        </div>
        <div className="flex-shrink-0">{children}</div>
    </div>
);

const Settings: React.FC<SettingsProps> = ({ user, settings, onSettingsChange, onOpenPricingModal }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'subscription'>('ai');
  const hasProFeatures = user.plan === Plan.PRO || user.plan === Plan.ULTIMATE;
  const hasUltimateFeatures = user.plan === Plan.ULTIMATE;

  const handleSettingChange = <K extends keyof AiSettings,>(key: K, value: AiSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };
  
  const currentPlanDetails = PLAN_DETAILS[user.plan];

  return (
    <div className="h-full bg-transparent text-white p-6 pt-20 overflow-y-auto">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 text-center">
        Settings
      </h1>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center border-b border-gray-700/50 mb-6">
            <button onClick={() => setActiveTab('ai')} className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'ai' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>AI Configuration</button>
            <button onClick={() => setActiveTab('subscription')} className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'subscription' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>Subscription</button>
        </div>

        {activeTab === 'ai' && (
            <div className="bg-black/30 backdrop-blur-lg p-6 rounded-lg animate-fade-in">
                <h2 className="text-xl font-bold mb-2 text-purple-300">AI Configuration</h2>
                <SettingRow title="AI Power" description="'Powerful' may be more creative but have rare inaccuracies. 'Balanced' is more reliable.">
                    <div className="flex bg-gray-700 rounded-full p-1">
                        <button onClick={() => handleSettingChange('power', 'balanced')} className={`px-4 py-1 rounded-full text-sm ${settings.power === 'balanced' ? 'bg-purple-600' : ''}`}>Balanced</button>
                        <button onClick={() => handleSettingChange('power', 'powerful')} className={`px-4 py-1 rounded-full text-sm ${settings.power === 'powerful' ? 'bg-purple-600' : ''}`}>Powerful</button>
                    </div>
                </SettingRow>

                <h2 className="text-xl font-bold mb-2 mt-8 text-purple-300">Pro Features</h2>
                <SettingRow title="AI Personality" description="Choose how you want Auira to talk to you." disabled={!hasProFeatures}>
                    <select 
                        value={settings.personality} 
                        onChange={(e) => handleSettingChange('personality', e.target.value as AiSettings['personality'])}
                        className="bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!hasProFeatures}
                    >
                        <option value="formal">Formal</option>
                        <option value="chill">Chill</option>
                        <option value="creative">Creative</option>
                    </select>
                </SettingRow>
                <SettingRow title="Enable Small Workflows" description="Use simple, multi-step commands like 'summarize + format'." disabled={!hasProFeatures}>
                    <ToggleSwitch checked={settings.smallWorkflowsEnabled} onChange={e => handleSettingChange('smallWorkflowsEnabled', e.target.checked)} disabled={!hasProFeatures} />
                </SettingRow>

                <h2 className="text-xl font-bold mb-2 mt-8 text-pink-400">Ultimate Features</h2>
                <SettingRow title="Enable Multi-step Workflows" description="Chain complex commands like 'summarize -> write script'." disabled={!hasUltimateFeatures}>
                    <ToggleSwitch checked={settings.multiStepWorkflowsEnabled} onChange={e => handleSettingChange('multiStepWorkflowsEnabled', e.target.checked)} disabled={!hasUltimateFeatures} />
                </SettingRow>
                
                {user.plan === Plan.STARTER && <p className="text-sm text-center text-gray-400 mt-8">Upgrade to Pro or Ultimate to unlock more powerful features and settings!</p>}
            </div>
        )}

        {activeTab === 'subscription' && (
             <div className="bg-black/30 backdrop-blur-lg p-6 rounded-lg animate-fade-in">
                <h2 className="text-xl font-bold mb-4 text-purple-300">Your Current Plan</h2>
                <div className="p-6 rounded-lg border-2 flex flex-col border-purple-500 bg-gray-800/50">
                    <h3 className={`text-2xl font-bold ${user.plan === Plan.ULTIMATE ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500' : 'text-white'}`}>{currentPlanDetails.name}</h3>
                    <p className="text-3xl font-bold my-4 text-white">{currentPlanDetails.price}</p>
                    <ul className="space-y-2 text-gray-400 flex-grow mb-6">
                        {currentPlanDetails.features.map(feature => <li key={feature} className="flex items-center gap-2">✓<span>{feature}</span></li>)}
                    </ul>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button onClick={onOpenPricingModal} className="w-full text-center p-3 font-semibold rounded-lg text-white transition-transform hover:scale-105 bg-purple-600">
                        Change Plan
                    </button>
                    <button onClick={() => alert('This would open the Stripe customer portal to manage your billing details and cancel your subscription.')} className="w-full text-center p-3 font-semibold rounded-lg text-white transition-transform hover:scale-105 bg-gray-600">
                        Manage Subscription
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Settings;