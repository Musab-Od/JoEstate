import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Menu, PlusCircle, Globe, Building2, ChevronDown, LayoutDashboard } from "lucide-react";

const Header = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");
    const [language, setLanguage] = useState("EN");

    // Menus State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);

    // Load User Data
    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        const savedLang = localStorage.getItem("lang");

        if (token) {
            setIsLoggedIn(true);
            setUserName(user || "User");
        }
        if (savedLang) setLanguage(savedLang);

        // Click outside listener for dropdown
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        navigate("/");
    };

    const toggleLanguage = () => {
        const newLang = language === "EN" ? "AR" : "EN";
        setLanguage(newLang);
        localStorage.setItem("lang", newLang);
    };

    // "Add Property" Logic
    const handleAddPropertyClick = (e) => {
        e.preventDefault();
        if (isLoggedIn) {
            navigate("/add-property");
        } else {
            // If guest, go to register (standard conversion tactic)
            navigate("/register");
        }
    };

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

                    {/* Language */}
                    <button onClick={toggleLanguage} className="hidden md:flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition text-sm font-bold border px-3 py-1.5 rounded-full hover:border-blue-200">
                        <Globe className="w-4 h-4" />
                        <span>{language}</span>
                    </button>

                    {/* GLOBAL ADD PROPERTY BUTTON (Visible to everyone) */}
                    <button
                        onClick={handleAddPropertyClick}
                        className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-blue-200 transition text-sm font-bold transform hover:-translate-y-0.5"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Add Property
                    </button>

                    {/* USER LOGIC */}
                    {isLoggedIn ? (
                        <div className="relative" ref={dropdownRef}>
                            {/* User Dropdown Trigger */}
                            <button
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                className="flex items-center gap-3 pl-4 border-l border-gray-200 ml-2 hover:opacity-80 transition"
                            >
                                <div className="text-right hidden md:block">
                                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Hello</p>
                                    <p className="text-sm font-bold text-gray-800 leading-none">{userName}</p>
                                </div>
                                <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* The Dropdown Menu */}
                            {isUserDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
                                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                                        <LayoutDashboard className="w-4 h-4" /> My Profile
                                    </Link>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Guest Links
                        <div className="flex items-center gap-3 pl-2">
                            <Link to="/login" className="text-gray-600 hover:text-blue-600 font-semibold text-sm transition">
                                Log In
                            </Link>
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
                        <button onClick={handleAddPropertyClick} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-bold">
                            <PlusCircle className="w-4 h-4" /> Add Property
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;