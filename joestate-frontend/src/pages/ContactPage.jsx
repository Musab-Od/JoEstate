import { Mail, Phone, MapPin, Send } from "lucide-react";

const ContactPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="container mx-auto max-w-5xl">

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Get in Touch</h1>
                    <p className="text-gray-600">Have questions about the project? We'd love to hear from you.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left: Contact Info */}
                    <div className="bg-blue-900 text-white rounded-2xl p-8 shadow-xl flex flex-col justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <Phone className="w-6 h-6 text-blue-400" />
                                    <div>
                                        <p className="font-bold">Phone</p>
                                        <p className="text-blue-100">+962 79 000 0000</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Mail className="w-6 h-6 text-blue-400" />
                                    <div>
                                        <p className="font-bold">Email</p>
                                        <p className="text-blue-100">info@joestate-just.edu.jo</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <MapPin className="w-6 h-6 text-blue-400" />
                                    <div>
                                        <p className="font-bold">Location</p>
                                        <p className="text-blue-100">Jordan University of Science & Technology<br/>Irbid, Jordan</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <div className="w-full h-40 bg-blue-800 rounded-xl flex items-center justify-center text-blue-300 text-sm">
                                [ Map Placeholder: JUST Campus ]
                            </div>
                        </div>
                    </div>

                    {/* Right: The Form */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 rounded-lg border focus:outline-blue-500" placeholder="Ali" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 rounded-lg border focus:outline-blue-500" placeholder="Ahmed" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                <input type="email" className="w-full p-3 bg-gray-50 rounded-lg border focus:outline-blue-500" placeholder="example@email.com" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                                <textarea rows="4" className="w-full p-3 bg-gray-50 rounded-lg border focus:outline-blue-500" placeholder="How can we help?"></textarea>
                            </div>

                            <button type="button" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                <Send className="w-5 h-5" /> Send Message
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ContactPage;