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
import { WebSocketProvider } from "./context/WebSocketContext";
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReports from "./pages/admin/AdminReports";
import AdminUsers from "./pages/admin/AdminUsers";

const AppContent = () => {
    const location = useLocation();

    // Check if the current URL is Messages or Admin
    const isMessagesPage = location.pathname === "/messages";
    const isAdminPage = location.pathname.startsWith("/admin");

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Hide normal header if we are on the Admin Dashboard */}
            {!isAdminPage && <Header />}

            <main className="flex-grow flex flex-col">
                <Routes>
                    {/* PUBLIC ROUTES */}
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

                    {/* ADMIN PROTECTED ROUTES */}
                    <Route element={<AdminRoute />}>
                        {/* The Layout wraps all admin pages */}
                        <Route element={<AdminLayout />}>
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/admin/reports" element={<AdminReports />} />
                            <Route path="/admin/users" element={<AdminUsers />} />
                            {/* Future routes */}
                            <Route path="/admin/verifications" element={<div>Verifications Config</div>} />
                        </Route>
                    </Route>
                </Routes>
            </main>

            {/* Hide footer if we are on Messages OR Admin pages */}
            {!isMessagesPage && !isAdminPage && <Footer />}
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <WebSocketProvider>
                <AppContent />
            </WebSocketProvider>
        </BrowserRouter>
    );
}

export default App;