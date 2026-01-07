import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { MapPin, BedDouble, Bath, Square, Phone, MessageCircle, Heart, Share2, Calendar, X, ChevronLeft, ChevronRight, Grid, User } from "lucide-react";

const PropertyDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [property, setProperty] = useState(null);
    const [currentUser, setCurrentUser] = useState(null); // To store "My" Info
    const [loading, setLoading] = useState(true);
    const [showPhone, setShowPhone] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    // Gallery State
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
        const token = localStorage.getItem("token");
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const fetchData = async () => {
            try {
                // 1. Fetch Property
                const propRes = await axios.get(`/properties/${id}`, config);
                setProperty(propRes.data);
                setIsLiked(propRes.data.isFavorite || false);

                // 2. Fetch "Me" (Only if logged in) to check ownership
                if (token) {
                    try {
                        const userRes = await axios.get("/users/me", config);
                        setCurrentUser(userRes.data);
                    } catch (e) {
                        console.log("Not logged in or invalid token");
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const toggleFavorite = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        setIsLiked(!isLiked);
        try {
            await axios.post(`/properties/${id}/favorite`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            setIsLiked(!isLiked);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    };

    // INTELLIGENT NAVIGATION
    const handleOwnerClick = () => {
        if (!property) return;

        // 1. If I am the owner -> Go to My Profile (Dashboard)
        if (currentUser && currentUser.userId === property.ownerId) {
            navigate("/profile");
        }
        // 2. If someone else -> Go to Public Profile
        else {
            navigate(`/user/${property.ownerId}`);
        }
    };

    // ... Gallery Logic ...
    const openGallery = (index) => { setCurrentImageIndex(index); setIsGalleryOpen(true); document.body.style.overflow = 'hidden'; };
    const closeGallery = () => { setIsGalleryOpen(false); document.body.style.overflow = 'unset'; };
    const nextImage = (e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1)); };
    const prevImage = (e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1)); };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold">Loading Property...</div>;
    if (!property) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Property not found.</div>;

    const formatPrice = (price) => new Intl.NumberFormat('en-JO').format(price);

    // Prepare Images
    const rawImages = property.imageUrls && property.imageUrls.length > 0
        ? property.imageUrls.map(url => `http://localhost:8080/uploads/${url}`)
        : ["https://images.unsplash.com/photo-1600596542815-2495db98dada?auto=format&fit=crop&q=80&w=800"];
    const images = rawImages;

    // Prepare Owner Avatar URL
    const ownerAvatar = property.ownerProfilePictureUrl
        ? `http://localhost:8080/uploads/${property.ownerProfilePictureUrl}`
        : null;

    return (
        <div className="bg-white min-h-screen pb-20 relative">

            {/* ... GALLERY UI (Same as before) ... */}
            {isGalleryOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
                    <button onClick={closeGallery} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"><X className="w-8 h-8" /></button>
                    <button onClick={prevImage} className="absolute left-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition hidden md:block"><ChevronLeft className="w-8 h-8" /></button>
                    <img src={images[currentImageIndex]} alt="Gallery" className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
                    <button onClick={nextImage} className="absolute right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition hidden md:block"><ChevronRight className="w-8 h-8" /></button>
                    <div className="absolute bottom-6 text-white font-medium bg-black/50 px-4 py-2 rounded-full">{currentImageIndex + 1} / {images.length}</div>
                </div>
            )}

            {/* ... BENTO GRID (Same as before) ... */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="relative rounded-3xl overflow-hidden h-[400px] md:h-[500px] bg-gray-100">
                    <div className={`grid h-full gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4 grid-rows-2'}`}>
                        <div onClick={() => openGallery(0)} className={`relative cursor-pointer group overflow-hidden ${images.length === 1 ? 'col-span-1' : 'col-span-2 row-span-2'}`}>
                            <img src={images[0]} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="Main" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition"></div>
                        </div>
                        {images.slice(1, 5).map((img, idx) => (
                            <div key={idx} onClick={() => openGallery(idx + 1)} className="hidden md:block relative cursor-pointer group overflow-hidden">
                                <img src={img} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt={`Sub ${idx}`} />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition"></div>
                            </div>
                        ))}
                    </div>
                    {images.length > 5 && (
                        <button onClick={() => openGallery(0)} className="absolute bottom-6 right-6 bg-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition">
                            <Grid className="w-4 h-4" /> Show all {images.length} photos
                        </button>
                    )}
                </div>
            </div>

            {/* DETAILS SECTION */}
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-10 mt-4">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <div className="flex gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">{property.type}</span>
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase">{property.purpose === 'BUY' ? 'For Sale' : `For Rent (${property.rentFrequency})`}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">{property.title}</h1>
                        <div className="flex items-center text-gray-500 font-medium"><MapPin className="w-5 h-5 mr-1 text-blue-600" /> {property.location}</div>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div className="text-center"><div className="flex items-center justify-center gap-2 text-gray-400 mb-1"><BedDouble className="w-5 h-5"/> Beds</div><span className="text-xl font-bold text-gray-900">{property.roomCount}</span></div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="text-center"><div className="flex items-center justify-center gap-2 text-gray-400 mb-1"><Bath className="w-5 h-5"/> Baths</div><span className="text-xl font-bold text-gray-900">{property.bathCount}</span></div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="text-center"><div className="flex items-center justify-center gap-2 text-gray-400 mb-1"><Square className="w-5 h-5"/> Area</div><span className="text-xl font-bold text-gray-900">{property.area} m²</span></div>
                    </div>
                    <div><h3 className="text-xl font-bold text-gray-900 mb-4">About this home</h3><p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{property.description}</p></div>
                    <div className="flex gap-6 pt-6 border-t"><div className="flex items-center gap-2 text-gray-500 text-sm"><Calendar className="w-4 h-4" /> Posted on {new Date(property.datePosted).toLocaleDateString()}</div></div>
                </div>

                {/* OWNER CARD */}
                <div className="relative">
                    <div className="sticky top-24 bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div><p className="text-sm text-gray-500 font-medium uppercase mb-1">Price</p><h2 className="text-3xl font-extrabold text-blue-600">{formatPrice(property.price)} <span className="text-lg text-gray-400 font-normal">JOD</span></h2></div>
                            <button onClick={toggleFavorite} className={`p-3 rounded-full transition-colors ${isLiked ? "bg-red-50 text-red-500 border border-red-200" : "bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50"}`}>
                                <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500" : ""}`} />
                            </button>
                        </div>
                        <hr className="border-gray-100 my-6" />

                        {/* OWNER SECTION */}
                        <div
                            onClick={handleOwnerClick}
                            className="flex items-center gap-4 mb-6 cursor-pointer group p-2 -mx-2 rounded-xl hover:bg-gray-50 transition"
                        >
                            <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 group-hover:ring-2 ring-blue-500 transition">
                                {ownerAvatar ? (
                                    <img src={ownerAvatar} alt="Owner" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                                        {property.ownerName?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase group-hover:text-blue-600 transition">Listed by</p>
                                <p className="text-gray-900 font-bold text-lg">{property.ownerName}</p>
                                <p className="text-xs text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition -mt-1">View Profile</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button onClick={() => setShowPhone(!showPhone)} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"><Phone className="w-5 h-5" /> {showPhone ? property.ownerPhone : "Show Phone Number"}</button>
                            <button className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-all"><MessageCircle className="w-5 h-5" /> Chat with Owner</button>
                        </div>
                        <div className="mt-6 text-center">
                            <button onClick={handleShare} className="text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-2 w-full active:scale-95 transition">
                                <Share2 className="w-4 h-4" /> Share this property
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PropertyDetailsPage;