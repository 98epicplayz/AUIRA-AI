
import React from 'react';
import { Plan } from '../types';
import { PLAN_DETAILS } from '../constants';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: Plan) => void;
  currentPlan: Plan;
}

const PricingCard: React.FC<{plan: Plan, onSelect: () => void, isCurrent: boolean}> = ({ plan, onSelect, isCurrent }) => {
    const details = PLAN_DETAILS[plan];
    const isUltimate = plan === Plan.ULTIMATE;
    const isStarter = plan === Plan.STARTER;

    return (
        <div className={`p-6 rounded-lg border-2 flex flex-col ${isUltimate ? 'border-purple-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
            <h3 className={`text-2xl font-bold ${isUltimate ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500' : 'text-white'}`}>{details.name}</h3>
            <p className="text-3xl font-bold my-4 text-white">{details.price}</p>
            <ul className="space-y-2 text-gray-400 flex-grow mb-6">
                {details.features.map(feature => <li key={feature} className="flex items-center gap-2">✓<span>{feature}</span></li>)}
            </ul>
            {isStarter ? (
                 <button disabled className="w-full mt-auto p-3 rounded-lg bg-gray-600 text-gray-400 cursor-not-allowed">
                    Your Current Plan
                </button>
            ) : isCurrent ? (
                <button disabled className="w-full mt-auto p-3 rounded-lg bg-gray-600 text-gray-400 cursor-not-allowed">
                    Your Current Plan
                </button>
            ) : (
                <button onClick={onSelect} className={`w-full mt-auto p-3 font-semibold rounded-lg text-white transition-transform hover:scale-105 ${isUltimate ? 'bg-gradient-to-r from-pink-600 to-purple-600' : 'bg-purple-600'}`}>
                    {isCurrent ? 'Current Plan' : 'Upgrade'}
                </button>
            )}
        </div>
    );
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onSelectPlan, currentPlan }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 p-8 rounded-xl shadow-2xl max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-4xl font-bold text-center mb-6 text-white">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
            <PricingCard plan={Plan.STARTER} onSelect={() => {}} isCurrent={currentPlan === Plan.STARTER} />
            <PricingCard plan={Plan.PRO} onSelect={() => onSelectPlan(Plan.PRO)} isCurrent={currentPlan === Plan.PRO} />
            <PricingCard plan={Plan.ULTIMATE} onSelect={() => onSelectPlan(Plan.ULTIMATE)} isCurrent={currentPlan === Plan.ULTIMATE} />
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
