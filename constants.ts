import { Plan } from './types';

export const PLAN_DETAILS = {
  [Plan.STARTER]: {
    name: 'Starter',
    price: 'Free',
    features: [
      'Standard AI replies',
      'Limited chat history',
    ],
  },
  [Plan.PRO]: {
    name: 'Pro',
    price: '£15/month',
    features: [
      'Faster, smoother AI replies',
      'Link websites for analysis',
      'Pick how the AI talks',
      'Remembers more of your past chats',
      'Save and reuse your best prompts',
      'Try upcoming tools early',
      'Small workflows (e.g., “summarize + format”)'
    ],
  },
  [Plan.ULTIMATE]: {
    name: 'Ultimate',
    price: '£25/month',
    features: [
      'All Pro Features+',
      'Clone websites with a link',
      'Generate downloadable code (HTML/CSS/JS)',
      'Multi-step workflows',
      'Run multiple commands automatically',
      'Fastest possible responses',
      'Full conversation memory',
    ],
  },
};