import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from '../api/axios';

const AdminRoute = () => {
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            try {
                // Fetch the current user's profile to check their role
                const res = await axios.get('/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // console.log("THE BOUNCER SEES THIS USER:", res.data);
                // Check if the role is exactly 'ADMIN'
                setIsAdmin(res.data.role === 'ADMIN');
            } catch (err) {
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">Verifying Credentials...</div>;

    // If they are an admin, render the child routes (Outlet). If not, kick them to the homepage.
    return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;