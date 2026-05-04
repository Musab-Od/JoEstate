import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, BedDouble, Bath, Square, Heart, CheckCircle, PlayCircle, Crown, ShieldCheck } from "lucide-react";
import axios from "../api/axios";

const SearchResultCard = ({ property, isFavorited = null, onFavoriteToggle }) => {
    const navigate = useNavigate();

    const [isLiked, setIsLiked] = useState(() => {
        if (isFavorited !== null) return isFavorited;
        return property.isFavorite || false;
    });

    useEffect(() => {
        if (isFavorited !== null) {
            setIsLiked(isFavorited);
        } else {
            setIsLiked(property.isFavorite || false);
        }
    }, [property.isFavorite, isFavorited]);

    const formatPrice = (price) => new Intl.NumberFormat('en-JO').format(price);

    const mainImage = property.imageUrls && property.imageUrls.length > 0
        ? `http://localhost:8080/uploads/${property.imageUrls[0]}`
        : "https://images.unsplash.com/photo-1600596542815-2495db98dada?auto=format&fit=crop&q=80&w=800";

    const isVideoThumbnail = mainImage.endsWith('.mp4') || mainImage.endsWith('.webm');

    const toggleFavorite = async (e) => {
        e.stopPropagation();
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        const newState = !isLiked;
        setIsLiked(newState);

        try {
            await axios.post(`/properties/${property.propertyId}/favorite`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (onFavoriteToggle) {
                onFavoriteToggle(property.propertyId, newState);
            }

        } catch (err) {
            setIsLiked(!newState);
            console.error("Failed to toggle favorite:", err);
        }
    };

    const isActive = !property.status || property.status === 'ACTIVE';
    const isPremiumListing = property.isPremium;

    return (
        <div
            onClick={() => navigate(`/properties/${property.propertyId}`)}
            className={`bg-white rounded-2xl p-3 flex flex-col md:flex-row gap-4 transition-all cursor-pointer group mb-4 relative
                ${!isActive ? 'opacity-80 grayscale-[40%]' : ''} 
                ${isPremiumListing
                ? 'border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.4)]'
                : 'border border-gray-100 hover:shadow-lg'
            }
            `}
        >
            <div className="w-full h-48 md:w-64 md:h-48 flex-shrink-0 relative rounded-xl overflow-hidden bg-gray-100">

                {isVideoThumbnail ? (
                    <div className="relative w-full h-full">
                        <video
                            src={`${mainImage}#t=0.1`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            muted
                            playsInline
                            preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                            <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
                        </div>
                    </div>
                ) : (
                    <img src={mainImage} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                )}

                {/* --- SMART TRUST BADGES (TOP RIGHT) --- */}
                <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                    {property.ownerIsVerified && (
                        <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase tracking-widest">
                            <ShieldCheck className="w-3 h-3" /> Verified
                        </div>
                    )}
                    {isPremiumListing && (
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase tracking-widest">
                            <Crown className="w-3 h-3" /> VIP
                        </div>
                    )}
                </div>

                {isActive && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-md z-10">
                        {property.purpose === 'BUY' ? 'Sale' : 'Rent'}
                    </div>
                )}

                {!isActive && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded uppercase shadow-md flex items-center gap-1 z-10">
                        <CheckCircle className="w-3 h-3" /> {property.status}
                    </div>
                )}
            </div>

            <div className="flex-grow flex flex-col justify-between py-1">
                <div>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{property.type}</span>
                        </div>

                        {isActive && (
                            <button
                                onClick={toggleFavorite}
                                className={`p-2 rounded-full transition-all duration-200 ${
                                    isLiked
                                        ? "bg-red-50 text-red-500"
                                        : "bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                }`}
                            >
                                <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                            </button>
                        )}
                    </div>

                    <h3 className={`text-lg font-bold mb-1 transition-colors ${isActive ? 'text-gray-900 group-hover:text-blue-600' : 'text-gray-700'}`}>
                        {property.title}
                    </h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                        <MapPin className="w-3 h-3" /> {property.location}
                    </p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex gap-4 text-sm text-gray-600">
                        {property.type !== 'LAND' && (
                            <>
                                <span className="flex items-center gap-1 font-bold"><BedDouble className="w-4 h-4 text-blue-500"/> {property.roomCount}</span>
                                <span className="flex items-center gap-1 font-bold"><Bath className="w-4 h-4 text-blue-500"/> {property.bathCount}</span>
                            </>
                        )}
                        <span className="flex items-center gap-1 font-bold"><Square className="w-4 h-4 text-blue-500"/> {property.area} m²</span>
                    </div>
                    <div className={`text-lg font-bold ${isActive ? 'text-blue-900' : 'text-gray-500 line-through decoration-red-500 decoration-2'}`}>
                        {formatPrice(property.price)} JOD
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchResultCard;