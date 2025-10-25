
import { GoogleGenAI, type Content, Type, Part } from "@google/genai";
import type { User, AiSettings, Message, WebsiteCloneResponse } from '../types';
import { Plan, MessageAuthor } from '../types';

const getAiInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const WEBSITE_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;


const getSystemInstruction = (settings: AiSettings) => {
    switch (settings.personality) {
        case 'formal':
            return 'You are a professional, formal assistant.';
        case 'chill':
            return 'You are a relaxed, chill, and friendly assistant.';
        case 'creative':
            return 'You are a highly creative and imaginative assistant.';
        default:
            return 'You are Auira AI, a helpful assistant.';
    }
};

const mapMessagesToContent = (messages: Message[]): Content[] => {
    return messages
        .filter(msg => msg.id !== 'welcome-msg' && !msg.isLoading)
        .filter(msg => msg.text.trim() !== '' || msg.file) // Keep messages with files or text
        .map(message => {
            const parts: Part[] = [];
            if (message.text) {
                parts.push({ text: message.text });
            }
            // Only include images in history for vision model
            if (message.file && message.file.mimeType.startsWith('image/')) {
                parts.push({
                    inlineData: {
                        mimeType: message.file.mimeType,
                        data: message.file.data,
                    }
                });
            }
            return {
                role: message.author === MessageAuthor.USER ? 'user' : 'model',
                parts
            };
        });
};

export const generateText = async (promptMessage: Message, history: Message[], user: User, settings: AiSettings): Promise<string | WebsiteCloneResponse> => {
    try {
        const ai = getAiInstance();
        
        if (promptMessage.file && promptMessage.file.mimeType.startsWith('video/')) {
            return "I see you've sent a video. While I can't analyze video files directly yet, please describe it, and I'll do my best to help!";
        }
        
        const model = user.plan === Plan.ULTIMATE || user.plan === Plan.PRO ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        
        const urls = promptMessage.text.match(URL_REGEX);
        const isWebsiteUrl = urls && WEBSITE_REGEX.test(urls[0]);

        // Website cloning feature for Ultimate users
        if (user.plan === Plan.ULTIMATE && isWebsiteUrl) {
             const response = await ai.models.generateContent({
                model,
                contents: `Clone the website at this URL: ${urls[0]}. Provide the complete HTML, CSS, and JavaScript.`,
                config: {
                    systemInstruction: "You are an expert web developer. When given a URL, you generate the complete HTML, CSS, and JavaScript to create a functional, single-page clone of that website's landing page. You must respond ONLY with a JSON object matching the provided schema. Include a brief summary of the clone.",
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ["website_clone"] },
                            summary: { type: Type.STRING },
                            cloneData: {
                                type: Type.OBJECT,
                                properties: {
                                    html: { type: Type.STRING },
                                    css: { type: Type.STRING },
                                    js: { type: Type.STRING },
                                },
                                required: ["html", "css", "js"],
                            },
                        },
                        required: ["type", "summary", "cloneData"],
                    },
                }
            });

            // The response.text is a string, so we must parse it to get the JSON object
            // FIX: Trim whitespace from the response before parsing as JSON, as per Gemini API guidelines.
            const jsonResponse = JSON.parse(response.text.trim());
            return jsonResponse as WebsiteCloneResponse;
        }

        // Standard text/image generation
        const conversationHistory = mapMessagesToContent(history);
        
        const userParts: Part[] = [];
        if (promptMessage.text) {
            userParts.push({ text: promptMessage.text });
        }
        if (promptMessage.file && promptMessage.file.mimeType.startsWith('image/')) {
            userParts.push({
                inlineData: {
                    mimeType: promptMessage.file.mimeType,
                    data: promptMessage.file.data,
                }
            });
        }
        
        // If there's nothing to send (e.g., an empty message with a video file that got filtered out), return early.
        if (userParts.length === 0) {
            return "Please provide a prompt or an image to get started.";
        }
        
        const contents = [...conversationHistory, { role: 'user', parts: userParts }];


        const response = await ai.models.generateContent({
            model,
            contents: contents,
            config: {
                systemInstruction: getSystemInstruction(settings),
                temperature: settings.power === 'powerful' ? 1 : 0.7,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating text:", error);
        if (error instanceof SyntaxError) { // Catches JSON parsing errors
            return "Sorry, the AI returned an invalid response for the website clone. It might be a very complex site. Please try another one.";
        }
        return "Sorry, I encountered an error while processing your request.";
    }
};
