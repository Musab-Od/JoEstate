import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none bg-white"
            >
        <span className="font-bold text-gray-800 text-lg flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            {question}
        </span>
                {isOpen ? <ChevronUp className="text-blue-500" /> : <ChevronDown className="text-gray-400" />}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 pt-2 text-gray-600 border-t border-gray-100 bg-gray-50">
                    {answer}
                </div>
            )}
        </div>
    );
};

const FaqPage = () => {
    const faqs = [
        {
            q: "Is JoEstate free to use?",
            a: "Yes! Searching for properties is 100% free for all users. Listing properties is also free during our beta launch period."
        },
        {
            q: "How do I list my property?",
            a: "Simply create an account, verify your email, and click the 'Add Property' button in the header. You can upload photos and details instantly."
        },
        {
            q: "Is this a real company?",
            a: "JoEstate is currently a graduation project developed by students at Jordan University of Science and Technology. It serves as a prototype for a modern real estate solution."
        },
        {
            q: "Can I contact the property owner directly?",
            a: "Yes. Once you find a property you like, the owner's phone number is displayed on the property details page."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="container mx-auto max-w-3xl">
                <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-2">Frequently Asked Questions</h1>
                <p className="text-center text-gray-500 mb-10">Everything you need to know about the project.</p>

                <div className="space-y-2">
                    {faqs.map((faq, index) => (
                        <FaqItem key={index} question={faq.q} answer={faq.a} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FaqPage;