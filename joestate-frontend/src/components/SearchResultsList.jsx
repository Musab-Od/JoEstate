import { useState } from "react";
import SearchResultCard from "./SearchResultCard";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";

const SearchResultsList = ({ results }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Change this to 10 if you prefer

    // --- PAGINATION MATH ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = results.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(results.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        // Smooth scroll to top of list
        document.getElementById('results-anchor')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (results.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 mt-8">
                <SearchX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600">No properties found</h3>
                <p className="text-gray-400">Try adjusting your filters or location.</p>
            </div>
        );
    }

    return (
        <div id="results-anchor" className="py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 px-4">
                Search Results <span className="text-gray-400 text-lg font-normal">({results.length} found)</span>
            </h2>

            {/* THE LIST */}
            <div className="space-y-4 px-4">
                {currentItems.map((prop) => (
                    <SearchResultCard key={prop.propertyId} property={prop} />
                ))}
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-12 gap-2">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => paginate(i + 1)}
                            className={`w-10 h-10 rounded-lg font-bold transition-all ${
                                currentPage === i + 1
                                    ? "bg-blue-600 text-white shadow-lg scale-110"
                                    : "bg-white text-gray-600 border hover:bg-blue-50 hover:text-blue-600"
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default SearchResultsList;