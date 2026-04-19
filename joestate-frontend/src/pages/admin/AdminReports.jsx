import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Shield, AlertTriangle, Check, Ban, ExternalLink, Archive, FileText, ShieldAlert, CheckCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";

const AdminReports = () => {
    const [activeTab, setActiveTab] = useState("PENDING");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setSearchTerm(""); // Clear search when switching tabs
            const token = localStorage.getItem("token");
            let endpoint = "";

            if (activeTab === "PENDING") endpoint = "/admin/reports/pending";
            if (activeTab === "RESOLVED") endpoint = "/admin/reports/resolved";
            if (activeTab === "SUSPENDED") endpoint = "/admin/properties/suspended";

            try {
                const response = await axios.get(endpoint, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);

    const handleAction = async (reportId, actionName) => {
        if (actionName === "DELETE_PROPERTY" && !window.confirm("WARNING: Suspend this property from the platform?")) return;
        if (actionName === "BAN_USER" && !window.confirm("CRITICAL: Ban user and suspend all their properties?")) return;

        setProcessingId(reportId);
        const token = localStorage.getItem("token");

        try {
            await axios.put(`/admin/reports/${reportId}/resolve?action=${actionName}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(prev => prev.filter(r => r.reportId !== reportId));
        } catch (error) {
            alert("Action failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReactivate = async (propertyId) => {
        if (!window.confirm("Reactivate this property and make it visible to the public?")) return;
        const token = localStorage.getItem("token");
        try {
            await axios.put(`/admin/properties/${propertyId}/suspend-toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(prev => prev.filter(p => p.propertyId !== propertyId));
        } catch (err) {
            alert("Failed to reactivate property.");
        }
    };

    // --- SMART CLIENT-SIDE FILTERING ---
    const filteredData = data.filter(item => {
        // 1. Force the Resolved tab to ONLY show Dismissed reports
        if (activeTab === "RESOLVED" && item.status !== "RESOLVED_DISMISSED") return false;

        // 2. Apply the Search Term
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();

        if (activeTab === "SUSPENDED") {
            return item.title?.toLowerCase().includes(term) || item.ownerName?.toLowerCase().includes(term);
        } else {
            return item.propertyTitle?.toLowerCase().includes(term) ||
                item.reporterName?.toLowerCase().includes(term) ||
                item.reason?.toLowerCase().includes(term);
        }
    });

    return (
        <div className="p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-red-600" />
                        Moderation Command Center
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage active reports, view dismissed judgments, and audit suspended listings.</p>
                </div>

                {/* SEARCH BAR */}
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
                    />
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                </div>
            </div>

            {/* THE TAB NAVIGATION */}
            <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-full max-w-2xl mb-8">
                <button
                    onClick={() => setActiveTab("PENDING")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "PENDING" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}
                >
                    <AlertTriangle className="w-4 h-4" /> Action Queue
                </button>
                <button
                    onClick={() => setActiveTab("RESOLVED")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "RESOLVED" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}
                >
                    <Archive className="w-4 h-4" /> Dismissed Archive
                </button>
                <button
                    onClick={() => setActiveTab("SUSPENDED")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === "SUSPENDED" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}
                >
                    <ShieldAlert className="w-4 h-4" /> Suspended Vault
                </button>
            </div>

            {/* CONTENT AREA */}
            {loading ? (
                <div className="p-10 font-bold text-slate-400 text-center animate-pulse">Fetching records...</div>
            ) : filteredData.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
                    <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600 mb-1">Queue is Empty</h3>
                    <p className="text-slate-400">No records found matching your criteria.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                            {activeTab === "SUSPENDED" ? (
                                <>
                                    <th className="p-4 font-bold">Property Identity</th>
                                    <th className="p-4 font-bold">Owner</th>
                                    <th className="p-4 font-bold text-right">Admin Action</th>
                                </>
                            ) : (
                                <>
                                    <th className="p-4 font-bold">Property & Reporter</th>
                                    <th className="p-4 font-bold">Offense Details</th>
                                    <th className="p-4 font-bold text-right">{activeTab === "PENDING" ? "Actions" : "Resolution"}</th>
                                </>
                            )}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {filteredData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">

                                {/* ---------------- SUSPENDED TAB UI ---------------- */}
                                {activeTab === "SUSPENDED" && (
                                    <>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{item.title}</div>
                                            <Link to={`/properties/${item.propertyId}`} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                                View Evidence <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-700">{item.ownerName}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleReactivate(item.propertyId)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition">
                                                Reactivate Listing
                                            </button>
                                        </td>
                                    </>
                                )}

                                {/* ---------------- REPORTS UI ---------------- */}
                                {activeTab !== "SUSPENDED" && (
                                    <>
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-slate-900 mb-1">{item.propertyTitle}</div>
                                            <div className="text-xs text-slate-500 mb-2">Reported by: <span className="font-bold">{item.reporterName}</span></div>
                                        </td>

                                        <td className="p-4 align-top max-w-xs">
                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-bold mb-2">
                                                <AlertTriangle className="w-3 h-3" /> {item.reason}
                                            </div>
                                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                                "{item.comment || "No comment provided."}"
                                            </p>
                                        </td>

                                        <td className="p-4 align-top text-right">
                                            {activeTab === "PENDING" ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <button onClick={() => handleAction(item.reportId, "DISMISS")} className="w-32 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition">
                                                        Dismiss Report
                                                    </button>
                                                    {/* TERMINOLOGY FIXED HERE */}
                                                    <button onClick={() => handleAction(item.reportId, "DELETE_PROPERTY")} className="w-32 py-2 px-3 bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-bold rounded-lg border border-orange-200 transition">
                                                        Suspend Listing
                                                    </button>
                                                    <button onClick={() => handleAction(item.reportId, "BAN_USER")} className="w-32 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-md transition">
                                                        BAN SCAMMER
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase">
                                                    <FileText className="w-3 h-3" /> Dismissed
                                                </div>
                                            )}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminReports;