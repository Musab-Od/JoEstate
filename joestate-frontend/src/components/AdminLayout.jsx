import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Flag, Users, ShieldCheck, LogOut, Home } from "lucide-react";

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="h-screen bg-gray-100 flex overflow-hidden">
            {/* --- THE SIDEBAR --- */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl">
                <div className="p-6">
                    <h2 className="text-2xl font-black text-white tracking-tight">JoEstate<span className="text-red-500">Admin</span></h2>
                    <p className="text-slate-400 text-xs font-bold uppercase mt-1">Trust & Safety Node</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavLink to="/admin" end className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                        <LayoutDashboard className="w-5 h-5" /> Dashboard KPIs
                    </NavLink>

                    <NavLink to="/admin/reports" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                        <Flag className="w-5 h-5" /> Moderation Queue
                    </NavLink>

                    <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                        <Users className="w-5 h-5" /> User Management
                    </NavLink>

                    <NavLink to="/admin/verifications" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                        <ShieldCheck className="w-5 h-5" /> Enterprise Verification
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <button onClick={() => navigate("/")} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-all">
                        <Home className="w-5 h-5" /> Return to Public Site
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl font-medium text-slate-300 hover:bg-red-900/50 hover:text-red-400 transition-all">
                        <LogOut className="w-5 h-5" /> Secure Logout
                    </button>
                </div>
            </aside>

            {/* --- THE MAIN CONTENT AREA --- */}
            <main className="flex-1 overflow-y-auto">
                {/* The <Outlet /> is where the specific page content will be injected */}
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;