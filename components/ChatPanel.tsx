import React, { useState, useRef, useEffect } from 'react';
import type { Message, User, AiSettings, WebsiteCloneData } from '../types';
import { MessageAuthor } from '../types';
import { generateText } from '../services/geminiService';
import { SendIcon, LogoIcon, LinkIcon, CloseIcon, MicrophoneIcon } from './icons';

interface ChatPanelProps {
  activeChatMessages: Message[];
  user: User;
  onNewMessage: (message: Message, isContinuation?: boolean) => void;
  aiSettings: AiSettings;
  onCloneWebsite: (data: WebsiteCloneData) => void;
  onStartVoiceChat: () => void;
}

const URL_REGEX = /(https?:\/\/|blob:https?:\/\/[^\s]+)/g;
const IMAGE_URL_REGEX = /\.(jpeg|jpg|gif|png|webp)$/i;
const VIDEO_URL_REGEX = /\.(mp4|webm|ogg)$/i;


const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.author === MessageAuthor.USER;

    const renderTextWithLinks = (text: string) => {
        const parts = text.split(URL_REGEX);
        return parts.map((part, index) => {
             if (URL_REGEX.test(part)) {
                const isImage = IMAGE_URL_REGEX.test(part);
                const isVideo = VIDEO_URL_REGEX.test(part);

                if (isImage) {
                    return <img key={index} src={part} alt="User provided content" className="mt-2 rounded-lg max-w-sm" />;
                }
                if (isVideo) {
                     return <video key={index} src={part} controls className="mt-2 rounded-lg max-w-sm" />;
                }
                return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline break-all">{part}</a>;
            }
            return part;
        });
    };

    return (
        <div className={`flex gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start animate-slide-in'}`}>
            {!isUser && <LogoIcon className="w-8 h-8 flex-shrink-0 mt-1" />}
            <div className={`p-4 rounded-2xl max-w-xl lg:max-w-3xl ${isUser ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                {message.isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-150"></div>
                    </div>
                ) : (
                   <div className="flex flex-col gap-2">
                        {message.file && (
                            <div>
                                {message.file.mimeType.startsWith('image/') ? (
                                    <img src={message.file.url} alt="User upload" className="rounded-lg max-w-sm" />
                                ) : (
                                    <video src={message.file.url} controls className="rounded-lg max-w-sm" />
                                )}
                            </div>
                        )}
                        {message.text && <div className="whitespace-pre-wrap">{renderTextWithLinks(message.text)}</div>}
                    </div>
                )}
            </div>
        </div>
    );
};


const ChatPanel: React.FC<ChatPanelProps> = ({ activeChatMessages, user, onNewMessage, aiSettings, onCloneWebsite, onStartVoiceChat }) => {
  const [input, setInput] = useState('');
  const [fileToSend, setFileToSend] = useState<{ url: string; mimeType: string; data: string; } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [activeChatMessages]);

  const handleSend = async () => {
    if (!input.trim() && !fileToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      author: MessageAuthor.USER,
      text: input,
      file: fileToSend,
    };
    onNewMessage(userMessage);
    
    setInput('');
    setFileToSend(null);
    
    const loadingMessage: Message = {
        id: (Date.now() + 1).toString(),
        author: MessageAuthor.AUIRA,
        text: '',
        isLoading: true,
    };
    onNewMessage(loadingMessage, true);
    
    try {
        const response = await generateText(userMessage, activeChatMessages, user, aiSettings);
        if (typeof response === 'string') {
            onNewMessage({ id: loadingMessage.id, author: MessageAuthor.AUIRA, text: response }, true);
        } else if (response.type === 'website_clone') {
            onNewMessage({ id: loadingMessage.id, author: MessageAuthor.AUIRA, text: response.summary }, true);
            onCloneWebsite(response.cloneData);
        }
    } catch (e) {
        console.error(e);
        onNewMessage({ id: loadingMessage.id, author: MessageAuthor.AUIRA, text: "An error occurred. Please try again later." }, true);
    }
  };
  
  const handleLinkClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          setFileToSend({
              url: fileUrl,
              mimeType: file.type,
              data: base64Data,
          });
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow selecting the same file again
    if(event.target) event.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-white relative pt-16">
      <div className="flex-grow overflow-y-auto p-6">
        {activeChatMessages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-6 bg-transparent">
        <div className="max-w-4xl mx-auto">
            {fileToSend && (
            <div className="mb-2 p-2 bg-gray-700/50 rounded-lg relative w-fit">
                {fileToSend.mimeType.startsWith('image/') ? (
                <img src={fileToSend.url} alt="Preview" className="h-24 rounded-md" />
                ) : (
                <video src={fileToSend.url} className="h-24 rounded-md" controls />
                )}
                <button
                onClick={() => setFileToSend(null)}
                className="absolute -top-2 -right-2 p-1 bg-gray-600 rounded-full text-white hover:bg-red-500 transition-colors"
                aria-label="Remove file"
                >
                <CloseIcon className="w-4 h-4" />
                </button>
            </div>
            )}
            <div className="flex items-center bg-gray-700/70 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <button
                onClick={handleLinkClick}
                className="p-2 rounded-full hover:bg-gray-600 transition-colors"
                aria-label="Attach file"
            >
                <LinkIcon className="w-6 h-6 text-gray-400" />
            </button>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*"
             />
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Auira anything, or paste a link..."
                className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none px-4"
                aria-label="Chat input"
            />
            <button
                onClick={onStartVoiceChat}
                className="p-3 rounded-full hover:bg-gray-600 transition-colors"
                aria-label="Start voice chat"
            >
                <MicrophoneIcon className="w-5 h-5 text-white" />
            </button>
            <button
                onClick={handleSend}
                className="bg-purple-600 hover:bg-purple-700 rounded-full p-3 transition-colors disabled:bg-gray-500"
                disabled={!input.trim() && !fileToSend}
                aria-label="Send message"
            >
                <SendIcon className="w-5 h-5 text-white" />
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;