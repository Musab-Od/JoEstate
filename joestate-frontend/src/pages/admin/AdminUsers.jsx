import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Search, Users, Shield, ShieldCheck, Ban, CheckCircle, ExternalLink, ChevronDown, ChevronUp, Home, ShieldAlert, Tag, Key } from "lucide-react";
import { Link } from "react-router-dom";

const AdminUsers = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // ACCORDION STATE
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [userProperties, setUserProperties] = useState({});
    const [loadingProps, setLoadingProps] = useState(false);

    useEffect(() => {
        handleSearch("");
    }, []);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setSearched(true);
        setExpandedUserId(null); // Close any open accordions on new search
        const token = localStorage.getItem("token");

        try {
            const response = await axios.get(`/admin/users/search?term=${searchTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Failed to search users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBan = async (userId, currentStatus) => {
        const action = currentStatus ? "UNBAN" : "BAN";
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

        const token = localStorage.getItem("token");
        try {
            await axios.put(`/admin/users/${userId}/ban-toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.map(u => u.userId === userId ? { ...u, banned: !u.banned } : u));
        } catch (error) {
            alert("Action failed.");
        }
    };

    // --- NEW: ACCORDION HANDLER ---
    const toggleUserRow = async (userId) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null); // Close it if it's already open
            return;
        }

        setExpandedUserId(userId);

        // If we haven't fetched this user's properties yet, fetch them!
        if (!userProperties[userId]) {
            setLoadingProps(true);
            const token = localStorage.getItem("token");
            try {
                const res = await axios.get(`/admin/users/${userId}/properties`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserProperties(prev => ({ ...prev, [userId]: res.data }));
            } catch (err) {
                console.error("Failed to fetch user properties");
            } finally {
                setLoadingProps(false);
            }
        }
    };

    // --- NEW: INDIVIDUAL PROPERTY SUSPEND ---
    const handleSuspendProperty = async (propertyId, currentStatus, userId) => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(`/admin/properties/${propertyId}/suspend-toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update the local state
            const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
            setUserProperties(prev => ({
                ...prev,
                [userId]: prev[userId].map(p => p.propertyId === propertyId ? { ...p, status: newStatus } : p)
            }));
        } catch (err) {
            alert("Failed to suspend property.");
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        User Management
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Search accounts and inspect their listings.</p>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <input
                        type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                </form>
            </div>

            {loading ? (
                <div className="p-10 font-bold text-slate-400 text-center animate-pulse">Searching global database...</div>
            ) : users.length === 0 && searched ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400">No users found.</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                            <th className="p-4 font-bold w-10"></th>
                            <th className="p-4 font-bold">User Identity</th>
                            <th className="p-4 font-bold">Contact</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold text-right">Admin Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <React.Fragment key={user.userId}>
                                {/* MAIN USER ROW */}
                                <tr className={`transition-colors hover:bg-slate-50 ${user.banned ? 'bg-red-50/20' : ''} ${expandedUserId === user.userId ? 'bg-blue-50/30' : ''}`}>
                                    <td className="p-4">
                                        <button onClick={() => toggleUserRow(user.userId)} className="p-1 text-slate-400 hover:text-blue-600 bg-slate-100 rounded transition">
                                            {expandedUserId === user.userId ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900 flex items-center gap-1">
                                            {user.firstName} {user.lastName}
                                            {user.role === 'ADMIN' && <Shield className="w-3 h-3 text-red-600" />}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">{user.email}</td>
                                    <td className="p-4">
                                        {user.banned ? <span className="text-red-600 text-xs font-bold uppercase"><Ban className="w-3 h-3 inline mr-1"/>Banned</span> : <span className="text-green-600 text-xs font-bold uppercase"><CheckCircle className="w-3 h-3 inline mr-1"/>Active</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        {user.role !== 'ADMIN' && (
                                            <button onClick={() => handleToggleBan(user.userId, user.banned)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${user.banned ? "bg-slate-800 text-white" : "bg-red-50 text-red-600"}`}>
                                                {user.banned ? "Lift Ban" : "Ban User"}
                                            </button>
                                        )}
                                    </td>
                                </tr>

                                {/* HIDDEN ACCORDION ROW (PROPERTIES) */}
                                {expandedUserId === user.userId && (
                                    <tr className="bg-slate-50 shadow-inner">
                                        <td colSpan="5" className="p-6 border-b border-slate-200">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Home className="w-4 h-4 text-slate-400" /> User's Property Listings
                                            </h4>

                                            {loadingProps ? (
                                                <div className="text-slate-400 text-sm font-bold animate-pulse">Loading properties...</div>
                                            ) : !userProperties[user.userId] || userProperties[user.userId].length === 0 ? (
                                                <div className="text-slate-500 text-sm italic border-l-2 border-slate-300 pl-3">This user has not posted any properties.</div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {userProperties[user.userId].map(prop => {

                                                        // Dynamic Status Styling Dictionary
                                                        let statusStyles = "bg-slate-50 text-slate-600 border-slate-200";
                                                        let StatusIcon = CheckCircle;

                                                        if (prop.status === 'ACTIVE') {
                                                            statusStyles = "bg-green-50 text-green-700 border-green-200";
                                                            StatusIcon = CheckCircle;
                                                        } else if (prop.status === 'SOLD') {
                                                            statusStyles = "bg-yellow-50 text-yellow-700 border-yellow-300";
                                                            StatusIcon = Tag;
                                                        } else if (prop.status === 'RENTED') {
                                                            statusStyles = "bg-purple-50 text-purple-700 border-purple-200";
                                                            StatusIcon = Key;
                                                        } else if (prop.status === 'SUSPENDED') {
                                                            statusStyles = "bg-red-50 text-red-700 border-red-200 shadow-sm";
                                                            StatusIcon = ShieldAlert;
                                                        }

                                                        return (
                                                            <div key={prop.propertyId} className="group flex flex-col justify-between bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">

                                                                {/* Top: Full Title and Link */}
                                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                                    <div className="font-bold text-slate-800 text-sm leading-snug pr-2">
                                                                        {prop.title}
                                                                    </div>
                                                                    <Link
                                                                        to={`/properties/${prop.propertyId}`}
                                                                        target="_blank"
                                                                        className="shrink-0 p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition"
                                                                        title="View Full Listing"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4" />
                                                                    </Link>
                                                                </div>

                                                                {/* Middle: Details (Price & Date) */}
                                                                <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
                                                                    <span className="text-blue-700 font-black">
                                                                        {new Intl.NumberFormat('en-JO').format(prop.price)} JOD
                                                                    </span>
                                                                    <span>{new Date(prop.datePosted).toLocaleDateString('en-GB')}</span>
                                                                </div>

                                                                {/* Bottom: Status Badge & Admin Action */}
                                                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                                                                    {/* The Beautiful Status Badge */}
                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusStyles}`}>
                                                                        <StatusIcon className="w-3 h-3" />
                                                                            {prop.status}
                                                                    </span>

                                                                    {/* Suspend Toggle Button */}
                                                                    <button
                                                                        onClick={() => handleSuspendProperty(prop.propertyId, prop.status, user.userId)}
                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                                                            prop.status === 'SUSPENDED'
                                                                                ? 'bg-slate-800 text-white shadow-md hover:bg-slate-700'
                                                                                : 'bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                                                                        }`}
                                                                    >
                                                                        {prop.status === 'SUSPENDED' ? "Reactivate" : <><ShieldAlert className="w-3 h-3"/> Suspend</>}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;