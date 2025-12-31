import { CheckCircle, Code, Database, Layout } from "lucide-react";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* 1. Header Section */}
            <div className="bg-blue-900 text-white py-20 text-center">
                <h1 className="text-4xl font-extrabold mb-4">About JoEstate</h1>
                <p className="text-blue-200 text-lg max-w-2xl mx-auto">
                    Bridging the gap between technology and real estate. A graduation project submitted to Jordan University of Science and Technology.
                </p>
            </div>

            <div className="container mx-auto px-6 -mt-10">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">

                    {/* 2. Our Mission */}
                    <div className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h2>
                        <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
                            Finding a home in Jordan can be fragmented and difficult. JoEstate aims to centralize property listings into one intuitive, secure, and modern platform. We focus on transparency, ease of use, and providing accurate data for both buyers and renters.
                        </p>
                    </div>

                    {/* 3. The Tech Stack */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="p-6 bg-blue-50 rounded-xl text-center border border-blue-100 hover:shadow-lg transition">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Layout className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">Frontend</h3>
                            <p className="text-gray-600 text-sm">Built with **React + Vite** and styled with **Tailwind CSS** for a responsive, modern UI.</p>
                        </div>

                        <div className="p-6 bg-green-50 rounded-xl text-center border border-green-100 hover:shadow-lg transition">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Code className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">Backend</h3>
                            <p className="text-gray-600 text-sm">Powered by **Java Spring Boot**, providing a secure REST API and JWT Authentication.</p>
                        </div>

                        <div className="p-6 bg-purple-50 rounded-xl text-center border border-purple-100 hover:shadow-lg transition">
                            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Database className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">Database</h3>
                            <p className="text-gray-600 text-sm">Data managed by **MySQL** for reliable and fast queries.</p>
                        </div>
                    </div>

                    {/* 4. The Team */}
                    <div>
                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Meet the Team</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Member 1 */}
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:border-blue-400 transition">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div> {/* Placeholder for photo */}
                                <div>
                                    <h4 className="font-bold">Musab Odeh</h4>
                                    <p className="text-xs text-blue-600 font-bold uppercase">Software Engineer</p>
                                </div>
                            </div>

                            {/* Member 2 */}
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:border-blue-400 transition">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div>
                                    <h4 className="font-bold">Abdelrahman Ta'ani</h4>
                                    <p className="text-xs text-blue-600 font-bold uppercase">Software Engineer</p>
                                </div>
                            </div>

                            {/* Member 3 */}
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:border-blue-400 transition">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div>
                                    <h4 className="font-bold">Mohammed Momani</h4>
                                    <p className="text-xs text-blue-600 font-bold uppercase">Software Engineer</p>
                                </div>
                            </div>
                            {/* Member 4 */}
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:border-blue-400 transition">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div>
                                    <h4 className="font-bold">Mohammed Romanah</h4>
                                    <p className="text-xs text-blue-600 font-bold uppercase">Software Engineer</p>
                                </div>
                            </div>
                            {/* Member 5 */}
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:border-blue-400 transition">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div>
                                    <h4 className="font-bold">Dala Qudah</h4>
                                    <p className="text-xs text-blue-600 font-bold uppercase">Software Engineer</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AboutPage;