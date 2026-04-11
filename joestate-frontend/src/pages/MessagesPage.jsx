import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import { Send, Image as ImageIcon, Info, User } from "lucide-react";
import { useWebSocket } from "../context/WebSocketContext"

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

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // 1. Fetch User Email and Inbox on Mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }

        const fetchData = async () => {
            try {
                // Get my info
                const userRes = await axios.get("/users/me", { headers: { Authorization: `Bearer ${token}` } });
                setMyEmail(userRes.data.email);

                // Get my inbox
                const inboxRes = await axios.get("/chat/inbox", { headers: { Authorization: `Bearer ${token}` } });
                const allThreads = inboxRes.data;

                // If URL has a thread ID, open it!
                if (urlThreadId) {
                    const threadToOpen = allThreads.find(t => t.threadId.toString() === urlThreadId);
                    if (threadToOpen) setActiveThread(threadToOpen);
                }

                // GP2 FIX: Hide empty threads from the sidebar (unless it's the one I just opened to type in!)
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

    // 2. Fetch Chat History when a Thread is selected
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (activeThread && token) {
            axios.get(`/chat/${activeThread.threadId}/history`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setMessages(res.data))
                .catch(err => console.error("Failed to load history", err));
        }
    }, [activeThread]);

    // 3. Connect the WebSocket Engine!
    useEffect(() => {
        if (!activeThread) return;

// Clear the unread count in the UI the moment we open this chat
        setInbox(prevInbox => {
            const currentThread = prevInbox.find(t => t.threadId === activeThread.threadId);
            if (currentThread && currentThread.unreadCount > 0) {
                // Decrement the global red bubble in the Header!
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

                    // Add message to the chat window
                    setMessages((prev) => [...prev, receivedMessage]);

                    // Sync the Left Panel (Inbox) instantly!
                    setInbox((prevInbox) => {
                        const updatedInbox = prevInbox.map(thread => {
                            if (thread.threadId === activeThread.threadId) {
                                return { ...thread, lastMessage: receivedMessage.content, lastUpdatedAt: receivedMessage.timestamp };
                            }
                            return thread;
                        });
                        // Sort so the newest message jumps to the top!
                        return updatedInbox.sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt));
                    });
                });
            },
        });

        client.activate();
        setStompClient(client);

        return () => client.deactivate();
    }, [activeThread]);

    // 4. Safely Scroll to bottom (No jumping to footer!)
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // 5. Send Message Function
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !stompClient || !stompClient.connected) return;

        const messagePayload = {
            senderEmail: myEmail,
            receiverEmail: activeThread.otherUserEmail,
            content: newMessage.trim()
        };

        // Fire the message through the WebSocket tunnel
        stompClient.publish({
            destination: `/app/chat/${activeThread.threadId}/send`,
            body: JSON.stringify(messagePayload)
        });

        setNewMessage(""); // Clear input
    };

    return (
        <div className="bg-gray-50 flex h-[calc(100vh-80px)] border-t border-gray-200">

            {/* LEFT PANEL: Inbox (Hidden on mobile if chat is active) */}
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
                                        <h3 className="font-bold text-gray-900 truncate">{thread.otherUserName}</h3>
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
                        {/* Chat Header: Property Info */}
                        <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveThread(null)} className="md:hidden text-gray-500 hover:text-blue-600 font-bold">← Back</button>
                                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                    {activeThread.propertyImageUrl ? <img src={`http://localhost:8080/uploads/${activeThread.propertyImageUrl}`} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 m-4 text-gray-300" />}
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

                        {/* Chat Body: Messages */}
                        <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                            {messages.map((msg, index) => {
                                const isSentByMe = msg.senderName !== activeThread.otherUserName;

                                return (
                                    <div key={index} className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${isSentByMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                            {/* Added break-words and break-all to fix the long text bug */}
                                            <p className="text-sm whitespace-pre-wrap break-words break-all">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isSentByMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Chat Footer: Input Field (With Off-Market Logic) */}
                        <div className="bg-white p-4 border-t border-gray-200">
                            {activeThread.propertyStatus !== 'ACTIVE' ? (
                                <div className="bg-gray-100 text-gray-500 p-3 rounded-xl text-center font-medium text-sm border border-gray-200 flex items-center justify-center gap-2">
                                    <Info className="w-4 h-4" /> This property is currently marked as {activeThread.propertyStatus}. Messages are disabled.
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