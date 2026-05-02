import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { User, LogOut, Menu, PlusCircle, Building2, ChevronDown, LayoutDashboard, Bell, MessageCircle, Heart, MessageSquare, ShieldAlert, ExternalLink, Crown } from "lucide-react";
import { useWebSocket } from "../context/WebSocketContext";
import PremiumCheckoutModal from "./PremiumCheckoutModal";

const Header = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Menus State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    // Notification State
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const { unreadMessages, notifTrigger } = useWebSocket(); // Global chat messages count

    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    // Ban State
    const [banStatus, setBanStatus] = useState("NONE");

    // 1. Load User Data & Fetch Notifications
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token) {
            setIsLoggedIn(true);
            setUserName(storedUser || "User");

            // Fetch User Avatar
            axios.get("/users/me", { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    setUserName(res.data.firstName);
                    setBanStatus(res.data.banStatus);
                    setIsPremium(res.data.isPremium);
                    if (res.data.profilePictureUrl) {
                        setAvatarUrl(`http://localhost:8080/uploads/${res.data.profilePictureUrl}`);
                    }
                })
                .catch(err => console.error("Failed to fetch user info", err));

            // Fetch Initial Notifications
            fetchNotifications(token);
        }

        // Click outside listener for BOTH dropdowns
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsUserDropdownOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) fetchNotifications(token);
    }, [notifTrigger]); // This makes the Bell update live without refreshing!

    const fetchNotifications = async (token) => {
        try {
            const res = await axios.get("/notifications", { headers: { Authorization: `Bearer ${token}` } });
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    // 2. Handle "Message Buyer" click from the notification dropdown
    const handleMessageBuyer = async (propertyId, buyerEmail, notificationId) => {
        const token = localStorage.getItem("token");
        try {
            // A. Mark notification as read
            await axios.put(`/notifications/${notificationId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });

            // B. Create/Get chat thread with the buyer
            const res = await axios.post(`/chat/start/${propertyId}/with-buyer?buyerEmail=${buyerEmail}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            const threadId = res.data;

            // C. Close dropdown and navigate to chat
            setIsNotifOpen(false);
            navigate(`/messages?thread=${threadId}`);

            // D. Refresh notifications locally to remove the red dot
            setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, read: true } : n));
        } catch (err) {
            console.error("Failed to start chat with buyer", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        setAvatarUrl(null);
        navigate("/");
        window.location.reload();
    };

    const handleAddPropertyClick = (e) => {
        e.preventDefault();
        isLoggedIn ? navigate("/add-property") : navigate("/register");
    };

    const unreadNotifsCount = notifications.filter(n => !n.read).length;

    return (
        <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">

                {/* 1. Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="bg-blue-600 p-2 rounded-lg transform group-hover:scale-105 transition duration-300 shadow-blue-200 shadow-md">
                        <Building2 className="text-white w-6 h-6" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-2xl font-extrabold text-blue-900 tracking-tight">
                          JO<span className="text-blue-600 font-light">ESTATE</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase pl-0.5">
                          Premium Listings
                        </span>
                    </div>
                </Link>

                {/* 2. Center Links */}
                <nav className="hidden md:flex gap-8 text-gray-500 font-medium text-sm">
                    <Link to="/" className="hover:text-blue-600 transition hover:bg-blue-50 px-3 py-1 rounded-full">Home</Link>
                    <Link to="/about" className="hover:text-blue-600 transition hover:bg-blue-50 px-3 py-1 rounded-full">About</Link>
                    <Link to="/contact" className="hover:text-blue-600 transition hover:bg-blue-50 px-3 py-1 rounded-full">Contact</Link>
                </nav>

                {/* 3. Right Section */}
                <div className="flex items-center gap-4">

                    {isLoggedIn && (
                        <div className="hidden md:flex items-center gap-2 mr-2">
                            {/* A. Chat Messages Icon */}
                            <Link to="/messages" className="relative p-2 text-gray-500 hover:text-blue-600 transition rounded-full hover:bg-blue-50">
                                <MessageCircle className="w-5 h-5" />
                                {unreadMessages > 0 && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                                        {unreadMessages}
                                    </span>
                                )}
                            </Link>

                            {/* B. System Notifications (Bell) Icon */}
                            <div className="relative" ref={notifRef}>
                                <button onClick={() => {
                                    setIsNotifOpen(!isNotifOpen);
                                    // NEW: If we are opening the menu and there are unread notifications, clear them!
                                    if (!isNotifOpen && unreadNotifsCount > 0) {
                                        const token = localStorage.getItem("token");
                                        axios.put("/notifications/read-all", {}, { headers: { Authorization: `Bearer ${token}` }})
                                            .catch(err => console.error("Failed to mark read", err));

                                        // Instantly turn off the red bubble in the UI
                                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                    }
                                }} className="relative p-2 text-gray-500 hover:text-blue-600 transition rounded-full hover:bg-blue-50">
                                    <Bell className="w-5 h-5" />
                                    {unreadNotifsCount > 0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                                            {unreadNotifsCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown Menu */}
                                {isNotifOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                            <h3 className="font-bold text-gray-800">Notifications</h3>
                                            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">{unreadNotifsCount} New</span>
                                        </div>

                                        <div className="max-h-80 overflow-y-auto overscroll-contain">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">No new notifications</div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div key={notif.notificationId} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                                                        <div className="flex gap-3">
                                                            {/* DYNAMIC ICON: Red Shield for System, Pink Heart for Favorites */}
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${notif.type === 'SYSTEM_ALERT' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-pink-100 border-pink-200 text-pink-500'}`}>
                                                                {notif.senderAvatarUrl ? (
                                                                    <img src={`http://localhost:8080/uploads/${notif.senderAvatarUrl}`} alt="User" className="w-full h-full rounded-full object-cover" />
                                                                ) : notif.type === 'SYSTEM_ALERT' ? (
                                                                    <ShieldAlert className="w-5 h-5" />
                                                                ) : (
                                                                    <Heart className="w-5 h-5 fill-current" />
                                                                )}
                                                            </div>

                                                            <div className="flex-grow">
                                                                <p className={`text-sm ${notif.type === 'SYSTEM_ALERT' ? 'font-bold text-red-700' : 'text-gray-800'}`}>
                                                                    {notif.content}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>

                                                                {/* DYNAMIC ACTION BUTTONS */}
                                                                {notif.type === 'FAVORITE' && notif.senderEmail && (
                                                                    <button
                                                                        onClick={() => handleMessageBuyer(notif.relatedId, notif.senderEmail, notif.notificationId)}
                                                                        className="mt-2 text-xs flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition"
                                                                    >
                                                                        <MessageSquare className="w-3 h-3" /> Message {notif.senderName}
                                                                    </button>
                                                                )}

                                                                {notif.type === 'SYSTEM_ALERT' && notif.relatedId && (
                                                                    <Link
                                                                        to={`/properties/${notif.relatedId}`}
                                                                        onClick={() => setIsNotifOpen(false)}
                                                                        className="mt-2 text-xs flex items-center gap-1 font-bold text-gray-600 hover:text-gray-900 transition"
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" /> Inspect Property
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* --- THE UPSELL: GO PREMIUM --- */}
                    {isLoggedIn && !isPremium && (
                        <button onClick={() => setIsCheckoutOpen(true)} className="hidden md:flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 px-4 py-2 rounded-full text-xs font-black shadow-lg shadow-yellow-500/30 hover:-translate-y-0.5 transition uppercase tracking-wide">
                            <Crown className="w-4 h-4" /> Go Premium
                        </button>
                    )}
                    {isLoggedIn && isPremium && (
                        <div className="hidden md:flex items-center gap-1.5 border border-yellow-400 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                            <Crown className="w-3 h-3 text-yellow-500" /> VIP
                        </div>
                    )}
                    {/* Add Property Button */}
                    {banStatus === 'MUTE_PUBLISHING' || banStatus === 'BANNED' || banStatus === 'MUTE_BOTH' ? (
                        <button disabled className="hidden md:flex items-center gap-2 bg-gray-200 text-gray-500 px-5 py-2.5 rounded-full text-sm font-bold cursor-not-allowed border border-gray-300">
                            <ShieldAlert className="w-4 h-4" /> Publishing Restricted
                        </button>
                    ) : (
                        <button
                            onClick={handleAddPropertyClick}
                            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-blue-200 transition text-sm font-bold transform hover:-translate-y-0.5"
                        >
                            <PlusCircle className="w-4 h-4" /> Add Property
                        </button>
                    )}

                    {/* USER LOGIC */}
                    {isLoggedIn ? (
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} className="flex items-center gap-3 pl-4 border-l border-gray-200 ml-2 hover:opacity-80 transition">
                                <div className="text-right hidden md:block">
                                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Hello</p>
                                    <p className="text-sm font-bold text-gray-800 leading-none">{userName}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                                    {avatarUrl ? <img src={avatarUrl} alt="User" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-500" />}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isUserDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                                    <Link to="/profile" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium">
                                        <LayoutDashboard className="w-4 h-4" /> My Profile
                                    </Link>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-medium">
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 pl-2">
                            <Link to="/login" className="text-gray-600 hover:text-blue-600 font-semibold text-sm transition">Log In</Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t p-4 space-y-3">
                    <Link to="/" className="block text-gray-700 font-medium">Home</Link>
                    <Link to="/about" className="block text-gray-700 font-medium">About</Link>
                    <Link to="/contact" className="block text-gray-700 font-medium">Contact</Link>
                    <div className="border-t pt-3">
                        {banStatus === 'MUTE_PUBLISHING' || banStatus === 'BANNED' ? (
                            <button disabled className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-500 py-2 rounded-lg font-bold cursor-not-allowed">
                                <ShieldAlert className="w-4 h-4" /> Publishing Restricted
                            </button>
                        ) : (
                            <button onClick={handleAddPropertyClick} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-bold">
                                <PlusCircle className="w-4 h-4" /> Add Property
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* The Premium Checkout Modal */}
            <PremiumCheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onSuccess={() => {
                    setIsCheckoutOpen(false);
                    alert("Welcome to Premium! Your account has been upgraded.");
                    window.location.reload(); // Reload to fetch new VIP status
                }}
            />
        </header>
    );
};

export default Header;