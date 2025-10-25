import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ChatPanel from './components/ChatPanel';
import Settings from './components/Settings';
import Auth from './components/Auth';
import LoadingScreen from './components/LoadingScreen';
import PricingModal from './components/PricingModal';
import WebsitePreview from './components/WebsitePreview';
import VoiceConversation from './components/VoiceConversation';
import { HomeIcon, SettingsIcon } from './components/icons';
import type { User, Chat, Message, AiSettings, WebsiteCloneData } from './types';
import { Plan, View, MessageAuthor } from './types';

const defaultAiSettings: AiSettings = {
    power: 'balanced',
    personality: 'chill',
    advancedPersonalityEnabled: true,
    promptSavingEnabled: true,
    earlyAccessEnabled: true,
    smallWorkflowsEnabled: true,
    multiStepWorkflowsEnabled: true,
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(View.CHAT);
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings>(defaultAiSettings);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [websitePreview, setWebsitePreview] = useState<WebsiteCloneData | null>(null);


  const loadUserData = (userId: string) => {
    const savedChats = localStorage.getItem(`auiraChats_${userId}`);
    const savedSettings = localStorage.getItem(`auiraSettings_${userId}`);

    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0) {
        setActiveChatId(parsedChats[0].id);
      } else {
        createNewChat(true); 
      }
    } else {
      createNewChat(true);
    }
    if (savedSettings) setAiSettings({...defaultAiSettings, ...JSON.parse(savedSettings)});
  };
  
  // Load state from localStorage on initial mount
  useEffect(() => {
    const savedUserJSON = localStorage.getItem('auiraUser');
    if (savedUserJSON) {
      const parsedUser = JSON.parse(savedUserJSON) as User;
      setUser(parsedUser);
      loadUserData(parsedUser.id);
    }

    // Hide loading screen after a delay
    setTimeout(() => setIsLoading(false), 1500);
  }, []);


  const saveToLocalStorage = (key: string, data: any) => {
    if(user) {
        localStorage.setItem(`${key}_${user.id}`, JSON.stringify(data));
    }
  };

  useEffect(() => { saveToLocalStorage('auiraChats', chats) }, [chats, user]);
  useEffect(() => { saveToLocalStorage('auiraSettings', aiSettings) }, [aiSettings, user]);
  
  const handleAuth = (email: string) => {
    const userId = `user_${email}`; 
    const newUser: User = { id: userId, email, plan: Plan.STARTER };
    localStorage.setItem('auiraUser', JSON.stringify(newUser));
    setUser(newUser);
    loadUserData(userId);
  };

  const handleLogout = () => {
    localStorage.removeItem('auiraUser');
    setUser(null);
    setChats([]);
    setActiveChatId(null);
    setView(View.CHAT);
  };

  const createNewChat = (isInitial = false) => {
    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      name: `New Chat ${isInitial ? 1 : chats.length + 1}`,
      messages: [{id: 'welcome-msg', author: MessageAuthor.AUIRA, text: 'Hello! How can I help you today?'}]
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setView(View.CHAT);
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setView(View.CHAT);
  };
  
  const handleDeleteChat = (id: string) => {
    setChats(prevChats => {
      const newChats = prevChats.filter(chat => chat.id !== id);
      if (activeChatId === id) {
        const newActiveId = newChats.length > 0 ? newChats[0].id : null;
        setActiveChatId(newActiveId);
        if (newChats.length === 0) {
          setTimeout(() => createNewChat(true), 0);
        }
      }
      return newChats;
    });
  };

  const handleRenameChat = (id: string, newName: string) => {
    setChats(chats.map(chat => chat.id === id ? {...chat, name: newName} : chat));
  };
  
  const handleNewMessage = useCallback((message: Message, isContinuation = false) => {
      setChats(prevChats => {
          return prevChats.map(chat => {
              if (chat.id === activeChatId) {
                  const existingMsgIndex = chat.messages.findIndex(m => m.id === message.id);
                  let newMessages;
                  if (existingMsgIndex !== -1 && isContinuation) {
                      newMessages = [...chat.messages];
                      newMessages[existingMsgIndex] = message;
                  } else {
                      newMessages = [...chat.messages, message];
                  }
                  return { ...chat, messages: newMessages };
              }
              return chat;
          });
      });
  }, [activeChatId]);
  
  const handlePlanSelected = (plan: Plan) => {
    if (!user || plan === Plan.STARTER) return;

    const updatedUser = { ...user, plan };
    setUser(updatedUser);
    localStorage.setItem('auiraUser', JSON.stringify(updatedUser));
    
    setIsPricingModalOpen(false);
    alert(`Upgrade successful! Welcome to ${plan}.`);
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  const renderMainView = () => {
    if (view === View.CHAT && !activeChat && chats.length > 0) {
      return <div className="flex-1 flex items-center justify-center bg-gray-800 text-gray-400">Select or create a new chat to begin.</div>;
    }
    
    switch(view) {
        case View.CHAT:
            if (!activeChat) return null;
            return <ChatPanel 
                        activeChatMessages={activeChat.messages} 
                        user={user!}
                        onNewMessage={handleNewMessage}
                        aiSettings={aiSettings}
                        onCloneWebsite={setWebsitePreview}
                        onStartVoiceChat={() => setView(View.VOICE)}
                    />;
        case View.SETTINGS:
            return <Settings user={user!} settings={aiSettings} onSettingsChange={setAiSettings} onOpenPricingModal={() => setIsPricingModalOpen(true)} />;
        default:
            return null;
    }
  };

  if (isLoading) {
    return <LoadingScreen isVisible={true} />;
  }

  if (!user) {
    return (
      <>
        <LoadingScreen isVisible={false} />
        <Auth onAuth={handleAuth} />
      </>
    );
  }
  
  if (view === View.VOICE) {
    return <VoiceConversation onExit={() => setView(View.CHAT)} />;
  }

  return (
    <>
      <LoadingScreen isVisible={false} />
      <div className="h-screen w-screen bg-transparent text-white font-sans overflow-hidden">
         <TopBar 
            user={user} 
            onUpgradeClick={() => setIsPricingModalOpen(true)} 
            onSettingsClick={() => setView(View.SETTINGS)}
        />
        <div className="flex h-full w-full">
            <Sidebar 
              chats={chats}
              activeChatId={activeChatId}
              onNewChat={() => createNewChat(false)}
              onSelectChat={handleSelectChat}
              onDeleteChat={handleDeleteChat}
              onRenameChat={handleRenameChat}
              onLogout={handleLogout}
            />
            <main className="flex-1 flex flex-col relative">
                <div className="flex-1 h-full overflow-hidden">
                    <div key={view} className="h-full animate-fade-in">
                        {renderMainView()}
                    </div>
                </div>
                 {websitePreview && (
                    <WebsitePreview 
                        cloneData={websitePreview} 
                        onClose={() => setWebsitePreview(null)}
                    />
                )}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                    <div className="flex gap-4 bg-gray-900/50 backdrop-blur-md p-2 rounded-full shadow-lg">
                         <button onClick={() => setView(View.CHAT)} className={`p-3 rounded-full transition-colors ${view === View.CHAT ? 'bg-purple-600' : 'hover:bg-gray-700'}`} aria-label="Go to Home/Chat">
                            <HomeIcon className="w-6 h-6" />
                        </button>
                        <button onClick={() => setView(View.SETTINGS)} className={`p-3 rounded-full transition-colors ${view === View.SETTINGS ? 'bg-purple-600' : 'hover:bg-gray-700'}`} aria-label="Open Settings">
                            <SettingsIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
      </div>
      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)}
        onSelectPlan={handlePlanSelected}
        currentPlan={user.plan}
      />
    </>
  );
};

export default App;