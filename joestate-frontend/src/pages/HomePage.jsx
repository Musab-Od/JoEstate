import { useState } from "react";
import Hero from "../components/Hero";
import FeaturedSection from "../components/FeaturedSection";
import SearchResultsList from "../components/SearchResultsList";
import axios from "../api/axios";

const HomePage = () => {
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const executeSearch = async (filters) => {
        setLoading(true);
        setIsSearching(true);

        try {
            const params = new URLSearchParams();
            if(filters.location) params.append("location", filters.location);
            if(filters.purpose) params.append("purpose", filters.purpose);
            if(filters.type) params.append("type", filters.type);
            if(filters.rentFrequency) params.append("rentFrequency", filters.rentFrequency);
            if(filters.minPrice) params.append("minPrice", filters.minPrice);
            if(filters.maxPrice) params.append("maxPrice", filters.maxPrice);
            if(filters.minArea) params.append("minArea", filters.minArea);
            if(filters.maxArea) params.append("maxArea", filters.maxArea);
            if(filters.beds) params.append("beds", filters.beds);
            if(filters.baths) params.append("baths", filters.baths);

            // Get the Token
            const token = localStorage.getItem("token");
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            // Send the config (Headers)
            const res = await axios.get(`/properties/search?${params.toString()}`, config);

            setSearchResults(res.data);

            setTimeout(() => {
                document.getElementById('content-area')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setIsSearching(false);
        setSearchResults([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Hero onSearch={executeSearch} />

            <div id="content-area" className="relative z-10 -mt-8 pt-12 pb-20 bg-gray-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] min-h-[500px]">
                <div className="container mx-auto px-4 max-w-6xl">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-blue-600">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="font-bold">Searching best properties for you...</p>
                        </div>
                    ) : isSearching ? (
                        <div className="relative">
                            <button
                                onClick={handleReset}
                                className="absolute -top-4 right-0 text-sm text-gray-500 hover:text-red-600 font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 transition-all hover:shadow-md"
                            >
                                ✕ Clear Search
                            </button>
                            <SearchResultsList results={searchResults} />
                        </div>
                    ) : (
                        <FeaturedSection />
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;