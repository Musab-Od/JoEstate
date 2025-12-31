import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 pt-12 pb-6 mt-auto border-t border-slate-800">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

                    {/* Column 1: Brand & Mission */}
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="text-2xl font-extrabold text-white mb-4 tracking-tight">
                            JO<span className="text-blue-500">ESTATE</span>
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-400">
                            A modern platform dedicated to simplifying the real estate experience in Jordan.
                            We bridge the gap between dream homes and future investments with technology you can trust.
                        </p>
                    </div>

                    {/* Column 2: Discover */}
                    <div className="md:pl-8">
                        <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Discover</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-blue-400 transition">Home</Link></li>
                            <li><Link to="/about" className="hover:text-blue-400 transition">About the Project</Link></li>
                            <li><Link to="/faq" className="hover:text-blue-400 transition">FAQ</Link></li>
                            <li><Link to="/contact" className="hover:text-blue-400 transition">Contact Support</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Legal & Team */}
                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-blue-400 transition">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition">Documentation</a></li>
                            <li><Link to="/login" className="hover:text-blue-400 transition">Admin Login</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Contact Info */}
                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Get in Touch</h4>
                        <div className="space-y-3 text-sm text-slate-400">
                            <p className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                Amman, Jordan
                            </p>
                            <p className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-blue-500" />
                                <a href="mailto:contact@joestate.com" className="hover:text-white transition">contact@joestate.com</a>
                            </p>

                            {/* Social Icons */}
                            <div className="flex gap-4 mt-6">
                                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-blue-600 hover:text-white transition group">
                                    <Linkedin className="w-4 h-4 group-hover:scale-110 transition" />
                                </a>
                                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-blue-500 hover:text-white transition group">
                                    <Twitter className="w-4 h-4 group-hover:scale-110 transition" />
                                </a>
                                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-pink-600 hover:text-white transition group">
                                    <Instagram className="w-4 h-4 group-hover:scale-110 transition" />
                                </a>
                                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-blue-700 hover:text-white transition group">
                                    <Facebook className="w-4 h-4 group-hover:scale-110 transition" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright Section */}
                <div className="border-t border-slate-800 pt-8 text-center">
                    <p className="text-slate-500 text-xs mb-2">
                        © 2025 JoEstate Graduation Project. All rights reserved.
                    </p>
                    <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                        Jordan University of Science and Technology (JUST)
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;