import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { ShieldCheck, FileText, CheckCircle, XCircle, Clock, ExternalLink, X, AlertTriangle, Archive, Users, Mail, Phone, Lock, User } from "lucide-react";

const AdminVerifications = () => {
    const [activeTab, setActiveTab] = useState("QUEUE"); // QUEUE, WORKSPACE, ARCHIVES, ROSTER
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adminProfile, setAdminProfile] = useState(null);

    // Modal States
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [adminReply, setAdminReply] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        axios.get("/users/me", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setAdminProfile(res.data))
            .catch(err => console.error(err));
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            let endpoint = "";
            if (activeTab === "QUEUE") endpoint = "/admin/verifications/queue";
            else if (activeTab === "WORKSPACE") endpoint = "/admin/verifications/workspace";
            else if (activeTab === "ARCHIVES") endpoint = "/admin/verifications/resolved";
            else if (activeTab === "ROSTER") endpoint = "/admin/verifications/roster";

            const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch verifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleClaim = async (requestId) => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(`/admin/verifications/${requestId}/claim`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setActiveTab("WORKSPACE");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to claim ticket.");
            fetchData();
        }
    };

    const handleResolve = async (actionToTake) => {
        if (actionToTake === "REJECT" && !adminReply.trim()) {
            return alert("Please provide a reason for rejection.");
        }
        setProcessing(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`/admin/verifications/${selectedTicket.requestId}/resolve`, {
                action: actionToTake,
                adminReply: adminReply.trim() || "Approved by Trust & Safety Team."
            }, { headers: { Authorization: `Bearer ${token}` } });

            setData(prev => prev.filter(v => v.requestId !== selectedTicket.requestId));
            setSelectedTicket(null);
            setAdminReply("");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to process verification.");
        } finally {
            setProcessing(false);
        }
    };

    const handleRevoke = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to revoke the Blue Checkmark for ${userName}?`)) return;
        try {
            const token = localStorage.getItem("token");
            await axios.put(`/admin/verifications/users/${userId}/revoke`, {}, { headers: { Authorization: `Bearer ${token}` } });

            // Remove them from the Roster tab visually
            setData(prev => prev.filter(u => u.userId !== userId));
            alert("Verification revoked successfully. They can now apply again.");
        } catch (err) {
            alert("Failed to revoke verification.");
        }
    };

    const openModal = (ticket) => {
        setSelectedTicket(ticket);
        setAdminReply(ticket.adminReply || "");
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-blue-600" /> Enterprise Verification
                </h1>
                <p className="text-slate-500 font-medium mt-1">Claim tickets to your workspace, verify documents, and manage the roster.</p>
            </div>

            {/* --- 4-TAB COMMAND CENTER --- */}
            <div className="flex flex-wrap space-x-1 bg-slate-200/50 p-1 rounded-xl w-full max-w-4xl mb-8">
                <button onClick={() => setActiveTab("QUEUE")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "QUEUE" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}>
                    <AlertTriangle className="w-4 h-4" /> Global Queue
                </button>
                <button onClick={() => setActiveTab("WORKSPACE")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "WORKSPACE" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}>
                    <Lock className="w-4 h-4" /> My Workspace
                </button>
                <button onClick={() => setActiveTab("ARCHIVES")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "ARCHIVES" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}>
                    <Archive className="w-4 h-4" /> Resolved Archives
                </button>
                <button onClick={() => setActiveTab("ROSTER")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "ROSTER" ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}>
                    <Users className="w-4 h-4" /> Verified Roster
                </button>
            </div>

            {/* WORKSPACE GREETING */}
            {activeTab === "WORKSPACE" && adminProfile && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-8 flex justify-between items-center shadow-sm">
                    <div>
                        <h2 className="text-2xl font-black text-emerald-900">Welcome to your Workspace, {adminProfile.lastName || adminProfile.firstName}</h2>
                        <p className="text-emerald-700 font-medium mt-1">You have <span className="font-bold">{data.length}</span> active verification(s) claimed. Only you can resolve these.</p>
                    </div>
                    <div className="hidden md:flex w-16 h-16 bg-emerald-200 rounded-full items-center justify-center text-emerald-700 border-4 border-white shadow-sm">
                        <User className="w-8 h-8" />
                    </div>
                </div>
            )}

            {loading ? (
                <div className="p-10 font-bold text-slate-400 text-center animate-pulse">Loading data...</div>
            ) : data.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                    <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600">Nothing to show</h3>
                    <p className="text-slate-400 font-medium mt-2">No records found for this category.</p>
                </div>
            ) : activeTab === "ROSTER" ? (
                /* --- VERIFIED ROSTER TAB --- */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {data.map(user => (
                        <div key={user.userId} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">
                                        {user.firstName} {user.lastName}
                                        <span className="text-slate-500 font-medium text-sm block mt-0.5">
                                            as <span className="font-bold text-blue-700">{user.enterpriseName || "Independent"}</span>
                                        </span>
                                    </h3>
                                </div>
                                <ShieldCheck className="w-8 h-8 text-blue-500 shrink-0" />
                            </div>
                            <div className="space-y-2 text-sm text-slate-600 mb-6">
                                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400"/> {user.email}</div>
                                {user.phoneNumber && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400"/> {user.phoneNumber}</div>}
                            </div>

                            {/* --- THE NEW REVOKE BUTTON --- */}
                            <div className="border-t border-slate-100 pt-4 mt-auto">
                                <button onClick={() => handleRevoke(user.userId, user.firstName)} className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition text-xs flex justify-center items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Revoke Badge
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* --- TICKETS TABLE (QUEUE, WORKSPACE, ARCHIVES) --- */
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                            <th className="p-4">Ticket ID</th>
                            <th className="p-4">Applicant / Agency</th>
                            <th className="p-4">Submitted At</th>
                            <th className="p-4">Status / Admin</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {data.map(ticket => (
                            <tr key={ticket.requestId} className="hover:bg-slate-50 transition">
                                <td className="p-4 font-medium text-slate-900">#{ticket.requestId}</td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-900">{ticket.userFullName}</div>
                                    <div className="text-xs text-blue-600 font-bold mt-0.5">{ticket.enterpriseName || "Independent"}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1 text-slate-500">
                                        <Clock className="w-3 h-3" /> {new Date(ticket.submittedAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {ticket.status === 'PENDING' && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1"><AlertTriangle className="w-3 h-3" /> PENDING</span>}
                                    {ticket.status === 'APPROVED' && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1"><CheckCircle className="w-3 h-3" /> APPROVED</span>}
                                    {ticket.status === 'REJECTED' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1"><XCircle className="w-3 h-3" /> REJECTED</span>}

                                    {ticket.assignedAdminName && (
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">By: {ticket.assignedAdminName}</div>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {activeTab === "QUEUE" ? (
                                        <button onClick={() => handleClaim(ticket.requestId)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition text-xs shadow-md flex items-center gap-1 ml-auto">
                                            <Lock className="w-3 h-3" /> Claim Ticket
                                        </button>
                                    ) : (
                                        <button onClick={() => openModal(ticket)} className="bg-slate-900 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition text-xs shadow-md">
                                            {activeTab === "WORKSPACE" ? "Investigate" : "View Record"}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- REVIEW/VIEW MODAL --- */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

                        <div className="bg-slate-50 p-5 flex justify-between items-center border-b border-slate-200">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6 text-blue-600" /> Ticket #{selectedTicket.requestId}
                                </h2>
                                <p className="text-sm font-medium text-slate-500 mt-1">Applicant: {selectedTicket.userFullName} ({selectedTicket.userEmail})</p>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-700 transition"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Enterprise Name Requested</label>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-900 font-bold">
                                        {selectedTicket.enterpriseName || "Independent Broker (Left Blank)"}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">User's Business Description</label>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                                        {selectedTicket.userMessage || "No message provided."}
                                    </div>
                                </div>
                                <hr className="border-slate-100" />
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Admin Reply (Sent to User)</label>
                                    <textarea
                                        rows="4"
                                        value={adminReply}
                                        onChange={(e) => setAdminReply(e.target.value)}
                                        disabled={activeTab === "ARCHIVES"}
                                        placeholder="Type your feedback here..."
                                        className={`w-full border border-slate-300 text-slate-900 text-sm rounded-xl p-4 outline-none resize-none shadow-sm ${activeTab === "ARCHIVES" ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white focus:ring-blue-500 focus:border-blue-500"}`}
                                    ></textarea>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Uploaded Document</span>
                                    <a href={`http://localhost:8080/uploads/${selectedTicket.documentUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 hover:underline">Open Full <ExternalLink className="w-3 h-3" /></a>
                                </label>
                                <div className="bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 h-[300px] flex items-center justify-center overflow-hidden relative group">
                                    {selectedTicket.documentUrl.endsWith('.pdf') ? (
                                        <div className="text-center">
                                            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                                            <p className="text-slate-500 font-bold text-sm">PDF Document</p>
                                        </div>
                                    ) : (
                                        <img src={`http://localhost:8080/uploads/${selectedTicket.documentUrl}`} alt="Document" className="w-full h-full object-contain bg-black/5" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-5 border-t border-slate-200 flex gap-4 justify-end">
                            <button onClick={() => setSelectedTicket(null)} className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition">
                                {activeTab === "ARCHIVES" ? "Close Record" : "Cancel"}
                            </button>

                            {activeTab === "WORKSPACE" && (
                                <>
                                    <button onClick={() => handleResolve("REJECT")} disabled={processing} className="px-6 py-3 bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 font-bold rounded-xl flex items-center gap-2 transition disabled:opacity-50">
                                        <XCircle className="w-5 h-5" /> Reject Application
                                    </button>
                                    <button onClick={() => handleResolve("APPROVE")} disabled={processing} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50">
                                        <CheckCircle className="w-5 h-5" /> Approve & Verify
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVerifications;