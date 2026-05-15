import React from "react";
import { BarChart3, Eye, PhoneCall, Heart, Activity, X, Lightbulb } from "lucide-react";

const AnalyticsModal = ({ property, onClose }) => {
    if (!property) return null;

    // Calculate Velocity
    const daysActive = Math.max(1, Math.floor((new Date() - new Date(property.datePosted)) / (1000 * 60 * 60 * 24)));
    const velocity = ((property.viewCount || 0) / daysActive).toFixed(1);

    // --- THE SMART INSIGHTS ENGINE ---
    let insight = {
        title: "Steady Performance",
        message: "Your listing is receiving normal traffic. Keep an eye on these numbers over the next few days.",
        color: "bg-blue-50 text-blue-800 border-blue-200",
        iconColor: "text-blue-500"
    };

    if ((property.viewCount || 0) > 50 && (property.phoneClickCount || 0) === 0) {
        insight = {
            title: "High Traffic, Low Conversion",
            message: "Buyers are looking at your property, but aren't reaching out. Consider updating your main photo or checking if your price is competitive.",
            color: "bg-orange-50 text-orange-800 border-orange-200",
            iconColor: "text-orange-500"
        };
    } else if ((property.favoriteCount || 0) >= 5) {
        insight = {
            title: "High Buyer Interest",
            message: `You have ${property.favoriteCount} buyers watching this listing! A small price drop will automatically notify all of them and could trigger a fast sale.`,
            color: "bg-emerald-50 text-emerald-800 border-emerald-200",
            iconColor: "text-emerald-500"
        };
    } else if (daysActive > 7 && (property.viewCount || 0) < 15) {
        insight = {
            title: "Low Visibility",
            message: "Traffic is a bit slow. Try editing your description to highlight key features (like 'Newly Renovated' or 'Near Transport') to boost search relevance.",
            color: "bg-purple-50 text-purple-800 border-purple-200",
            iconColor: "text-purple-500"
        };
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-indigo-600" /> Performance Analytics
                        </h2>
                        <p className="text-sm font-medium text-slate-500 mt-1 truncate max-w-md">
                            {property.title}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-full border border-slate-200 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body: The Metrics Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50">

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                            <Eye className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Views</p>
                            <p className="text-3xl font-black text-slate-900">{property.viewCount || 0}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-wider">Hot Lead</div>
                        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                            <PhoneCall className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Reveals</p>
                            <p className="text-3xl font-black text-slate-900">{property.phoneClickCount || 0}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center border border-pink-100 shrink-0">
                            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Wishlists</p>
                            <p className="text-3xl font-black text-slate-900">{property.favoriteCount || 0}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 shrink-0">
                            <Activity className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Daily Velocity</p>
                            <p className="text-3xl font-black text-slate-900">
                                {velocity}
                                <span className="text-sm text-slate-400 font-medium ml-1"> views/day</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer: Smart Insight Box */}
                <div className="p-6 bg-white border-t border-slate-200">
                    <div className={`p-4 rounded-xl border flex gap-4 items-start ${insight.color}`}>
                        <Lightbulb className={`w-6 h-6 shrink-0 mt-0.5 ${insight.iconColor}`} />
                        <div>
                            <h4 className="font-bold text-base mb-1">{insight.title}</h4>
                            <p className="text-sm font-medium leading-relaxed opacity-90">{insight.message}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsModal;