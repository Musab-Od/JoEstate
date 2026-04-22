import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Search, Users, Shield, Ban, CheckCircle, ExternalLink, ChevronDown, ChevronUp, Home, ShieldAlert, Tag, Key, MessageSquare, Edit3, Flag } from "lucide-react";
import { Link } from "react-router-dom";

const AdminUsers = () => {
    const [activeTab, setActiveTab] = useState("ALL_USERS");
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState([]);
    const [suspendedProps, setSuspendedProps] = useState([]);
    const [loading, setLoading] = useState(false);

    // ACCORDION STATE
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [accordionSubTab, setAccordionSubTab] = useState("PROPERTIES"); // PROPERTIES or REPORTS
    const [userProperties, setUserProperties] = useState({});
    const [userReports, setUserReports] = useState({});
    const [loadingAccordionData, setLoadingAccordionData] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setExpandedUserId(null);
        const token = localStorage.getItem("token");

        try {
            if (activeTab === "SUSPENDED_PROPERTIES") {
                const res = await axios.get("/admin/properties/suspended", { headers: { Authorization: `Bearer ${token}` } });
                setSuspendedProps(res.data);
            } else {
                const res = await axios.get(`/admin/users/search?query=${searchTerm}`, { headers: { Authorization: `Bearer ${token}` } });
                if (activeTab === "RESTRICTED_USERS") {
                    setData(res.data.filter(u => u.banStatus !== 'NONE'));
                } else {
                    setData(res.data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchData(); }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, activeTab]);

    // --- GRANULAR BAN STATUS WITH AUDIT TRAIL ---
    const handleBanStatusChange = async (userId, newStatus) => {
        // Force the admin to write an audit note!
        const auditNote = window.prompt(`You are changing this user's restriction to: ${newStatus}.\n\nPlease enter the mandatory audit note for the Archives:`);

        if (auditNote === null) return; // Admin clicked Cancel
        if (auditNote.trim() === "") {
            alert("Action aborted. An audit note is mandatory.");
            return;
        }

        const token = localStorage.getItem("token");
        try {
            // Send the status AND the notes to the backend
            await axios.put(`/admin/users/${userId}/ban?status=${newStatus}&notes=${encodeURIComponent(auditNote)}`, {}, { headers: { Authorization: `Bearer ${token}` } });

            setData(data.map(u => u.userId === userId ? { ...u, banStatus: newStatus } : u));
            if (activeTab === "RESTRICTED_USERS" && newStatus === 'NONE') {
                setData(prev => prev.filter(u => u.userId !== userId));
            }
            alert("Action executed and saved to Resolved Archives.");
        } catch (error) {
            alert("Action failed. Check console.");
        }
    };

    // --- ACCORDION HANDLER ---
    const toggleUserRow = async (userId) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
            return;
        }

        setExpandedUserId(userId);
        setAccordionSubTab("PROPERTIES"); // Default to properties

        if (!userProperties[userId] || !userReports[userId]) {
            setLoadingAccordionData(true);
            const token = localStorage.getItem("token");
            try {
                // Fetch both properties AND reports concurrently!
                const [propsRes, reportsRes] = await Promise.all([
                    axios.get(`/admin/users/${userId}/properties`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`/admin/users/${userId}/reports`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setUserProperties(prev => ({ ...prev, [userId]: propsRes.data }));
                setUserReports(prev => ({ ...prev, [userId]: reportsRes.data }));
            } catch (err) {
                console.error("Failed to fetch user data");
            } finally {
                setLoadingAccordionData(false);
            }
        }
    };

    const handleSuspendProperty = async (propertyId, currentStatus, userId = null) => {
        const action = currentStatus === 'SUSPENDED' ? 'Reactivate' : 'Suspend';
        if (!window.confirm(`Are you sure you want to ${action} this property?`)) return;

        const token = localStorage.getItem("token");
        try {
            await axios.put(`/admin/properties/${propertyId}/suspend-toggle`, {}, { headers: { Authorization: `Bearer ${token}` } });
            const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

            if (userId && userProperties[userId]) {
                setUserProperties(prev => ({
                    ...prev, [userId]: prev[userId].map(p => p.propertyId === propertyId ? { ...p, status: newStatus } : p)
                }));
            }

            if (activeTab === "SUSPENDED_PROPERTIES") {
                setSuspendedProps(prev => prev.filter(p => p.propertyId !== propertyId));
            }
        } catch (err) {
            alert("Failed to update property status.");
        }
    };

    const renderUserStatusBadge = (status) => {
        switch(status) {
            case 'NONE': return <span className="text-green-600 text-xs font-bold uppercase"><CheckCircle className="w-3 h-3 inline mr-1"/>Clean</span>;
            case 'BANNED': return <span className="text-red-600 text-xs font-bold uppercase"><Ban className="w-3 h-3 inline mr-1"/>Banned</span>;
            case 'MUTE_MESSAGES': return <span className="text-yellow-600 text-xs font-bold uppercase"><MessageSquare className="w-3 h-3 inline mr-1"/>Muted: Chat</span>;
            case 'MUTE_PUBLISHING': return <span className="text-orange-600 text-xs font-bold uppercase"><Edit3 className="w-3 h-3 inline mr-1"/>Muted: Pubs</span>;
            case 'MUTE_BOTH': return <span className="text-red-500 text-xs font-bold uppercase"><ShieldAlert className="w-3 h-3 inline mr-1"/>Muted: Both</span>;
            default: return <span className="text-slate-500 text-xs font-bold uppercase">{status}</span>;
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" /> Users & Properties
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage accounts, restrictions, and suspended listings.</p>
                </div>

                {activeTab !== "SUSPENDED_PROPERTIES" && (
                    <div className="relative w-full md:w-96">
                        <input
                            type="text" placeholder="Search users by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        />
                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                )}
            </div>

            <div className="flex flex-wrap space-x-1 bg-slate-200/50 p-1 rounded-xl w-full max-w-2xl mb-8">
                <button onClick={() => setActiveTab("ALL_USERS")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "ALL_USERS" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}>
                    <Users className="w-4 h-4" /> Users Directory
                </button>
                <button onClick={() => setActiveTab("RESTRICTED_USERS")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "RESTRICTED_USERS" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}>
                    <ShieldAlert className="w-4 h-4" /> Restricted Accounts
                </button>
                <button onClick={() => setActiveTab("SUSPENDED_PROPERTIES")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "SUSPENDED_PROPERTIES" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}>
                    <Home className="w-4 h-4" /> Suspended Listings
                </button>
            </div>

            {loading ? (
                <div className="p-10 font-bold text-slate-400 text-center animate-pulse">Scanning database...</div>
            ) : activeTab === "SUSPENDED_PROPERTIES" ? (
                /* --- SUSPENDED PROPERTIES --- */
                suspendedProps.length === 0 ? (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-bold">No suspended properties found.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {suspendedProps.map(prop => (
                            <div key={prop.propertyId} className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden flex flex-col">
                                <div className="bg-red-50 px-5 py-3 border-b border-red-100 flex justify-between items-center">
                                    <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-1 rounded uppercase flex items-center gap-1"><Ban className="w-3 h-3"/> Suspended</span>
                                    <span className="text-xs font-bold text-slate-400">ID: #{prop.propertyId}</span>
                                </div>
                                <div className="p-5 flex-grow">
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">{prop.title}</h3>
                                    <p className="text-sm text-slate-500 mb-3">Owned by: <span className="font-bold text-slate-700">{prop.ownerName}</span></p>
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                                    <button onClick={() => handleSuspendProperty(prop.propertyId, prop.status)} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-all">
                                        Reactivate Listing
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : data.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-bold">No users found.</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                            <th className="p-4 font-bold w-10"></th>
                            <th className="p-4 font-bold">User Identity</th>
                            <th className="p-4 font-bold">Contact</th>
                            <th className="p-4 font-bold">Account Status</th>
                            <th className="p-4 font-bold text-right">Adjust Restriction</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {data.map((user) => (
                            <React.Fragment key={user.userId}>
                                <tr className={`transition-colors hover:bg-slate-50 ${user.banStatus === 'BANNED' ? 'bg-red-50/20' : ''} ${expandedUserId === user.userId ? 'bg-blue-50/30' : ''}`}>
                                    <td className="p-4">
                                        <button onClick={() => toggleUserRow(user.userId)} className="p-1 text-slate-400 hover:text-blue-600 bg-slate-100 rounded transition">
                                            {expandedUserId === user.userId ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900 flex items-center gap-1">
                                            <Link to={`/user/${user.userId}`} target="_blank" className="hover:text-blue-600 transition">{user.firstName} {user.lastName}</Link>
                                            {user.role === 'ADMIN' && <Shield className="w-3 h-3 text-red-600" title="Admin" />}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">{user.email}</td>
                                    <td className="p-4">{renderUserStatusBadge(user.banStatus)}</td>
                                    <td className="p-4 text-right">
                                        {user.role !== 'ADMIN' && (
                                            <select
                                                value={user.banStatus}
                                                onChange={(e) => handleBanStatusChange(user.userId, e.target.value)}
                                                className="text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 outline-none hover:bg-slate-200 cursor-pointer transition"
                                            >
                                                <option value="NONE">Clear Restrictions</option>
                                                <option value="MUTE_MESSAGES">Mute Chat</option>
                                                <option value="MUTE_PUBLISHING">Mute Publishing</option>
                                                <option value="MUTE_BOTH">Mute Both</option>
                                                <option value="BANNED">Full Ban</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>

                                {/* ACCORDION CONTENT */}
                                {expandedUserId === user.userId && (
                                    <tr className="bg-slate-50 shadow-inner">
                                        <td colSpan="5" className="p-6 border-b border-slate-200">

                                            {/* Sub-Tab Navigation inside Accordion */}
                                            <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
                                                <button
                                                    onClick={() => setAccordionSubTab("PROPERTIES")}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${accordionSubTab === "PROPERTIES" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}
                                                >
                                                    <Home className="w-4 h-4" /> Published Listings ({userProperties[user.userId]?.length || 0})
                                                </button>
                                                <button
                                                    onClick={() => setAccordionSubTab("REPORTS")}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${accordionSubTab === "REPORTS" ? "bg-white text-purple-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}
                                                >
                                                    <Flag className="w-4 h-4" /> Report History ({userReports[user.userId]?.length || 0})
                                                </button>
                                            </div>

                                            {loadingAccordionData ? (
                                                <div className="text-slate-400 text-sm font-bold animate-pulse">Fetching user data...</div>
                                            ) : accordionSubTab === "PROPERTIES" ? (
                                                /* RENDER PROPERTIES */
                                                !userProperties[user.userId] || userProperties[user.userId].length === 0 ? (
                                                    <div className="text-slate-500 text-sm italic">This user has no properties.</div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                        {userProperties[user.userId].map(prop => {
                                                            let statusStyles = "bg-slate-100 text-slate-600 border-slate-200";
                                                            let StatusIcon = CheckCircle;
                                                            if (prop.status === 'ACTIVE') { statusStyles = "bg-green-50 text-green-700 border-green-200"; StatusIcon = CheckCircle; }
                                                            else if (prop.status === 'SOLD') { statusStyles = "bg-yellow-50 text-yellow-700 border-yellow-300"; StatusIcon = Tag; }
                                                            else if (prop.status === 'RENTED') { statusStyles = "bg-purple-50 text-purple-700 border-purple-200"; StatusIcon = Key; }
                                                            else if (prop.status === 'SUSPENDED') { statusStyles = "bg-red-50 text-red-700 border-red-200 shadow-sm"; StatusIcon = ShieldAlert; }

                                                            return (
                                                                <div key={prop.propertyId} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
                                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                                        <div className="font-bold text-slate-800 text-sm leading-snug truncate">{prop.title}</div>
                                                                        <Link to={`/properties/${prop.propertyId}`} target="_blank" className="shrink-0 p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition"><ExternalLink className="w-4 h-4" /></Link>
                                                                    </div>
                                                                    <div className="text-blue-700 text-xs font-black mb-4">{new Intl.NumberFormat('en-JO').format(prop.price)} JOD</div>
                                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${statusStyles}`}><StatusIcon className="w-3 h-3" /> {prop.status}</span>
                                                                        <button onClick={() => handleSuspendProperty(prop.propertyId, prop.status, user.userId)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${prop.status === 'SUSPENDED' ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'}`}>
                                                                            {prop.status === 'SUSPENDED' ? "Reactivate" : "Suspend"}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )
                                            ) : (
                                                /* RENDER REPORT HISTORY */
                                                !userReports[user.userId] || userReports[user.userId].length === 0 ? (
                                                    <div className="text-slate-500 text-sm italic">No reports associated with this user.</div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {userReports[user.userId].map(report => {
                                                            // Determine if the user is the Reporter or the one who got Reported
                                                            const isReporter = report.reporterEmail === user.email;

                                                            return (
                                                                <div key={report.reportId} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${isReporter ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                                                {isReporter ? 'They Reported Someone' : 'They Were Reported'}
                                                                            </span>
                                                                            <span className="text-xs font-bold text-slate-400">Report #{report.reportId}</span>
                                                                        </div>
                                                                        <p className="font-bold text-slate-900 text-sm">Reason: {report.reason}</p>
                                                                        {report.status.includes('RESOLVED') ? (
                                                                            <p className="text-xs text-green-600 font-bold mt-1"><CheckCircle className="w-3 h-3 inline mr-1"/>{report.status}</p>
                                                                        ) : (
                                                                            <p className="text-xs text-orange-500 font-bold mt-1"><AlertTriangle className="w-3 h-3 inline mr-1"/>PENDING INVESTIGATION</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <Link to="/admin/reports" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition inline-block">
                                                                            Go to Moderation Tab
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )
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