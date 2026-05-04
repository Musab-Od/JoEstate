import { useState, useEffect } from "react";
import axios from "../api/axios";
import { User, Save, Camera, Mail, Lock, Building2, Heart, Settings, Plus, ShieldCheck, Clock, CheckCircle, XCircle, Upload, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchResultCard from "../components/SearchResultCard";

const ProfilePage = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("settings");
    const [user, setUser] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "", bio: "", profilePictureUrl: "", oldPassword: "", newPassword: "", confirmPassword: "" });

    const [myProperties, setMyProperties] = useState([]);
    const [myFavorites, setMyFavorites] = useState([]);

    // --- NEW: VERIFICATION TICKET STATES ---
    const [verificationTicket, setVerificationTicket] = useState(null);
    const [ticketMessage, setTicketMessage] = useState("");
    const [ticketFile, setTicketFile] = useState(null);
    const [submittingTicket, setSubmittingTicket] = useState(false);
    const [enterpriseName, setEnterpriseName] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };

                // Added the verification endpoint to the Promise.all!
                // We use .catch so if it fails (or user has no ticket), it doesn't break the dashboard
                const [userRes, propsRes, favsRes, ticketRes] = await Promise.all([
                    axios.get("/users/me", { headers }),
                    axios.get("/users/me/properties", { headers }),
                    axios.get("/users/me/favorites", { headers }),
                    axios.get("/users/me/verification", { headers }).catch(() => ({ data: null }))
                ]);

                setUser({ ...userRes.data, oldPassword: "", newPassword: "", confirmPassword: "" });

                const sortedProperties = propsRes.data.sort((a, b) => {
                    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
                    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
                    return 0;
                });
                setMyProperties(sortedProperties);

                setMyFavorites(favsRes.data);

                if (ticketRes && ticketRes.data) {
                    setVerificationTicket(ticketRes.data);
                }

            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

    const handleFavoriteChange = (propertyId, isLiked) => {
        setMyProperties(prevProps =>
            prevProps.map(prop => prop.propertyId === propertyId ? { ...prop, isFavorite: isLiked } : prop)
        );

        if (isLiked) {
            const propertyToAdd = myProperties.find(p => p.propertyId === propertyId);
            if (propertyToAdd && !myFavorites.some(f => f.propertyId === propertyId)) {
                setMyFavorites(prev => [...prev, { ...propertyToAdd, isFavorite: true }]);
            }
        } else {
            setMyFavorites(prev => prev.filter(item => item.propertyId !== propertyId));
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        if (user.newPassword && user.newPassword !== user.confirmPassword) {
            alert("Passwords do not match"); setSaving(false); return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.put("/users/me", user, { headers: { Authorization: `Bearer ${token}` } });
            alert("Profile Updated Successfully!");
            localStorage.setItem("user", user.firstName);
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post("/users/me/avatar", formData, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
            });
            setUser({ ...user, profilePictureUrl: res.data });
            window.location.reload();
        } catch (err) {
            alert("Failed to upload image");
        }
    };

    // --- NEW: SUBMIT TICKET HANDLER ---
    const handleTicketSubmit = async (e) => {
        e.preventDefault();
        if (!ticketFile || !ticketMessage.trim()) {
            return alert("Please provide both a document and a message for the review team.");
        }

        setSubmittingTicket(true);
        const formData = new FormData();
        formData.append("file", ticketFile);
        formData.append("message", ticketMessage);

        if (enterpriseName.trim()) {
            formData.append("enterpriseName", enterpriseName.trim());
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post("/users/me/verification", formData, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
            });

            // Refresh ticket data instantly
            const res = await axios.get("/users/me/verification", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVerificationTicket(res.data);
            setTicketMessage("");
            setEnterpriseName("");
            setTicketFile(null);

        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit ticket.");
        } finally {
            setSubmittingTicket(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-blue-600 font-bold">Loading Dashboard...</div>;

    const avatarUrl = user.profilePictureUrl ? `http://localhost:8080/uploads/${user.profilePictureUrl}` : null;
    const displayName = (user.isVerified && user.enterpriseName)
        ? user.enterpriseName
        : `${user.firstName} ${user.lastName}`;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            <div className="bg-blue-900 pt-10 pb-16 px-4">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full border-4 border-white/20 overflow-hidden bg-white shadow-lg">
                            {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-gray-300" />}
                        </div>
                        <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                            <Camera className="text-white w-8 h-8" />
                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                        </label>
                    </div>
                    <div className="text-center md:text-left text-white flex-grow">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-3xl font-bold">{displayName}</h1>
                            {/* Blue checkmark in header if verified! */}
                            {user.isVerified && <ShieldCheck className="w-6 h-6 text-blue-400" />}
                        </div>
                        <p className="text-blue-200 flex items-center justify-center md:justify-start gap-2 mt-1">
                            <Mail className="w-4 h-4" /> {user.email}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 mt-8">

                <div className="bg-white rounded-t-2xl shadow-sm border-b border-gray-100 flex overflow-x-auto overflow-y-hidden">
                    <button onClick={() => setActiveTab("settings")} className={`flex-1 min-w-[150px] py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === "settings" ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
                        <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={() => setActiveTab("listings")} className={`flex-1 min-w-[150px] py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === "listings" ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
                        <Building2 className="w-4 h-4" /> My Listings ({myProperties.length})
                    </button>
                    <button onClick={() => setActiveTab("favorites")} className={`flex-1 min-w-[150px] py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === "favorites" ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
                        <Heart className="w-4 h-4" /> Favorites ({myFavorites.length})
                    </button>
                    {/* NEW TAB */}
                    <button onClick={() => setActiveTab("verification")} className={`flex-1 min-w-[150px] py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === "verification" ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
                        <ShieldCheck className="w-4 h-4" /> Verification
                    </button>
                </div>

                <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-gray-100 p-6 min-h-[400px]">

                    {/* --- TAB 1: SETTINGS --- */}
                    {activeTab === "settings" && (
                        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl mx-auto pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-700 uppercase">First Name</label><input name="firstName" value={user.firstName} onChange={handleChange} className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                                <div><label className="text-xs font-bold text-gray-700 uppercase">Last Name</label><input name="lastName" value={user.lastName} onChange={handleChange} className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                            </div>
                            <div><label className="text-xs font-bold text-gray-700 uppercase">Phone Number</label><input name="phoneNumber" value={user.phoneNumber || ""} onChange={handleChange} className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-700 uppercase">Bio</label><textarea name="bio" rows="3" value={user.bio || ""} onChange={handleChange} className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>

                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-blue-600" /> Security</h3>
                                <div className="space-y-4">
                                    <div><label className="text-xs font-bold text-gray-700 uppercase">Email Address</label><input name="email" type="email" value={user.email} onChange={handleChange} className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                                    <div><label className="text-xs font-bold text-gray-700 uppercase">Current Password</label><input name="oldPassword" type="password" value={user.oldPassword} onChange={handleChange} placeholder="Required to save changes" className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-gray-700 uppercase">New Password</label><input name="newPassword" type="password" value={user.newPassword} onChange={handleChange} placeholder="Optional" className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400" /></div>
                                        <div><label className="text-xs font-bold text-gray-700 uppercase">Confirm</label><input name="confirmPassword" type="password" value={user.confirmPassword} onChange={handleChange} placeholder="Confirm" className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                                    </div>
                                </div>
                            </div>
                            <button disabled={saving} className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                                <Save className="w-5 h-5" /> {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    )}

                    {/* --- TAB 2: LISTINGS --- */}
                    {activeTab === "listings" && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Properties you are selling</h3>
                                <button onClick={() => navigate("/add-property")} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-blue-700">
                                    <Plus className="w-3 h-3" /> Add New
                                </button>
                            </div>
                            {myProperties.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">You haven't listed any properties yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myProperties.map(prop => (
                                        <SearchResultCard key={prop.propertyId} property={prop} onFavoriteToggle={handleFavoriteChange} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TAB 3: FAVORITES --- */}
                    {activeTab === "favorites" && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-6">Your Wishlist</h3>
                            {myFavorites.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No favorites yet. Go explore!</p>
                                    <button onClick={() => navigate("/")} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Browse Properties</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myFavorites.map(prop => (
                                        <SearchResultCard key={prop.propertyId} property={prop} isFavorited={true} onFavoriteToggle={handleFavoriteChange} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TAB 4: ENTERPRISE VERIFICATION --- */}
                    {activeTab === "verification" && (
                        <div className="max-w-2xl mx-auto pt-4 animate-in fade-in duration-300">
                            <h3 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-7 h-7 text-blue-600" /> Enterprise Verification
                            </h3>
                            <p className="text-gray-500 font-medium mb-8">
                                Earn the Blue Checkmark to build trust with buyers and show you are a verified real estate professional or agency.
                            </p>

                            {!user.isPremium ? (
                                /* SCENARIO A: Free User (Upsell) */
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-3xl p-8 text-center shadow-sm">
                                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Lock className="w-8 h-8 text-yellow-600" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-xl mb-2">Premium Feature Locked</h4>
                                    <p className="text-yellow-800 text-sm mb-6 max-w-sm mx-auto font-medium">
                                        You must have an active Premium Subscription to apply for Enterprise Verification and receive the Blue Checkmark.
                                    </p>
                                    {/* Link this to wherever your checkout modal is later */}
                                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-black py-3 px-8 rounded-xl transition shadow-lg shadow-yellow-200">
                                        Upgrade to Premium
                                    </button>
                                </div>
                            ) : verificationTicket ? (
                                /* SCENARIO B: User Has Submitted a Ticket */
                                <div className="space-y-6">
                                    {verificationTicket.status === 'PENDING' && (
                                        <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex items-start gap-4">
                                            <div className="bg-blue-100 p-3 rounded-full text-blue-600 shrink-0">
                                                <Clock className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-blue-900 text-lg">Under Review</h4>
                                                <p className="text-blue-700 text-sm font-medium mt-1">Our Trust & Safety team is currently reviewing your documents. This usually takes 24-48 hours.</p>
                                            </div>
                                        </div>
                                    )}

                                    {verificationTicket.status === 'APPROVED' && (
                                        <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex items-start gap-4">
                                            <div className="bg-green-100 p-3 rounded-full text-green-600 shrink-0">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-green-900 text-lg">Verification Approved</h4>
                                                <p className="text-green-700 text-sm font-medium mt-1">Congratulations! Your account is now verified. The Blue Checkmark is active on your profile and properties.</p>
                                            </div>
                                        </div>
                                    )}

                                    {verificationTicket.status === 'REJECTED' && (
                                        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-start gap-4">
                                            <div className="bg-red-100 p-3 rounded-full text-red-600 shrink-0">
                                                <XCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-red-900 text-lg">Verification Rejected</h4>
                                                <p className="text-red-700 text-sm font-medium mt-1 mb-3">Unfortunately, we could not verify your enterprise with the provided information.</p>
                                                <button onClick={() => setVerificationTicket(null)} className="text-sm font-bold text-red-600 bg-white border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition">
                                                    Submit a New Application
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin Reply Box (If Admin left a note) */}
                                    {verificationTicket.adminReply && (
                                        <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Message from Trust & Safety Team:</p>
                                            <p className="text-gray-800 font-medium italic">"{verificationTicket.adminReply}"</p>
                                        </div>
                                    )}

                                    <div className="pt-4 text-xs text-gray-400 font-bold uppercase tracking-wider text-center">
                                        Ticket ID: #{verificationTicket.requestId} • Submitted: {new Date(verificationTicket.submittedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ) : (
                                /* SCENARIO C: Premium User Applying */
                                <form onSubmit={handleTicketSubmit} className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-6">
                                        <h4 className="font-bold text-blue-900 mb-1">Application Requirements</h4>
                                        <p className="text-sm text-blue-700 font-medium">Please provide a brief description of your real estate business and upload a valid Commercial License, Agency ID, or National ID.</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-2 block">Enterprise / Agency Name (Optional)</label>
                                        <input
                                            type="text"
                                            value={enterpriseName}
                                            onChange={(e) => setEnterpriseName(e.target.value)}
                                            placeholder="E.g., Alexanders Real Estate (Leave blank if independent)"
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800 mb-6"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-2 block">Tell us about your business</label>
                                        <textarea
                                            rows="4"
                                            value={ticketMessage}
                                            onChange={(e) => setTicketMessage(e.target.value)}
                                            placeholder="E.g., I am an independent broker working in Amman for 5 years..."
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium text-gray-800"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-2 block">Upload Official Document</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition">
                                            <input
                                                type="file"
                                                id="docUpload"
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={(e) => setTicketFile(e.target.files[0])}
                                            />
                                            <label htmlFor="docUpload" className="cursor-pointer flex flex-col items-center">
                                                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                                    {ticketFile ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                                </div>
                                                <span className="font-bold text-gray-900 mb-1">
                                                    {ticketFile ? ticketFile.name : "Click to upload a document"}
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium">JPG, PNG, or PDF (Max 5MB)</span>
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        disabled={submittingTicket || !ticketMessage || !ticketFile}
                                        className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ShieldCheck className="w-5 h-5" />
                                        {submittingTicket ? "Submitting Application..." : "Submit Application for Review"}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;