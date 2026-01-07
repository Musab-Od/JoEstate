import { useState, useEffect } from "react";
import axios from "../api/axios";
import { User, Save, Camera, Mail, Lock, Building2, Heart, Settings, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchResultCard from "../components/SearchResultCard";

const ProfilePage = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("settings");
    const [user, setUser] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "", bio: "", profilePictureUrl: "", oldPassword: "", newPassword: "", confirmPassword: "" });

    const [myProperties, setMyProperties] = useState([]);
    const [myFavorites, setMyFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };

                const [userRes, propsRes, favsRes] = await Promise.all([
                    axios.get("/users/me", { headers }),
                    axios.get("/users/me/properties", { headers }),
                    axios.get("/users/me/favorites", { headers })
                ]);

                setUser({ ...userRes.data, oldPassword: "", newPassword: "", confirmPassword: "" });
                setMyProperties(propsRes.data);
                setMyFavorites(favsRes.data);

            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

    // THE SMART HANDLER: Keeps everything in sync
    const handleFavoriteChange = (propertyId, isLiked) => {

        // 1. Update 'myProperties' so the heart color persists if we switch tabs
        setMyProperties(prevProps =>
            prevProps.map(prop =>
                prop.propertyId === propertyId
                    ? { ...prop, isFavorite: isLiked }
                    : prop
            )
        );

        // 2. Update 'myFavorites' List and Counter
        if (isLiked) {
            // Case A: ADDING to favorites
            // We need to find the full property object from 'myProperties' to add it to 'myFavorites'
            const propertyToAdd = myProperties.find(p => p.propertyId === propertyId);

            // Only add if found and not already in list (prevent duplicates)
            if (propertyToAdd && !myFavorites.some(f => f.propertyId === propertyId)) {
                setMyFavorites(prev => [...prev, { ...propertyToAdd, isFavorite: true }]);
            }
        } else {
            // Case B: REMOVING from favorites
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

    if (loading) return <div className="text-center py-20 text-blue-600 font-bold">Loading Dashboard...</div>;

    const avatarUrl = user.profilePictureUrl ? `http://localhost:8080/uploads/${user.profilePictureUrl}` : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            <div className="bg-blue-900 pt-10 pb-16 px-4">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full border-4 border-white/20 overflow-hidden bg-white shadow-lg">
                            {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-gray-300" />}
                        </div>
                        <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                            <Camera className="text-white w-8 h-8" />
                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                        </label>
                    </div>
                    <div className="text-center md:text-left text-white">
                        <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>
                        <p className="text-blue-200 flex items-center justify-center md:justify-start gap-2 mt-1">
                            <Mail className="w-4 h-4" /> {user.email}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-8">

                <div className="bg-white rounded-t-2xl shadow-sm border-b border-gray-100 flex overflow-hidden">
                    <button onClick={() => setActiveTab("settings")} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === "settings" ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
                        <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={() => setActiveTab("listings")} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === "listings" ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
                        <Building2 className="w-4 h-4" /> My Listings ({myProperties.length})
                    </button>
                    {/* COUNTER UPDATES AUTOMATICALLY NOW */}
                    <button onClick={() => setActiveTab("favorites")} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === "favorites" ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
                        <Heart className="w-4 h-4" /> Favorites ({myFavorites.length})
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
                                        <SearchResultCard
                                            key={prop.propertyId}
                                            property={prop}
                                            // PASS CALLBACK HERE TOO
                                            onFavoriteToggle={handleFavoriteChange}
                                        />
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
                                        <SearchResultCard
                                            key={prop.propertyId}
                                            property={prop}
                                            isFavorited={true}
                                            // PASS CALLBACK HERE TOO
                                            onFavoriteToggle={handleFavoriteChange}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;