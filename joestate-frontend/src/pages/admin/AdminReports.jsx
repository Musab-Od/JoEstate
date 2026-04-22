import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import {
    Shield, AlertTriangle, CheckCircle, Search, User, Home,
    Archive, Lock, ExternalLink, MessageSquare, ChevronRight, X, Flag
} from "lucide-react";
import { Link } from "react-router-dom";

const AdminReports = () => {
    const [activeTab, setActiveTab] = useState("QUEUE"); // QUEUE, WORKSPACE, RESOLVED
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [adminProfile, setAdminProfile] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [resolveAction, setResolveAction] = useState("DISMISS");
    const [adminNotes, setAdminNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        axios.get("/users/me", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setAdminProfile(res.data))
            .catch(err => console.error(err));
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        let endpoint = activeTab === "QUEUE" ? "/admin/reports/queue" :
            activeTab === "WORKSPACE" ? "/admin/reports/workspace" : "/admin/reports/resolved";

        try {
            const response = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            setData(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSearchTerm("");
        fetchData();
    }, [activeTab]);

    const handleClaim = async (reportId) => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(`/admin/reports/${reportId}/claim`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setActiveTab("WORKSPACE");
        } catch (error) {
            alert(error.response?.data || "Failed to claim ticket.");
            fetchData();
        }
    };

    const openResolveModal = (report) => {
        setSelectedReport(report);
        setResolveAction("DISMISS");
        setAdminNotes("");
        setIsModalOpen(true);
    };

    const handleResolveSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem("token");

        try {
            await axios.put(`/admin/reports/${selectedReport.reportId}/resolve`, {
                action: resolveAction,
                notes: adminNotes || "No notes provided."
            }, { headers: { Authorization: `Bearer ${token}` } });

            setIsModalOpen(false);
            setData(prev => prev.filter(r => r.reportId !== selectedReport.reportId));
        } catch (error) {
            alert(error.response?.data || "Failed to resolve report.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter Logic
    const filteredData = data.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const idMatch = item.reportId.toString().includes(term);
        const targetMatch = (item.type === 'USER' ? item.reportedUserName : item.propertyTitle)?.toLowerCase().includes(term);
        return idMatch || targetMatch;
    });

    // Sub-component: Modular Report Card
    const ReportCard = ({ item }) => (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <div className={`px-5 py-3 border-b flex justify-between items-center ${activeTab === 'RESOLVED' ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50'}`}>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1 ${item.type === 'USER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.type === 'USER' ? <User className="w-3 h-3" /> : <Home className="w-3 h-3" />} {item.type}
                    </span>
                    <span className="text-xs font-bold text-slate-400">ID: #{item.reportId}</span>
                </div>
                {activeTab === 'RESOLVED' && (
                    <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded uppercase flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {item.status.replace('RESOLVED_', '')}
                    </span>
                )}
            </div>

            <div className="p-5 flex-grow space-y-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Identity</p>
                    <p className="font-bold text-slate-900 text-lg leading-tight mb-1">
                        {item.type === 'USER' ? item.reportedUserName : item.propertyTitle}
                    </p>
                    {item.type === 'PROPERTY' ? (
                        <Link to={`/properties/${item.propertyId}`} target="_blank" className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3"/> View Listing</Link>
                    ) : (
                        <Link to={`/user/${item.reportedUserId}`} target="_blank" className="text-xs text-purple-600 font-bold hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3"/> View Profile</Link>
                    )}
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-xs font-bold text-red-700 flex items-center gap-1 mb-2 uppercase tracking-wider"><AlertTriangle className="w-3 h-3" /> {item.reason}</p>
                    <p className="text-sm text-slate-700 font-medium italic">"{item.comment || "No specific details provided."}"</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Reported by: {item.reporterName}</p>
                </div>

                {activeTab === 'RESOLVED' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-1 uppercase tracking-wider"><MessageSquare className="w-3 h-3" /> Admin Audit Notes</p>
                        <p className="text-sm text-slate-800 font-medium">"{item.adminNotes}"</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Handled by: {item.assignedAdminName}</p>
                    </div>
                )}
            </div>

            {/* Contextual Action Button */}
            {activeTab !== 'RESOLVED' && (
                <div className="p-4 border-t border-slate-100 bg-white">
                    {activeTab === "QUEUE" ? (
                        <button onClick={() => handleClaim(item.reportId)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4" /> Take to Workspace
                        </button>
                    ) : (
                        <button onClick={() => openResolveModal(item)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                            Investigate & Resolve <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="p-8 relative">

            {/* RESOLUTION MODAL */}
            {isModalOpen && selectedReport && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-200">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Resolve Ticket #{selectedReport.reportId}</h3>
                                <p className="text-sm font-medium text-slate-500">Target: {selectedReport.type === 'USER' ? selectedReport.reportedUserName : selectedReport.propertyTitle}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleResolveSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Select Primary Action</label>
                                <select
                                    value={resolveAction}
                                    onChange={(e) => setResolveAction(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl focus:ring-blue-500 block p-3 outline-none"
                                >
                                    <option value="DISMISS">Dismiss Report (No Action)</option>
                                    {selectedReport.type === 'PROPERTY' && <option value="DELETE_PROPERTY">Suspend Property Listing</option>}
                                    <option value="MUTE_MESSAGES">Mute Chat Access Only</option>
                                    <option value="MUTE_PUBLISHING">Block Publishing Only</option>
                                    <option value="MUTE_BOTH">Mute BOTH (Chat & Publishing)</option>
                                    <option value="BAN_USER">CRITICAL: Full Permanent Ban</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Internal Audit Notes</label>
                                <textarea
                                    rows="4"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Explain your decision for the archives..."
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 block p-3 font-medium outline-none resize-none"
                                ></textarea>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition flex items-center justify-center gap-2">
                                {isSubmitting ? "Processing..." : "Execute Judgment"} <CheckCircle className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><Shield className="w-8 h-8 text-red-600" /> Moderation Queue</h1>
                    <p className="text-slate-500 font-medium mt-1">Claim tickets, audit evidence, and execute judgments.</p>
                </div>
                {activeTab === "RESOLVED" && (
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search by ID or Target..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        />
                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                )}
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex flex-wrap space-x-1 bg-slate-200/50 p-1 rounded-xl w-full max-w-2xl mb-8">
                <button onClick={() => setActiveTab("QUEUE")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "QUEUE" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}>
                    <AlertTriangle className="w-4 h-4" /> Global Queue
                </button>
                <button onClick={() => setActiveTab("WORKSPACE")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "WORKSPACE" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}>
                    <Lock className="w-4 h-4" /> My Workspace
                </button>
                <button onClick={() => setActiveTab("RESOLVED")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "RESOLVED" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}>
                    <Archive className="w-4 h-4" /> Resolved Archives
                </button>
            </div>

            {/* WORKSPACE GREETING */}
            {activeTab === "WORKSPACE" && adminProfile && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-8 flex justify-between items-center shadow-sm">
                    <div>
                        <h2 className="text-2xl font-black text-emerald-900">Welcome to your Workspace, {adminProfile.lastName || adminProfile.firstName}</h2>
                        <p className="text-emerald-700 font-medium mt-1">You have <span className="font-bold">{filteredData.length}</span> active case(s) claimed. Only you can resolve these.</p>
                    </div>
                    <div className="hidden md:flex w-16 h-16 bg-emerald-200 rounded-full items-center justify-center text-emerald-700 border-4 border-white shadow-sm">
                        <User className="w-8 h-8" />
                    </div>
                </div>
            )}

            {/* CONTENT AREA: GRID LAYOUT FOR CARDS */}
            {loading ? (
                <div className="p-10 font-bold text-slate-400 text-center animate-pulse">Syncing data...</div>
            ) : filteredData.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                    <Flag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600 mb-1">No reports found</h3>
                    <p className="text-slate-400">Everything looks clean and safe.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredData.map(item => <ReportCard key={item.reportId} item={item} />)}
                </div>
            )}
        </div>
    );
};

export default AdminReports;