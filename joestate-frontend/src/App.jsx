import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import AuthPage from "./pages/AuthPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FaqPage from "./pages/FaqPage";

const HomePage = () => (
    <div className="flex flex-col min-h-screen">
        <Hero />
        {/* Featured properties commented out for now */}
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <div className="flex flex-col min-h-screen">
                <Header />

                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/faq" element={<FaqPage />} />

                        {/* Auth */}
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/register" element={<AuthPage />} />

                        {/* Protected Pages (Placeholders for now) */}
                        <Route path="/add-property" element={
                            <div className="mt-20 text-center font-bold text-2xl text-gray-400">
                                Step 2: Add Property Form Coming Soon...
                            </div>
                        } />

                        <Route path="/profile" element={
                            <div className="mt-20 text-center font-bold text-2xl text-gray-400">
                                Step 3: User Profile Coming Soon...
                            </div>
                        } />

                    </Routes>
                </main>

                <Footer />
            </div>
        </BrowserRouter>
    )
}

export default App;