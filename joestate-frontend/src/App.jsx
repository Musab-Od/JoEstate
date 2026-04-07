import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FaqPage from "./pages/FaqPage";
import AddPropertyPage from "./pages/AddPropertyPage.jsx";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";
import MessagesPage from "./pages/MessagesPage";

// We create an inner component so we can use "useLocation()"
const AppContent = () => {
    const location = useLocation();

    // Check if the current URL is exactly "/messages"
    const isMessagesPage = location.pathname === "/messages";

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-grow flex flex-col">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/user/:userId" element={<PublicProfilePage />} />
                    <Route path="/properties/:id" element={<PropertyDetailsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/register" element={<AuthPage />} />
                    <Route path="/add-property" element={<AddPropertyPage />} />
                    <Route path="/edit-property/:id" element={<AddPropertyPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                </Routes>
            </main>

            {/* Fix: Hide the footer if we are on the Messages page! */}
            {!isMessagesPage && <Footer />}
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;