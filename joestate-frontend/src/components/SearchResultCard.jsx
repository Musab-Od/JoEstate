import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, BedDouble, Bath, Square, Heart, CheckCircle } from "lucide-react"; // Added CheckCircle
import axios from "../api/axios";

// Accept new prop: onFavoriteToggle
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

            // NOTIFY THE PARENT (ProfilePage)
            if (onFavoriteToggle) {
                onFavoriteToggle(property.propertyId, newState);
            }

        } catch (err) {
            setIsLiked(!newState);
            console.error("Failed to toggle favorite:", err);
        }
    };

    // GP2: Helper to check if property is off market
    const isActive = !property.status || property.status === 'ACTIVE';

    return (
        <div
            onClick={() => navigate(`/properties/${property.propertyId}`)}
            // Apply grayscale and slight opacity if it's Sold/Rented to push attention to Active ones
            className={`bg-white border border-gray-100 rounded-2xl p-3 flex flex-col md:flex-row gap-4 hover:shadow-lg transition-all cursor-pointer group mb-4 relative ${!isActive ? 'opacity-80 grayscale-[40%]' : ''}`}
        >
            {/* Left: Image */}
            <div className="w-full md:w-64 h-48 md:h-auto flex-shrink-0 relative rounded-xl overflow-hidden">
                <img src={mainImage} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />

                <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                    {property.purpose === 'BUY' ? 'Sale' : 'Rent'}
                </div>

                {/* GP2: SOLD / RENTED BADGE */}
                {!isActive && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded uppercase shadow-md flex items-center gap-1 z-10">
                        <CheckCircle className="w-3 h-3" /> {property.status}
                    </div>
                )}
            </div>

            {/* Right: Info */}
            <div className="flex-grow flex flex-col justify-between py-1">
                <div>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{property.type}</span>
                        </div>

                        {/* Hide the favorite button if the property is sold and the user isn't the owner */}
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