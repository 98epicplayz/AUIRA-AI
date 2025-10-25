import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, type LiveSession, type LiveServerMessage, type Blob } from "@google/genai";
import { HomeIcon, LogoIcon } from './icons';

interface VoiceConversationProps {
  onExit: () => void;
}

// Helper functions for audio encoding/decoding as per Gemini documentation
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const VoiceConversation: React.FC<VoiceConversationProps> = ({ onExit }) => {
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [status, setStatus] = useState('Connecting...');

    const sessionPromiseRef = useRef<Promise<LiveSession>>();
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTimeRef = useRef(0);
    const aiSpeakingTimerRef = useRef<number | null>(null);

    useEffect(() => {
        let isMounted = true;

        const startSession = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                
                // Initialize AudioContexts
                // @ts-ignore
                inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
                // @ts-ignore
                outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
                const outputNode = outputAudioContextRef.current.createGain();

                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: async () => {
                            if (!isMounted) return;
                            setStatus('Connected. Start speaking.');
                            // Stream audio from the microphone to the model.
                            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                            if (!inputAudioContextRef.current) return;
                            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

                            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const pcmBlob = createBlob(inputData);
                                sessionPromiseRef.current?.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };
                            source.connect(scriptProcessorRef.current);
                            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                        },
                        onmessage: async (message: LiveServerMessage) => {
                           if (!isMounted || !outputAudioContextRef.current) return;

                            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                            if (base64EncodedAudioString) {
                                if (aiSpeakingTimerRef.current) clearTimeout(aiSpeakingTimerRef.current);
                                setIsAiSpeaking(true);

                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                                
                                const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContextRef.current, 24000, 1);
                                const source = outputAudioContextRef.current.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputNode);
                                source.addEventListener('ended', () => {
                                    sourcesRef.current.delete(source);
                                    if (sourcesRef.current.size === 0) {
                                       aiSpeakingTimerRef.current = window.setTimeout(() => setIsAiSpeaking(false), 500);
                                    }
                                });

                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                sourcesRef.current.add(source);
                            }
                             const interrupted = message.serverContent?.interrupted;
                            if (interrupted) {
                                for (const source of sourcesRef.current.values()) {
                                    source.stop();
                                }
                                sourcesRef.current.clear();
                                nextStartTimeRef.current = 0;
                                setIsAiSpeaking(false);
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            if (!isMounted) return;
                            console.error('Session error:', e);
                            setStatus('Error. Please try again.');
                        },
                        onclose: () => {
                            if (!isMounted) return;
                            setStatus('Session closed.');
                        },
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                        systemInstruction: 'You are Auira AI, a helpful and friendly voice assistant. Your name is pronounced "eye-yoo-ra". Please also respond when users call you by the phonetic spelling "iura".',
                    },
                });

            } catch (error) {
                console.error("Failed to start voice session:", error);
                setStatus('Could not start session. Check microphone permissions.');
            }
        };

        startSession();

        return () => {
            isMounted = false;
            // Cleanup on component unmount
            sessionPromiseRef.current?.then(session => session.close());
            streamRef.current?.getTracks().forEach(track => track.stop());
            scriptProcessorRef.current?.disconnect();
            inputAudioContextRef.current?.close();
            outputAudioContextRef.current?.close();
            if (aiSpeakingTimerRef.current) clearTimeout(aiSpeakingTimerRef.current);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-transparent flex flex-col items-center justify-center animate-fade-in">
            <button
                onClick={onExit}
                className="group absolute top-6 left-6 flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm p-3 rounded-full text-white transition-all duration-300 ease-in-out hover:w-32 hover:bg-gray-700"
                aria-label="Back to chat"
            >
                <HomeIcon className="w-6 h-6 flex-shrink-0" />
                <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto transition-all duration-300 overflow-hidden">Chat</span>
            </button>
            <div className="text-center">
                <div className={`relative transition-transform duration-300 ease-in-out ${isAiSpeaking ? 'scale-110' : ''}`}>
                    <LogoIcon className="h-48 w-48 mx-auto" />
                     <div className={`absolute inset-0 rounded-full border-4 border-purple-500/50 animate-pulse ${isAiSpeaking ? 'opacity-100' : 'opacity-0'}`} style={{ animationDuration: '2s' }}></div>
                </div>
                <h1 className="text-5xl mt-6 font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    Auira AI
                </h1>
                <p className="mt-4 text-lg text-gray-400">{status}</p>
            </div>
        </div>
    );
};

export default VoiceConversation;