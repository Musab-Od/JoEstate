import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios";
import { User, Phone, MapPin } from "lucide-react";
import SearchResultCard from "../components/SearchResultCard";

const PublicProfilePage = () => {
    const { userId } = useParams();
    const [profile, setProfile] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            try {
                // Fetch User Info
                const userRes = await axios.get(`/users/${userId}`);
                setProfile(userRes.data);

                // Fetch User Properties
                const propRes = await axios.get(`/properties/user/${userId}`);
                setProperties(propRes.data);
            } catch (err) {
                console.error("Failed to fetch public profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    if (loading) return <div className="text-center py-20 text-blue-600 font-bold">Loading Agent Profile...</div>;
    if (!profile) return <div className="text-center py-20 text-red-500 font-bold">User not found.</div>;

    const avatarUrl = profile.profilePictureUrl
        ? `http://localhost:8080/uploads/${profile.profilePictureUrl}`
        : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
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
                            <p className="text-gray-600 leading-relaxed max-w-2xl">
                                {profile.bio}
                            </p>
                        )}
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