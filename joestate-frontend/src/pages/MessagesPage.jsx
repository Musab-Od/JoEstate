import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import { Send, Image as ImageIcon, Info, User, ShieldAlert } from "lucide-react";
import { useWebSocket } from "../context/WebSocketContext"
import React from "react"; // <-- Make sure React is imported for fragments

// --- NEW: DATE FORMATTER HELPER ---
const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }
    // E.g., "May 28, 2026"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const MessagesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const urlThreadId = queryParams.get("thread");
    const { setUnreadMessages } = useWebSocket();

    const [inbox, setInbox] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [stompClient, setStompClient] = useState(null);
    const [myEmail, setMyEmail] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    const chatContainerRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }

        const fetchData = async () => {
            try {
                const userRes = await axios.get("/users/me", { headers: { Authorization: `Bearer ${token}` } });
                setMyEmail(userRes.data.email);
                setCurrentUser(userRes.data);

                const inboxRes = await axios.get("/chat/inbox", { headers: { Authorization: `Bearer ${token}` } });
                const allThreads = inboxRes.data;

                if (urlThreadId) {
                    const threadToOpen = allThreads.find(t => t.threadId.toString() === urlThreadId);
                    if (threadToOpen) setActiveThread(threadToOpen);
                }

                const visibleInbox = allThreads.filter(thread =>
                    thread.lastMessage !== "No messages yet" || thread.threadId.toString() === urlThreadId
                );

                setInbox(visibleInbox);

            } catch (err) {
                console.error("Failed to load messaging data", err);
            }
        };
        fetchData();
    }, [navigate, urlThreadId]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (activeThread && token) {
            axios.get(`/chat/${activeThread.threadId}/history`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setMessages(res.data))
                .catch(err => console.error("Failed to load history", err));
        }
    }, [activeThread]);

    useEffect(() => {
        if (!activeThread) return;

        setInbox(prevInbox => {
            const currentThread = prevInbox.find(t => t.threadId === activeThread.threadId);
            if (currentThread && currentThread.unreadCount > 0) {
                setUnreadMessages(prev => Math.max(0, prev - 1));
            }
            return prevInbox.map(thread =>
                thread.threadId === activeThread.threadId ? { ...thread, unreadCount: 0 } : thread
            );
        });

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("🟢 Connected to WebSocket");
                client.subscribe(`/topic/thread/${activeThread.threadId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);

                    setMessages((prev) => [...prev, receivedMessage]);

                    setInbox((prevInbox) => {
                        const updatedInbox = prevInbox.map(thread => {
                            if (thread.threadId === activeThread.threadId) {
                                return { ...thread, lastMessage: receivedMessage.content, lastUpdatedAt: receivedMessage.timestamp };
                            }
                            return thread;
                        });
                        return updatedInbox.sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt));
                    });
                });
            },
        });

        client.activate();
        setStompClient(client);

        return () => client.deactivate();
    }, [activeThread]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !stompClient || !stompClient.connected) return;

        const messagePayload = {
            senderEmail: myEmail,
            receiverEmail: activeThread.otherUserEmail,
            content: newMessage.trim()
        };

        stompClient.publish({
            destination: `/app/chat/${activeThread.threadId}/send`,
            body: JSON.stringify(messagePayload)
        });

        setNewMessage("");
    };

    const isVideoThumbnail = activeThread?.propertyImageUrl &&
        (activeThread.propertyImageUrl.endsWith('.mp4') || activeThread.propertyImageUrl.endsWith('.webm'));

    return (
        <div className="bg-gray-50 flex h-[calc(100vh-80px)] border-t border-gray-200">

            {/* LEFT PANEL: Inbox */}
            <div className={`w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col ${activeThread ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-extrabold text-gray-800">Messages</h2>
                </div>
                <div className="overflow-y-auto flex-grow">
                    {inbox.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 font-medium">No messages yet.</div>
                    ) : (
                        inbox.map((thread) => (
                            <div
                                key={thread.threadId}
                                onClick={() => { setActiveThread(thread); navigate(`/messages?thread=${thread.threadId}`); }}
                                className={`p-4 border-b border-gray-50 cursor-pointer transition-colors flex gap-4 items-center ${activeThread?.threadId === thread.threadId ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-200 bg-gray-100 flex items-center justify-center">
                                    {thread.otherUserAvatarUrl ? <img src={`http://localhost:8080/uploads/${thread.otherUserAvatarUrl}`} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-400" />}
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <Link
                                            to={`/user/${thread.otherUserId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="font-bold text-gray-900 truncate hover:text-blue-600 transition"
                                        >
                                            {thread.otherUserName}
                                        </Link>
                                        {thread.unreadCount > 0 && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{thread.unreadCount}</span>}
                                    </div>
                                    <p className="text-xs font-bold text-blue-600 truncate mb-0.5">{thread.propertyTitle}</p>
                                    <p className="text-sm text-gray-500 truncate">{thread.lastMessage}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: The Chat Room */}
            <div className={`w-full md:w-2/3 flex flex-col bg-[#F8FAFC] ${!activeThread ? 'hidden md:flex items-center justify-center' : 'flex'}`}>

                {!activeThread ? (
                    <div className="text-center text-gray-400 space-y-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-medium text-lg">Select a conversation to start messaging</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveThread(null)} className="md:hidden text-gray-500 hover:text-blue-600 font-bold">← Back</button>

                                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100 relative">
                                    {activeThread.propertyImageUrl ? (
                                        isVideoThumbnail ? (
                                            <video
                                                src={`http://localhost:8080/uploads/${activeThread.propertyImageUrl}#t=0.1`}
                                                className="w-full h-full object-cover"
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                        ) : (
                                            <img
                                                src={`http://localhost:8080/uploads/${activeThread.propertyImageUrl}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )
                                    ) : (
                                        <ImageIcon className="w-6 h-6 m-4 text-gray-300" />
                                    )}
                                </div>

                                <div>
                                    <h2 className="font-bold text-gray-900 text-lg leading-tight">{activeThread.propertyTitle}</h2>
                                    <p className="text-blue-600 font-bold text-sm">{new Intl.NumberFormat('en-JO').format(activeThread.propertyPrice)} JOD</p>
                                </div>
                            </div>
                            <button onClick={() => navigate(`/properties/${activeThread.propertyId}`)} className="hidden sm:flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 border px-3 py-1.5 rounded-full font-bold transition">
                                <Info className="w-4 h-4" /> View Listing
                            </button>
                        </div>

                        {/* Chat Body: Messages (UPDATED WITH DATE SEPARATORS) */}
                        <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                            {messages.map((msg, index) => {
                                const isSentByMe = msg.senderName !== activeThread.otherUserName;

                                // --- SMART DATE CHECKER ---
                                const msgDate = new Date(msg.timestamp).toDateString();
                                const prevMsgDate = index > 0 ? new Date(messages[index - 1].timestamp).toDateString() : null;
                                const showDateDivider = msgDate !== prevMsgDate;

                                return (
                                    <React.Fragment key={index}>
                                        {/* Render the Date Pill if it's a new day */}
                                        {showDateDivider && (
                                            <div className="flex justify-center my-4">
                                                <span className="bg-gray-200/60 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                    {formatMessageDate(msg.timestamp)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Render the Message Bubble */}
                                        <div className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${isSentByMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                <p className="text-sm whitespace-pre-wrap break-words break-all">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isSentByMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )
                            })}
                        </div>

                        {/* Chat Footer */}
                        <div className="bg-white p-4 border-t border-gray-200">
                            {currentUser && (currentUser.banStatus === 'MUTE_MESSAGES' || currentUser.banStatus === 'BANNED' || currentUser.banStatus === 'MUTE_BOTH') ? (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center font-bold text-sm border border-red-200 flex flex-col items-center justify-center">
                                    <ShieldAlert className="w-5 h-5 mb-1" />
                                    Your account is restricted from sending messages.
                                </div>
                            ) : activeThread.propertyStatus !== 'ACTIVE' ? (
                                <div className="bg-gray-100 text-gray-500 p-3 rounded-xl text-center font-medium text-sm border border-gray-200 flex items-center justify-center gap-2">
                                    <Info className="w-4 h-4" /> This property is currently {activeThread.propertyStatus.toLowerCase()}. Messages are disabled.
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-grow bg-gray-50 border border-gray-200 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shrink-0 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                    >
                                        <Send className="w-5 h-5 -ml-1 mt-1" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;