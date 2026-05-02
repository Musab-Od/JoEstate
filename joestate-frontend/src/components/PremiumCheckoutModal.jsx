import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CreditCard, ShieldCheck, Crown, Loader2, Image, BarChart3, Star, ArrowRight, ArrowLeft, BadgeCheck, Sparkles, Lock } from "lucide-react";
import axios from "../api/axios";

const PremiumCheckoutModal = ({ isOpen, onClose, onSuccess }) => {
    const [view, setView] = useState('pitch');
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Lock background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        setView('pitch');
        setError("");
        onClose();
    };

    // --- SMART INPUT MASKING (THE REALISTIC FEEL) ---
    const handleCardChange = (e) => {
        // Remove all non-digits
        let val = e.target.value.replace(/\D/g, '');
        // Add a space after every 4 digits
        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        // Limit to 19 characters (16 digits + 3 spaces)
        if (formatted.length <= 19) setCardNumber(formatted);
    };

    const handleExpiryChange = (e) => {
        // Remove all non-digits
        let val = e.target.value.replace(/\D/g, '');
        // Automatically inject the slash after the month
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        // Limit to 5 characters (MM/YY)
        if (val.length <= 5) setExpiry(val);
    };

    const handleCvcChange = (e) => {
        // Remove all non-digits and limit to 3 digits
        let val = e.target.value.replace(/\D/g, '');
        if (val.length <= 3) setCvc(val);
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            await axios.post("/users/me/upgrade", {
                cardNumber,
                expiryDate: expiry,
                cvc
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTimeout(() => {
                setLoading(false);
                onSuccess();
            }, 1500);
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || "Card declined. Please check your details.");
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={handleClose}>
            <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

                <button onClick={handleClose} className="absolute top-5 right-5 z-20 text-white hover:text-yellow-200 transition bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-sm">
                    <X className="w-5 h-5" />
                </button>

                {/* --- VIEW 1: THE PREMIUM SALES PITCH --- */}
                {view === 'pitch' && (
                    <div className="animate-in slide-in-from-left-8 fade-in duration-500">
                        <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-8 pb-10 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl relative z-10 border-4 border-yellow-200/50">
                                <Crown className="w-10 h-10 text-yellow-500" />
                            </div>
                            <h2 className="text-3xl font-black text-white relative z-10 tracking-tight drop-shadow-md">JoEstate VIP</h2>
                            <p className="text-yellow-50 font-medium mt-2 relative z-10 text-base drop-shadow-sm">Sell faster. Stand out. Get verified.</p>
                        </div>

                        <div className="p-8 pb-6 bg-gray-50/50">
                            <div className="grid grid-cols-1 gap-5">
                                <div className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-yellow-300 transition-colors">
                                    <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 shrink-0"><Star className="w-6 h-6" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Always at the Top</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Your properties appear first in search results and on the homepage.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-yellow-300 transition-colors">
                                    <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 shrink-0"><Sparkles className="w-6 h-6" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Golden VIP Listings</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Your property cards get an exclusive, elegant golden design to attract buyers.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-yellow-300 transition-colors">
                                    <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 shrink-0"><BadgeCheck className="w-6 h-6" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Enterprise Verification</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Apply for the official Blue Checkmark to build absolute trust with clients.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-yellow-300 transition-colors">
                                    <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 shrink-0"><Image className="w-6 h-6" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Unlimited Media & Video</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Upload up to 50 photos and property walkthrough videos.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-yellow-300 transition-colors">
                                    <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 shrink-0"><BarChart3 className="w-6 h-6" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Advanced Analytics</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Track exactly how many views and favorites your properties get in real-time.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 pb-8 bg-gray-50/50">
                            <button onClick={() => setView('checkout')} className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
                                Proceed to Checkout <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* --- VIEW 2: THE SECURE CHECKOUT --- */}
                {view === 'checkout' && (
                    <div className="animate-in slide-in-from-right-8 fade-in duration-500 bg-white">
                        <div className="bg-slate-900 p-6 text-center relative">
                            <button type="button" onClick={() => setView('pitch')} className="absolute left-4 top-6 text-slate-300 hover:text-white transition flex items-center">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-green-400" /> Secure Payment
                            </h2>
                        </div>

                        <form onSubmit={handleCheckout} className="p-8 space-y-6">

                            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3 text-sm text-blue-800">
                                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold mb-1">Test Environment Active</p>
                                    <p className="text-xs text-blue-700">Please use the universal testing card below to simulate a successful transaction.</p>
                                    <p className="text-sm font-mono mt-2 bg-white px-2 py-1 rounded border border-blue-200 inline-block font-bold">4242 4242 4242 4242</p>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl border border-red-100 text-center font-bold animate-in shake">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Card Number</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                                    {/* MASKED INPUT */}
                                    <input
                                        type="text"
                                        required
                                        placeholder="0000 0000 0000 0000"
                                        value={cardNumber}
                                        onChange={handleCardChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-slate-900 focus:ring-0 outline-none font-mono text-lg transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Expiry</label>
                                    {/* MASKED INPUT */}
                                    <input
                                        type="text"
                                        required
                                        placeholder="MM/YY"
                                        value={expiry}
                                        onChange={handleExpiryChange}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-slate-900 focus:ring-0 outline-none font-mono text-center text-lg transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">CVC</label>
                                    {/* MASKED INPUT */}
                                    <input
                                        type="text"
                                        required
                                        placeholder="123"
                                        value={cvc}
                                        onChange={handleCvcChange}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-slate-900 focus:ring-0 outline-none font-mono text-center text-lg transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 font-black text-lg py-4 rounded-2xl shadow-xl hover:shadow-yellow-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Lock className="w-5 h-5"/> Pay 19.99 JOD</>}
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-4 font-medium flex items-center justify-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Encrypted via 256-bit SSL
                                </p>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default PremiumCheckoutModal;