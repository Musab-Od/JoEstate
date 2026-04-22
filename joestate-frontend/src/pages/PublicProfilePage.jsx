import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { User, Phone, MapPin, Flag, X, AlertTriangle, CheckCircle } from "lucide-react";
import SearchResultCard from "../components/SearchResultCard";

const PublicProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- REPORT USER MODAL STATE ---
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState("SCAMMER");
    const [reportComment, setReportComment] = useState("");
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [reportError, setReportError] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            try {
                // Fetch User Info
                const userRes = await axios.get(`/users/${userId}`);
                setProfile(userRes.data);

                // Fetch User Properties
                const propRes = await axios.get(`/properties/user/${userId}`);

                // --- GP2: SMART SORTING ---
                const sortedProperties = propRes.data.sort((a, b) => {
                    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
                    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
                    return 0;
                });
                setProperties(sortedProperties);

            } catch (err) {
                console.error("Failed to fetch public profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    useEffect(() => {
        // Teleport the user to their private dashboard if they try to view their own public link
        const checkIdentity = async () => {
            const token = localStorage.getItem("token");
            if (token && userId) {
                try {
                    const res = await axios.get("/users/me", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    // If the logged-in ID matches the URL ID, teleport them!
                    if (res.data.userId.toString() === userId.toString()) {
                        navigate("/profile", { replace: true });
                    }
                } catch(e) {
                    // Token invalid or expired, do nothing
                }
            }
        };
        checkIdentity();
    }, [userId, navigate]);

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        setIsSubmittingReport(true);
        setReportError("");

        try {
            await axios.post(`/reports/user/${userId}`, {
                reason: reportReason,
                comment: reportComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReportSuccess(true);
            setTimeout(() => {
                setIsReportModalOpen(false);
                setReportSuccess(false);
                setReportComment("");
                setReportError("");
            }, 3000);
        } catch (err) {
            console.error(err);
            // Smart Error Extraction from Spring Boot
            let errorMsg = "Failed to submit report. Please try again.";
            if (err.response && err.response.data) {
                errorMsg = typeof err.response.data === 'string'
                    ? err.response.data
                    : err.response.data.message || errorMsg;
            }
            setReportError(errorMsg);
        } finally {
            setIsSubmittingReport(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-blue-600 font-bold">Loading Agent Profile...</div>;
    if (!profile) return <div className="text-center py-20 text-red-500 font-bold">User not found.</div>;

    const avatarUrl = profile.profilePictureUrl
        ? `http://localhost:8080/uploads/${profile.profilePictureUrl}`
        : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">

            {/* --- REPORT USER MODAL --- */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className="bg-red-50 p-6 flex items-start justify-between border-b border-red-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-full text-red-600">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Report User</h3>
                                    <p className="text-sm text-red-600 font-medium">Our Trust & Safety team will review this profile.</p>
                                </div>
                            </div>
                            <button onClick={() => {
                                setReportError("");
                                setIsReportModalOpen(false);
                            }}
                                    className="text-gray-400 hover:text-gray-600 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        {reportSuccess ? (
                            <div className="p-8 text-center space-y-3">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900">Report Submitted</h4>
                                <p className="text-gray-500 font-medium">Thank you for keeping JoEstate safe. We will investigate this user.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleReportSubmit} className="p-6 space-y-5">
                                {reportError && (
                                    <div className="bg-red-50 text-red-700 text-sm font-bold p-3 rounded-xl border border-red-100 flex items-start gap-2 animate-in slide-in-from-top-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{reportError}</span>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Reason for reporting</label>
                                    <select
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none"
                                    >
                                        <option value="SCAMMER">Scammer or Fraudulent Agent</option>
                                        <option value="HARASSMENT">Harassment or Abusive Behavior</option>
                                        <option value="FAKE_PROFILE">Fake Profile or Impersonation</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Additional Comments (Optional)</label>
                                    <textarea
                                        rows="3"
                                        value={reportComment}
                                        onChange={(e) => setReportComment(e.target.value)}
                                        placeholder="Please provide any extra details to help our team..."
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium outline-none resize-none"
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReportError("");
                                            setIsReportModalOpen(false);
                                        }}
                                        className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingReport}
                                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isSubmittingReport ? "Sending..." : "Submit Report"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Header / Bio Section */}
            <div className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center md:items-start gap-8">

                    {/* Avatar */}
                    <div className="w-32 h-32 rounded-full border-4 border-gray-100 overflow-hidden flex-shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                <User className="w-12 h-12" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                            {profile.firstName} {profile.lastName}
                        </h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-600 font-medium mb-4">
                            {profile.phoneNumber && (
                                <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                                    <Phone className="w-4 h-4" /> {profile.phoneNumber}
                                </div>
                            )}
                            <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                                <MapPin className="w-4 h-4" /> Jordan
                            </div>
                        </div>

                        {profile.bio && (
                            <p className="text-gray-600 leading-relaxed max-w-2xl mb-4">
                                {profile.bio}
                            </p>
                        )}

                        {/* Report User Button */}
                        <div className="mt-2 flex justify-center md:justify-start">
                            <button
                                onClick={() => {
                                    if(!localStorage.getItem("token")) { navigate("/login"); return; }
                                    setIsReportModalOpen(true);
                                }}
                                className="text-xs font-bold text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                            >
                                <Flag className="w-3 h-3" /> Report this user
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Listings Section */}
            <div className="max-w-4xl mx-auto px-4 mt-10">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    Properties by {profile.firstName} <span className="text-gray-400 font-normal">({properties.length})</span>
                </h2>

                {properties.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed text-gray-500">
                        No active listings found for this user.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {properties.map(prop => (
                            <SearchResultCard key={prop.propertyId} property={prop} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfilePage;