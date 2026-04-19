import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Users, Ban, Home, ShieldAlert, Activity, AlertTriangle, Archive, ChevronRight, Clock, UserPlus, Flag } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
    const [kpis, setKpis] = useState({
        totalUsers: 0, bannedUsers: 0, activeProperties: 0,
        suspendedProperties: 0, pendingReports: 0, resolvedReports: 0, pendingVerifications: 0
    });
    const [activityFeed, setActivityFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem("token");
            try {
                const [kpiRes, activityRes] = await Promise.all([
                    axios.get("/admin/kpis", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/admin/activity", { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setKpis(kpiRes.data);
                setActivityFeed(activityRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="p-10 text-xl font-bold text-slate-400 animate-pulse">Loading Platform Telemetry...</div>;

    // Helper to format timestamps relative to now
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMinutes = Math.round((now - date) / 60000);
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.round(diffHours / 24)}d ago`;
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <Activity className="w-8 h-8 text-blue-600" />
                    Platform Telemetry
                </h1>
                <p className="text-slate-500 font-medium mt-1">Live overview of JoEstate's ecosystem.</p>
            </div>

            {/* --- TOP: KPI CARDS --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Users</p>
                    <h3 className="text-2xl font-black text-slate-800">{kpis.totalUsers}</h3>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Banned</p>
                    <h3 className="text-2xl font-black text-red-600">{kpis.bannedUsers}</h3>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Listings</p>
                    <h3 className="text-2xl font-black text-green-600">{kpis.activeProperties}</h3>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Suspended</p>
                    <h3 className="text-2xl font-black text-orange-500">{kpis.suspendedProperties}</h3>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Reports</p>
                    <h3 className="text-2xl font-black text-blue-600">{kpis.pendingReports}</h3>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resolved Reports</p>
                    <h3 className="text-2xl font-black text-slate-600">{kpis.resolvedReports}</h3>
                </div>
            </div>

            {/* --- BOTTOM: SPLIT PANELS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT: ACTION REQUIRED */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" /> Action Required
                    </h2>

                    <div className="space-y-4">
                        {/* Reports Action Block */}
                        <div className={`p-4 rounded-2xl border ${kpis.pendingReports > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className={`font-bold ${kpis.pendingReports > 0 ? 'text-red-900' : 'text-slate-700'}`}>
                                        Moderation Queue
                                    </h3>
                                    <p className={`text-sm ${kpis.pendingReports > 0 ? 'text-red-700' : 'text-slate-500'}`}>
                                        {kpis.pendingReports > 0
                                            ? `You have ${kpis.pendingReports} unresolved property reports.`
                                            : "No pending reports to review."}
                                    </p>
                                </div>
                                <Link to="/admin/reports" className={`p-3 rounded-full transition ${kpis.pendingReports > 0 ? 'bg-red-600 text-white hover:bg-red-700 shadow-md' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>

                        {/* Verifications Action Block */}
                        <div className={`p-4 rounded-2xl border ${kpis.pendingVerifications > 0 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className={`font-bold ${kpis.pendingVerifications > 0 ? 'text-blue-900' : 'text-slate-700'}`}>
                                        Enterprise Verifications
                                    </h3>
                                    <p className={`text-sm ${kpis.pendingVerifications > 0 ? 'text-blue-700' : 'text-slate-500'}`}>
                                        {kpis.pendingVerifications > 0
                                            ? `You have ${kpis.pendingVerifications} verification requests waiting.`
                                            : "No pending verifications."}
                                    </p>
                                </div>
                                <Link to="/admin/verifications" className={`p-3 rounded-full transition ${kpis.pendingVerifications > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: LIVE AUDIT FEED */}
                <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 text-white">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" /> Live Audit Feed
                    </h2>

                    <div className="space-y-4">
                        {activityFeed.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 font-medium">No recent activity detected.</div>
                        ) : (
                            activityFeed.map((activity, idx) => (
                                <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-slate-800 transition">
                                    <div className="mt-1">
                                        {activity.type === "USER_JOINED" ? (
                                            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-full">
                                                <UserPlus className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <div className="p-2 bg-red-500/20 text-red-400 rounded-full">
                                                <Flag className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-medium text-slate-200">{activity.message}</p>
                                        <div className="flex items-center gap-1 mt-1 text-xs font-bold text-slate-500">
                                            <Clock className="w-3 h-3" /> {formatTimeAgo(activity.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;