import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Mail, Lock, Phone, ArrowRight, Building2, LogIn } from "lucide-react";
import axios from "../api/axios";

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // State to toggle between Login (true) and Register (false)
    const [isLoginMode, setIsLoginMode] = useState(true);

    // Check URL to set initial mode (if user came from /register, show register)
    useEffect(() => {
        if (location.pathname === "/register") {
            setIsLoginMode(false);
        }
    }, [location]);

    // Form Data (Combined)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation for Register Mode
        if (!isLoginMode) {
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match!");
                return;
            }
            if (formData.password.length < 6) {
                setError("Password must be at least 6 characters.");
                return;
            }
        }

        setIsLoading(true);

        try {
            let response;
            let endpoint = isLoginMode ? "/auth/login" : "/auth/register";

            // Prepare Payload (Login needs less data)
            const payload = isLoginMode
                ? { email: formData.email, password: formData.password }
                : {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    phoneNumber: formData.phoneNumber
                };

            response = await axios.post(endpoint, payload);

            // Success Logic (Same for both)
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", response.data.firstName);

            // Use window.location.href to force a full refresh so Header updates
            window.location.href = "/";

        } catch (err) {
            setError(err.response?.data?.message || "Authentication failed. Please check your details.");
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle Function
    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setError("");
        // Optional: Update URL without reloading
        window.history.replaceState(null, "", isLoginMode ? "/register" : "/login");
    };

    return (
        <div className="min-h-screen flex bg-gray-50">

            {/* LEFT SIDE: Image (Sticky) */}
            <div className="hidden lg:flex w-1/2 bg-blue-900 relative overflow-hidden items-center justify-center">
                <div
                    className="absolute inset-0 z-0 opacity-40"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                ></div>
                <div className="relative z-10 text-white text-center px-12">
                    <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl inline-block mb-6 shadow-xl">
                        <Building2 className="w-16 h-16 text-white" />
                    </div>
                    <h2 className="text-5xl font-extrabold mb-6 tracking-tight">JoEstate</h2>
                    <p className="text-blue-100 text-xl font-light max-w-md mx-auto leading-relaxed">
                        {isLoginMode
                            ? "Welcome back! Log in to manage your listings and find your dream home."
                            : "Join the #1 real estate platform in Jordan. Create your account today."}
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: Dynamic Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                            {isLoginMode ? "Welcome Back" : "Create Account"}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {isLoginMode ? "Enter your credentials to access your account." : "Fill in your details to get started."}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-md flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* REGISTER ONLY FIELDS */}
                        {!isLoginMode && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 uppercase">First Name</label>
                                        <input name="firstName" type="text" required className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ali" value={formData.firstName} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 uppercase">Last Name</label>
                                        <input name="lastName" type="text" required className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ahmed" value={formData.lastName} onChange={handleChange} />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* EMAIL (Both) */}
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase">Email Address</label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input name="email" type="email" required className="w-full pl-10 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
                            </div>
                        </div>

                        {/* REGISTER ONLY: Phone */}
                        {!isLoginMode && (
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase">Phone Number</label>
                                <div className="relative mt-1">
                                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input name="phoneNumber" type="tel" required className="w-full pl-10 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="079 000 0000" value={formData.phoneNumber} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        {/* PASSWORD (Both) */}
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase">Password</label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input name="password" type="password" required className="w-full pl-10 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="••••••" value={formData.password} onChange={handleChange} />
                            </div>
                        </div>

                        {/* REGISTER ONLY: Confirm Password */}
                        {!isLoginMode && (
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase">Confirm Password</label>
                                <input name="confirmPassword" type="password" required className="w-full mt-1 p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="••••••" value={formData.confirmPassword} onChange={handleChange} />
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 mt-2"
                        >
                            {isLoading ? "Processing..." : (
                                <>
                                    {isLoginMode ? "Log In" : "Create Account"}
                                    {isLoginMode ? <LogIn className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                </>
                            )}
                        </button>
                    </form>

                    {/* TOGGLE LINK */}
                    <div className="mt-8 text-center pt-6 border-t border-gray-100">
                        <p className="text-gray-600 text-sm">
                            {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={toggleMode}
                                className="ml-2 text-blue-600 font-bold hover:underline focus:outline-none"
                            >
                                {isLoginMode ? "Register now" : "Log in here"}
                            </button>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthPage;