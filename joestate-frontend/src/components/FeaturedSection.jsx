import { useEffect, useState } from "react";
import axios from "../api/axios";
import FeaturedPropertyCard from "./FeaturedPropertyCard";
import { Sparkles, ArrowRight } from "lucide-react";

const FeaturedSection = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the TOP 3 properties
        axios.get("/properties/featured")
            .then(res => setProperties(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="py-20 text-center text-gray-400">Loading recommendations...</div>;
    if (properties.length === 0) return null;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="container mx-auto">

                {/* Header */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider mb-2">
                            <Sparkles className="w-4 h-4" /> Fresh on the Market
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                            Featured Listings
                        </h2>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {properties.map(prop => (
                        <FeaturedPropertyCard key={prop.propertyId} property={prop} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedSection;