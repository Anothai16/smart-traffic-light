// SidePanelContent.tsx

import React, { useEffect, useState, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import { resetUnreadCount, storeMessage, setActiveChat } from '@/store/chat/index';
// REMOVED: import { socket } from '@/services/socket'
import { HiOutlineRefresh, HiOutlineChatAlt } from 'react-icons/hi'
import { Tag, Space, message } from 'antd';

export type SidePanelContentProps = {
    callBackClose: () => void
}

// Interface for chat messages
interface ChatMessage {
    senderId: string; // Previously Socket ID, now just a placeholder or user ID
    senderFirstName: string;
    senderEmail: string;
    receiverId: string; // Previously Socket ID
    receiverEmail: string;
    message: string;
    timestamp: number;
}

// Helper: Create a consistent Conversation ID
const getConversationId = (email1: string, email2: string) => {
    return [email1, email2].sort().join('-');
};

const SidePanelContent = (props: SidePanelContentProps) => {
    // States and Redux Hooks
    const currentUser = useAppSelector((state) => state.auth.user)
    
    // NOTE: onlineUsers was previously populated by socket. 
    // You might want to fetch this from an API instead.
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]) 
    
    const [chatTarget, setChatTarget] = useState<any>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState<string>('')

    // Redux Store
    const { unreadCounts, history } = useAppSelector((state: any) => state.chat);
    const dispatch = useAppDispatch();

    // IDs
    // REMOVED: const currentUserId = socket.id; 
    const currentUserId = "user-id-placeholder"; // Placeholder since socket.id is gone
    const currentUserEmail = currentUser.email;

    // Auto Scroll Logic
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 0);
    }
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // REMOVED: Socket Listeners useEffect (update_online_users, private_message)

    const handleRefresh = () => {
        // REMOVED: socket.emit('request_online_users')
        // TODO: Implement API call to fetch online users here
        console.log("Refresh clicked - Implement API fetch here");
    }

    // Function to start a chat
    const handleStartChat = (user: any) => {
        if (!currentUserEmail) {
            message.error("Cannot start chat. Your email is not available.");
            return;
        }

        setChatTarget(user)

        // 1. Set Active Chat Email
        dispatch(setActiveChat({ email: user.email }));

        // 2. Determine Conversation ID
        const conversationId = getConversationId(currentUserEmail, user.email);

        // 3. Load history from Redux
        const chatHistory = history[conversationId] || [];
        setMessages(chatHistory);

        // 4. Reset Unread Count
        dispatch(resetUnreadCount({ receiverEmail: user.email }));
    }

    // Function to close chat window
    const handleCloseChat = () => {
        setChatTarget(null);
        // 1. Clear Active Chat
        dispatch(setActiveChat({ email: null }));

        // 2. Callback to close parent drawer
        props.callBackClose();
    }

    // Function to send a message
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (
            inputMessage.trim() === '' ||
            !chatTarget ||
            !currentUserId ||
            !currentUser.firstName ||
            !currentUserEmail ||
            !chatTarget.email
        ) {
            return;
        }

        const messageData: ChatMessage = {
            senderId: currentUserId,
            senderFirstName: currentUser.firstName,
            senderEmail: currentUserEmail,
            receiverId: chatTarget.id || "unknown", // user.socketId is likely not available anymore
            receiverEmail: chatTarget.email,
            message: inputMessage,
            timestamp: Date.now(),
        };

        // 1. Conversation ID
        const conversationId = getConversationId(currentUserEmail, chatTarget.email);

        // 2. Store in Redux
        dispatch(storeMessage({ conversationId, message: messageData }));

        // REMOVED: socket.emit('send_private_message', messageData);
        // TODO: Implement API call to send message to backend here

        // 3. Update Local State
        setMessages((prev) => [...prev, messageData]);
        setInputMessage('');
    }

    // Filter users (logic might need adjustment depending on how you fetch onlineUsers now)
    const otherOnlineUsers = onlineUsers.filter(
        (user) => user.email !== currentUserEmail // Changed from socket.id check to email check
    )

    // --- RENDER ---

    // Chat Window View
    if (chatTarget) {
        return (
            <div className="p-4 flex flex-col h-full">
                {/* Chat Header */}
                <div className="flex items-center gap-2 border-b pb-4 mb-4">
                    <button onClick={handleCloseChat} className="text-xl mr-2">
                        &larr;
                    </button>
                    <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold text-lg">
                        {chatTarget.firstName?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{chatTarget.firstName}</p>
                        {/* Logic for 'Online' status might need update without socket */}
                        <p className={`text-sm ${onlineUsers.some(u => u.email === chatTarget.email) ? 'text-green-500' : 'text-gray-500'}`}>
                            {onlineUsers.some(u => u.email === chatTarget.email) ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[calc(100vh-200px)]">
                    {messages.map((msg, index) => {
                        const isMine = msg.senderEmail === currentUserEmail;
                        return (
                            <div key={index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs p-3 rounded-xl ${isMine ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}`}>
                                    {msg.message}
                                    <span className="block text-xs opacity-70 mt-1 text-right">
                                        {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Message ${chatTarget.firstName}...`}
                    />
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400" disabled={inputMessage.trim() === ''}>
                        Send
                    </button>
                </form>
            </div>
        )
    }

    // ---

    // Online Users List View
    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                    Online Users ({otherOnlineUsers.length})
                </h3>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                    <HiOutlineRefresh className="text-base" />
                    <span>Refresh</span>
                </button>
            </div>
            <div className="flex flex-col gap-4">
                {currentUser.firstName && (
                    <div className="flex items-center gap-2 border-b pb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                            {currentUser.firstName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">
                                {currentUser.firstName}
                            </p>
                            <p className="text-sm text-gray-500">You</p>
                        </div>
                    </div>
                )}
                
                {/* User List */}
                <ul className="space-y-4">
                    {otherOnlineUsers.map((user) => (
                        <li key={user.email} className="flex items-center justify-between gap-2"> {/* Changed key to email */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                                        {user.firstName?.charAt(0)}
                                    </div>
                                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-400"></span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {user.firstName}
                                    </p>
                                    <p className="text-sm text-gray-500">Online</p>
                                </div>
                            </div>

                            <Space size="middle">
                                {/* Notification Badge */}
                                {user.email && unreadCounts[user.email] > 0 && (
                                    <Tag color="red" className="animate-pulse">
                                        {unreadCounts[user.email]}
                                    </Tag>
                                )}

                                {/* Start Chat Button */}
                                <button
                                    onClick={() => handleStartChat(user)}
                                    className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-gray-100"
                                    title={`Start chat with ${user.firstName}`}
                                >
                                    <HiOutlineChatAlt className="text-xl" />
                                </button>
                            </Space>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default SidePanelContent