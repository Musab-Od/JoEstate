import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import axios from "../api/axios";

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const [globalStompClient, setGlobalStompClient] = useState(null);
    const [unreadMessages, setUnreadMessages] = useState(0); // This now represents Unread THREADS
    const [myEmail, setMyEmail] = useState("");
    const [notifTrigger, setNotifTrigger] = useState(0);

    // Helper to fetch the exact number of unread threads
    const fetchUnreadThreadsCount = useCallback(async (token) => {
        try {
            const inboxRes = await axios.get("/chat/inbox", { headers: { Authorization: `Bearer ${token}` } });
            // FIX: Count how many THREADS have unread messages, not total messages!
            const unreadThreadsCount = inboxRes.data.filter(thread => thread.unreadCount > 0).length;
            setUnreadMessages(unreadThreadsCount);
        } catch (err) {
            console.error("Failed to load global notification data", err);
        }
    }, []);

    // 1. Initial Load
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        axios.get("/users/me", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setMyEmail(res.data.email))
            .catch(err => console.error(err));

        fetchUnreadThreadsCount(token);
    }, [fetchUnreadThreadsCount]);

    // 2. Open the Global WebSocket Tunnel
    useEffect(() => {
        if (!myEmail) return;
        const token = localStorage.getItem("token");

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("🌍 Global WebSocket Connected!");

                client.subscribe(`/topic/user/${myEmail}`, (message) => {
                    const alert = JSON.parse(message.body);

                    if (alert.type === "NEW_MESSAGE") {
                        // 100% Accurate: Just re-check the threads count so we don't over-count!
                        fetchUnreadThreadsCount(token);
                    } else if (alert.type === "NEW_NOTIFICATION") {
                        setNotifTrigger(prev => prev + 1);
                    }
                });
            },
        });

        client.activate();
        setGlobalStompClient(client);

        return () => client.deactivate();
    }, [myEmail, fetchUnreadThreadsCount]);

    return (
        <WebSocketContext.Provider value={{
            globalStompClient,
            unreadMessages,
            setUnreadMessages,
            notifTrigger,
            myEmail
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};