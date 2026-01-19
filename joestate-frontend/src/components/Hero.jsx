import { useState, useRef, useEffect } from "react";
import { Search, MapPin, ChevronDown, Check, RotateCcw } from "lucide-react";
import heroImage from "../assets/daniel-qura-unsplash-heroSection.jpg";
import axios from "../api/axios";

const Hero = ({onSearch}) => {
    // --- 1. STATES ---
    const [activePopup, setActivePopup] = useState(null);

    const [purpose, setPurpose] = useState("Rent");
    const [rentFreq, setRentFreq] = useState("Any");
    const [location, setLocation] = useState("");
    const [propertyType, setPropertyType] = useState("Apartment");
    const [beds, setBeds] = useState("Any");
    const [baths, setBaths] = useState("Any");
    const [area, setArea] = useState({ min: "", max: "" });
    const [price, setPrice] = useState({ min: "", max: "" });

    // --- AUTOCOMPLETE STATES ---
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const popupRef = useRef(null);

    const propertyTypes = [
        "Apartment", "Villa", "House", "Chalet", "Studio",
        "Shop", "Office", "Werehouse", "Farm", "Land", "Any"
    ];

    const rentFrequencies = ["Any", "Yearly", "Monthly", "Weekly", "Daily"];

    // Close popup logic (Modified to also close suggestions)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setActivePopup(null);
                setShowSuggestions(false); // Close suggestions if clicked outside
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const togglePopup = (name) => setActivePopup(activePopup === name ? null : name);

    // --- SMART SEARCH LOGIC ---
    const handleLocationChange = async (e) => {
        const value = e.target.value;
        setLocation(value);

        if (value.length > 1) {
            try {
                // Call the backend endpoint we just created
                const response = await axios.get(`/properties/locations?query=${value}`);
                setSuggestions(response.data);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Error fetching locations", error);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (suggestion) => {
        setLocation(suggestion);
        setShowSuggestions(false);
    };

    const handleSearchClick = () => {
        // 1. Prepare the Filter Object
        const filters = {
            location: location,
            purpose: purpose === 'Rent' ? 'RENT' : 'BUY',
        };

        if (propertyType !== 'Any') {
            filters.propertyType = propertyType.toUpperCase();
        }

        // 2. Handle Rent Frequency (Only if Renting & Not "Any")
        if (purpose === 'Rent' && rentFreq !== 'Any') {
            filters.rentFrequency = rentFreq.toUpperCase();
        }

        // 3. Handle Price (Min/Max) - Only add if user typed something
        if (price.min) filters.minPrice = price.min;
        if (price.max) filters.maxPrice = price.max;

        // 4. Handle Area (Min/Max)
        if (area.min) filters.minArea = area.min;
        if (area.max) filters.maxArea = area.max;

        // 5. Handle Beds & Baths
        // Logic: If user selected "+10", we send "10". Backend treats it as ">= 10"
        if (beds && beds !== "Any") {
            filters.beds = beds === "+10" ? 10 : beds;
        }
        if (baths && baths !== "Any") {
            filters.baths = baths === "+6" ? 6 : baths;
        }

        // 6. Send to Parent (HomePage)
        if (onSearch) {
            onSearch(filters);
        }
    };

    return (
        <div className="relative h-[600px] flex items-center justify-center">

            {/* 1. BACKGROUND IMAGE */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `url(${heroImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="absolute inset-0 bg-black/50"></div>
            </div>

            {/* 2. CENTERED CONTENT */}
            <div className="relative z-20 w-full max-w-5xl px-4">

                <div className="text-center mb-8 text-white">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight shadow-black drop-shadow-lg">
                        Find Your Dream Home in <span className="text-blue-400">Jordan</span>
                    </h1>
                </div>

                {/* 3. THE SEARCH CONTAINER */}
                <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 relative" ref={popupRef}>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

                        {/* PURPOSE (Rent/Buy) */}
                        <div className="md:col-span-3 relative">
                            <button
                                onClick={() => togglePopup('purpose')}
                                className={`w-full h-14 border rounded-xl px-4 flex items-center justify-between hover:border-blue-500 transition ${activePopup === 'purpose' ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 bg-gray-50'}`}
                            >
                                <div className="text-left">
                                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Purpose</span>
                                    <span className="block font-bold text-gray-800 text-sm truncate">
                                        {purpose} {purpose === "Rent" && rentFreq !== "Any" && `(${rentFreq})`}
                                    </span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>

                            {/* ... Purpose Dropdown Code ... */}
                            {activePopup === 'purpose' && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex gap-2 mb-4">
                                        <button onClick={() => setPurpose("Rent")} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${purpose === "Rent" ? "bg-blue-600 text-white border-blue-600" : "text-gray-600 border-gray-200"}`}>Rent</button>
                                        <button onClick={() => setPurpose("Buy")} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${purpose === "Buy" ? "bg-blue-600 text-white border-blue-600" : "text-gray-600 border-gray-200"}`}>Buy</button>
                                    </div>
                                    {purpose === "Rent" && (
                                        <div className="mb-4">
                                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Frequency</p>
                                            <div className="space-y-1">
                                                {rentFrequencies.map(f => (
                                                    <div key={f} onClick={() => setRentFreq(f)} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                        <span className="text-sm text-gray-700">{f}</span>
                                                        {rentFreq === f && <Check className="w-4 h-4 text-blue-600" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                                        <button onClick={() => {setPurpose("Rent"); setRentFreq("Any")}} className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"><RotateCcw className="w-3 h-3"/> Reset</button>
                                        <button onClick={() => setActivePopup(null)} className="text-sm font-bold text-blue-600 hover:underline">Done</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- SMART LOCATION INPUT --- */}
                        <div className="md:col-span-9 relative">
                            <div className="w-full h-14 border border-gray-200 bg-gray-50 rounded-xl px-4 flex items-center hover:border-blue-500 transition focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                                <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                                <div className="flex-1">
                                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Location</span>
                                    <input
                                        type="text"
                                        placeholder="City, Neighborhood..."
                                        autoComplete="off"
                                        value={location}
                                        onChange={handleLocationChange} // <--- UPDATED
                                        onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                                        className="w-full bg-transparent focus:outline-none text-sm font-bold text-gray-800 placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            {/* --- SUGGESTIONS DROPDOWN --- */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                    {suggestions.map((s, index) => (
                                        <div
                                            key={index}
                                            onClick={() => selectSuggestion(s)}
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-sm text-gray-700 border-b last:border-0"
                                        >
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* TYPE */}
                        <div className="md:col-span-3 relative">
                            <button onClick={() => togglePopup('type')} className={`w-full h-14 border rounded-xl px-3 flex items-center justify-between hover:border-blue-500 transition ${activePopup === 'type' ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="text-left overflow-hidden">
                                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Type</span>
                                    <span className="block font-bold text-gray-800 text-sm truncate">{propertyType}</span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>
                            {activePopup === 'type' && (
                                <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 max-h-60 overflow-y-auto">
                                    {propertyTypes.map(t => (
                                        <div key={t} onClick={() => {setPropertyType(t); setActivePopup(null);}} className={`p-2 rounded text-sm font-medium cursor-pointer flex justify-between ${propertyType === t ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'}`}>
                                            {t} {propertyType === t && <Check className="w-4 h-4" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* BEDS & BATHS */}
                        <div className="md:col-span-3 relative">
                            <button onClick={() => togglePopup('bedbath')} className={`w-full h-14 border rounded-xl px-3 flex items-center justify-between hover:border-blue-500 transition ${activePopup === 'bedbath' ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="text-left">
                                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Layout</span>
                                    <span className="block font-bold text-gray-800 text-sm truncate">{beds} Beds, {baths} Baths</span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>
                            {activePopup === 'bedbath' && (
                                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Bedrooms</p>
                                        <div className="flex flex-wrap gap-2">
                                            {["Any",1,2,3,4,5,6,7,8,9,"+10"].map(num => (
                                                <button key={num} onClick={() => setBeds(num)} className={`w-8 h-8 rounded-full text-xs font-bold border transition ${beds === num ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:border-blue-400'}`}>{num}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Bathrooms</p>
                                        <div className="flex flex-wrap gap-2">
                                            {["Any",1,2,3,4,5,"+6"].map(num => (
                                                <button key={num} onClick={() => setBaths(num)} className={`w-8 h-8 rounded-full text-xs font-bold border transition ${baths === num ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:border-blue-400'}`}>{num}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-end border-t pt-2"><button onClick={() => setActivePopup(null)} className="text-sm font-bold text-blue-600 hover:underline">Done</button></div>
                                </div>
                            )}
                        </div>

                        {/* AREA */}
                        <div className="md:col-span-2 relative">
                            <button onClick={() => togglePopup('area')} className={`w-full h-14 border rounded-xl px-3 flex items-center justify-between hover:border-blue-500 transition ${activePopup === 'area' ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="text-left overflow-hidden">
                                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Area</span>
                                    <span className="block font-bold text-gray-800 text-sm truncate">{area.min || area.max ? `${area.min}-${area.max}` : 'Any'} m²</span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>
                            {activePopup === 'area' && (
                                <div className="absolute top-full right-0 md:left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Area (sqm)</p>
                                    <div className="flex gap-2 items-center">
                                        <input type="number" placeholder="Min" value={area.min} onChange={e=>
                                        {const val = e.target.value;
                                            if (val === "" || Number(val) >= 0) {
                                                setArea({...area, min: val});
                                            }
                                        }} className="w-full border p-2 rounded text-sm"/>
                                        <span className="text-gray-400">-</span>
                                        <input type="number" placeholder="Max" value={area.max} onChange={e=>
                                        {const val = e.target.value;
                                            if (val === "" || Number(val) >= 0) {
                                                setArea({...area, max: val});
                                            }
                                        }} className="w-full border p-2 rounded text-sm"/>
                                    </div>
                                    <div className="flex justify-end border-t pt-2 mt-3"><button onClick={() => setActivePopup(null)} className="text-sm font-bold text-blue-600 hover:underline">Done</button></div>
                                </div>
                            )}
                        </div>

                        {/* PRICE */}
                        <div className="md:col-span-2 relative">
                            <button onClick={() => togglePopup('price')} className={`w-full h-14 border rounded-xl px-3 flex items-center justify-between hover:border-blue-500 transition ${activePopup === 'price' ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="text-left overflow-hidden">
                                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Price (JOD)</span>
                                    <span className="block font-bold text-gray-800 text-sm truncate">{price.min || price.max ? `${price.min}-${price.max}` : 'Any'}</span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>
                            {activePopup === 'price' && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Price Range (JOD)</p>
                                    <div className="flex gap-2 items-center">
                                        <input type="number" placeholder="Min" value={price.min} onChange={e=>
                                        {const val = e.target.value;
                                            if (val === "" || Number(val) >= 0) {
                                                setPrice({...price, min: val});
                                            }
                                        }} className="w-full border p-2 rounded text-sm"/>
                                        <span className="text-gray-400">-</span>
                                        <input type="number" placeholder="Max" value={price.max} onChange={e=>
                                        {const val = e.target.value;
                                            if (val === "" || Number(val) >= 0) {
                                                setPrice({...price, max: val});
                                            }
                                        }} className="w-full border p-2 rounded text-sm"/>
                                    </div>
                                    <div className="flex justify-end border-t pt-2 mt-3"><button onClick={() => setActivePopup(null)} className="text-sm font-bold text-blue-600 hover:underline">Done</button></div>
                                </div>
                            )}
                        </div>

                        {/* SEARCH BTN */}
                        <div className="md:col-span-2">
                            <button onClick={handleSearchClick} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition active:scale-95">
                                <Search className="w-5 h-5" /> Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;