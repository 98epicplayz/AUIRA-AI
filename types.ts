

export enum Plan {
  STARTER = 'Starter',
  PRO = 'Pro',
  ULTIMATE = 'Ultimate',
}

export interface User {
  id: string;
  email: string;
  plan: Plan;
}

export enum MessageAuthor {
  USER = 'user',
  AUIRA = 'auira',
}

export interface Message {
  id:string;
  author: MessageAuthor;
  text: string;
  isLoading?: boolean;
  linkPreview?: {
    url: string;
    type: 'image' | 'video' | 'website';
  };
  file?: {
    url: string; // Blob URL for preview
    mimeType: string;
    data: string; // base64 encoded data
  };
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
}

// FIX: Add missing GalleryItem and GalleryItemType to resolve compilation errors in Gallery.tsx
export enum GalleryItemType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface GalleryItem {
  id: string;
  type: GalleryItemType;
  url: string; // Blob URL for preview
  prompt: string;
  createdAt: string; // ISO string
}

export enum View {
  CHAT = 'chat',
  SETTINGS = 'settings',
  VOICE = 'voice',
}

export interface AiSettings {
  power: 'balanced' | 'powerful';
  personality: 'formal' | 'chill' | 'creative';
  // Pro features
  advancedPersonalityEnabled: boolean;
  promptSavingEnabled: boolean;
  earlyAccessEnabled: boolean;
  smallWorkflowsEnabled: boolean;
  // Ultimate features
  multiStepWorkflowsEnabled: boolean;
}

export interface WebsiteCloneData {
  html: string;
  css: string;
  js: string;
}

export interface WebsiteCloneResponse {
  type: 'website_clone';
  cloneData: WebsiteCloneData;
  summary: string;
}
