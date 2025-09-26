import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatMessage {
    senderId: string; 
    senderFirstName: string;
    senderEmail: string; 
    receiverId: string; 
    receiverEmail: string; 
    message: string;
    timestamp: number;
}

export interface ChatState { 
    unreadCounts: { [email: string]: number }; 
    history: { [conversationId: string]: ChatMessage[] }; 
    activeChatEmail: string | null; 
}

const initialState: ChatState = {
    unreadCounts: {},
    history: {},
    activeChatEmail: null,
};

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        incrementUnreadCount: (state, action: PayloadAction<{ senderEmail: string }>) => {
            const { senderEmail } = action.payload;
            state.unreadCounts[senderEmail] = (state.unreadCounts[senderEmail] || 0) + 1;
        },
        resetUnreadCount: (state, action: PayloadAction<{ receiverEmail: string }>) => {
            const { receiverEmail } = action.payload;
            state.unreadCounts[receiverEmail] = 0;
        },
        
        storeMessage: (state, action: PayloadAction<{ conversationId: string, message: ChatMessage }>) => {
            const { conversationId, message } = action.payload;
            
            if (!state.history[conversationId]) {
                state.history[conversationId] = [];
            }
            state.history[conversationId].push(message);
        },
        
        setActiveChat: (state, action: PayloadAction<{ email: string | null }>) => {
            state.activeChatEmail = action.payload.email;
        },

        clearChatState: (state) => {
            state.unreadCounts = {};
            state.history = {}; 
            state.activeChatEmail = null;
        },
    },
});

export const { 
    incrementUnreadCount, 
    resetUnreadCount, 
    storeMessage, 
    setActiveChat, 
    clearChatState 
} = chatSlice.actions;

export default chatSlice.reducer;