import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Home, DollarSign, MapPin, Layout, BedDouble, Bath, FileText, Briefcase } from "lucide-react";
import axios from "../api/axios";

const AddPropertyPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        area: "",
        location: "",
        roomCount: "",
        bathCount: "",
        type: "APARTMENT",
        purpose: "RENT",
        rentFrequency: "MONTHLY",
    });

    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);

    // --- CATEGORY DEFINITIONS ---
    const commercialTypes = ["OFFICE", "SHOP", "WAREHOUSE"];
    const landTypes = ["LAND"];

    // Helper: Check Category
    const isCommercial = commercialTypes.includes(formData.type);
    const isLand = landTypes.includes(formData.type);

    // --- SMART LOGIC: STUDIO AUTOMATION ---
    useEffect(() => {
        if (formData.type === "STUDIO") {
            setFormData((prev) => ({
                ...prev,
                roomCount: "1",
                bathCount: "1",
            }));
        }
    }, [formData.type]);

    // --- SMART LOGIC: HIDE RENT FREQUENCY IF SELLING ---
    useEffect(() => {
        if (formData.purpose === "BUY") {
            setFormData((prev) => ({ ...prev, rentFrequency: "NONE" }));
        } else if (formData.purpose === "RENT" && formData.rentFrequency === "NONE") {
            setFormData((prev) => ({ ...prev, rentFrequency: "MONTHLY" }));
        }
    }, [formData.purpose]);

    // Handle Text Inputs
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "price" || name === "area") {
            const rawValue = value.replace(/,/g, "");
            if (!isNaN(rawValue)) {
                setFormData({ ...formData, [name]: rawValue });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const formatNumber = (num) => {
        if (!num) return "";
        return Number(num).toLocaleString();
    };

    const handleImageChange = (e) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);

        if (files.length + images.length > 10) {
            alert("You can only upload a maximum of 10 photos.");
            return;
        }

        setImages((prev) => [...prev, ...files]);
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviews((prev) => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // 1. MANDATORY PHOTO CHECK
        if (images.length === 0) {
            alert("Please upload at least one photo of the property.");
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Session expired. Please login again.");
                navigate("/login");
                return;
            }

            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("price", formData.price);
            data.append("area", formData.area);
            data.append("location", formData.location);
            data.append("type", formData.type);
            data.append("purpose", formData.purpose);

            // Handle Conditional Logic for Data
            if (!isLand) {
                // Send room/bath for everything EXCEPT land
                data.append("roomCount", formData.roomCount || "0");
                data.append("bathCount", formData.bathCount || "0");
            } else {
                // For Land, force 0
                data.append("roomCount", "0");
                data.append("bathCount", "0");
            }

            if (formData.purpose === "RENT") {
                data.append("rentFrequency", formData.rentFrequency);
            }

            if (images.length > 0) {
                images.forEach((file) => data.append("imageFiles", file));
            }

            await axios.post("/properties", data, {
                headers: {
                    "Content-Type": undefined,
                    "Authorization": `Bearer ${token}`
                }
            });

            alert("Property Listed Successfully!");
            navigate("/");
        } catch (err) {
            console.error(err);
            setError("Failed to publish listing.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <div className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

                    {/* Header Section */}
                    <div className="bg-blue-900 px-8 py-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-transparent"></div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 relative z-10">
                            Turn Your Property into Opportunity
                        </h1>
                        <p className="text-blue-100 relative z-10 text-lg">
                            Reach thousands of potential buyers & tenants in minutes.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-100">{error}</div>}

                        {/* 1. Basic Info Section */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Home className="w-5 h-5 text-blue-600" /> Basic Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="title"
                                        placeholder="e.g. Modern Villa in Abdoun"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            name="location"
                                            placeholder="e.g. Amman, 7th Circle"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                                <textarea
                                    name="description"
                                    rows="4"
                                    placeholder="Describe the key features, view, and nearby amenities..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="h-px bg-gray-100"></div>

                        {/* 2. Specs Section */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Layout className="w-5 h-5 text-blue-600" /> Specifications
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            name="price"
                                            placeholder="0"
                                            value={formatNumber(formData.price)}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-12 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                            required
                                        />
                                        <span className="absolute right-4 top-3.5 text-gray-400 text-sm font-bold">JOD</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Area <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="area"
                                            placeholder="0"
                                            value={formatNumber(formData.area)}
                                            onChange={handleChange}
                                            className="w-full px-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                            required
                                        />
                                        <span className="absolute right-4 top-3.5 text-gray-500 text-sm font-bold">m²</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="APARTMENT">Apartment</option>
                                        <option value="VILLA">Villa</option>
                                        <option value="STUDIO">Studio</option>
                                        <option value="HOUSE">House</option>
                                        <option value="CHALET">Chalet</option>
                                        <option value="FARM">Farm</option>
                                        <option value="OFFICE">Office</option>
                                        <option value="SHOP">Shop</option>
                                        <option value="WAREHOUSE">Warehouse</option>
                                        <option value="LAND">Land</option>
                                    </select>
                                </div>
                            </div>

                            {/* --- CONDITIONAL RENDERING: ROOMS & BATHS --- */}
                            {/* Hide completely if Land. Show logic for others. */}
                            {!isLand && (
                                <div className="grid grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
                                    {/* ROOMS / OFFICES INPUT */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {isCommercial ? "No. of Offices" : "Bedrooms"}
                                            {!isCommercial && <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="relative">
                                            {isCommercial ? (
                                                <Briefcase className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                            ) : (
                                                <BedDouble className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                            )}
                                            <input
                                                type="number"
                                                name="roomCount"
                                                value={formData.roomCount}
                                                onChange={handleChange}
                                                min="0"
                                                className="w-full pl-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder={isCommercial ? "Optional" : "e.g. 3"}
                                                required={!isCommercial} // Mandatory for Residential, Optional for Commercial
                                            />
                                        </div>
                                    </div>

                                    {/* BATHROOMS INPUT */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Bathrooms
                                            {!isCommercial && <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="relative">
                                            <Bath className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                            <input
                                                type="number"
                                                name="bathCount"
                                                value={formData.bathCount}
                                                onChange={handleChange}
                                                min="0"
                                                className="w-full pl-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder={isCommercial ? "Optional" : "e.g. 2"}
                                                required={!isCommercial} // Mandatory for Residential, Optional for Commercial
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
                                    <div className="flex bg-gray-100 p-1 rounded-xl">
                                        {['RENT', 'BUY'].map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setFormData({...formData, purpose: p})}
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                                    formData.purpose === p
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                {p === 'BUY' ? 'For Sale' : 'For Rent'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formData.purpose === 'RENT' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                                        <select
                                            name="rentFrequency"
                                            value={formData.rentFrequency}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            <option value="MONTHLY">Monthly</option>
                                            <option value="WEEKLY">Weekly</option>
                                            <option value="YEARLY">Yearly</option>
                                            <option value="DAILY">Daily</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-100"></div>

                        {/* 3. Photos Upload (MANDATORY) */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" /> Photos <span className="text-sm font-semibold text-red-500">(Required - At least 1)</span>
                            </h3>

                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer relative group">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="bg-blue-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div className="text-gray-600">
                                        <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                                    </div>
                                    <p className="text-xs text-gray-400">PNG, JPG up to 10MB each</p>
                                </div>
                            </div>

                            {/* Image Previews */}
                            {previews.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                                    {previews.map((src, index) => (
                                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-blue-500/30 transition-all ${
                                isLoading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/50 hover:-translate-y-1"
                            }`}
                        >
                            {isLoading ? "Publishing..." : "Publish Listing Now"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddPropertyPage;