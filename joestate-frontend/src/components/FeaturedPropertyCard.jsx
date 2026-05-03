import { MapPin, BedDouble, Bath, Square, PlayCircle, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FeaturedPropertyCard = ({ property }) => {
    const navigate = useNavigate();

    // Helper to format currency
    const formatPrice = (price) => new Intl.NumberFormat('en-JO').format(price);

    // Get image or placeholder
    const mainImage = property.imageUrls && property.imageUrls.length > 0
        ? `http://localhost:8080/uploads/${property.imageUrls[0]}`
        : "https://images.unsplash.com/photo-1600596542815-2495db98dada?auto=format&fit=crop&q=80&w=800";

    // --- SMART THUMBNAIL LOGIC ---
    const isVideoThumbnail = mainImage.endsWith('.mp4') || mainImage.endsWith('.webm');
    const isPremiumListing = property.isPremium;

    return (
        <div
            onClick={() => navigate(`/properties/${property.propertyId}`)}
            className={`group relative h-[400px] w-full rounded-3xl overflow-hidden cursor-pointer shadow-xl transition-all hover:shadow-2xl 
                ${isPremiumListing ? 'ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : ''}`}
        >
            {/* Background Image or Video */}
            {isVideoThumbnail ? (
                <div className="absolute inset-0 bg-black">
                    <video
                        src={`${mainImage}#t=0.1`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90"
                        muted
                        playsInline
                        preload="metadata"
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors z-10">
                        <PlayCircle className="w-16 h-16 text-white/90 drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
                    </div>
                </div>
            ) : (
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${mainImage})` }}
                />
            )}

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity z-10" />

            {/* VIP Badge */}
            {isPremiumListing && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-20 uppercase tracking-widest">
                    <Crown className="w-4 h-4" /> VIP
                </div>
            )}

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-20">
                {/* Badges */}
                <div className="flex gap-2 mb-3">
                    <span className="bg-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {property.purpose === 'BUY' ? 'For Sale' : 'For Rent'}
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full">
                        {property.type}
                    </span>
                </div>

                <h3 className="text-2xl font-bold mb-1 leading-tight">{property.title}</h3>
                <div className="flex items-center text-gray-300 text-sm mb-4">
                    <MapPin className="w-4 h-4 mr-1 text-blue-400" />
                    {property.location}
                </div>

                {/* Specs Row */}
                <div className="flex items-center justify-between border-t border-white/20 pt-4 mt-2">
                    <div className="flex gap-4 text-sm font-medium">
                        {property.type !== 'LAND' && (
                            <>
                                <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-blue-400"/> {property.roomCount}</span>
                                <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-blue-400"/> {property.bathCount}</span>
                            </>
                        )}
                        <span className="flex items-center gap-1"><Square className="w-4 h-4 text-blue-400"/> {property.area} m²</span>
                    </div>
                    <div className="text-xl font-bold text-blue-400">
                        {formatPrice(property.price)} <span className="text-xs text-white">JOD</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeaturedPropertyCard;