import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import SideBar from "../components/Dealer/UI/SideBar";
import Logo from "../components/Dealer/UI/Logo";
import NotificationBell from "../components/common/NotificationBell";
import AppToaster from "../components/common/AppToaster";

export default function DealerLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-neutral-50/50">
            {/* ── Top Bar ───────────────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-stone-50 border-b border-emerald-100/50 flex items-center justify-between px-6">

                {/* Logo & Toggle Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-emerald-50 active:bg-emerald-100 rounded-xl cursor-pointer transition-colors text-emerald-800"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <Logo />
                </div>

                {/* Right icons */}
                <div className="flex items-center gap-3">
                    <NotificationBell role="dealer" />

                    <div className="pl-4 border-l border-emerald-100 flex items-center gap-2">
                        <button
                            onClick={() => navigate("/dai-ly/cau-hinh")}
                            className="w-8 h-8 rounded-full bg-emerald-800 hover:bg-emerald-900 flex items-center justify-center text-white text-xs font-bold font-['Geist',sans-serif] shadow-xs active:scale-95 transition-transform cursor-pointer"
                        >
                            D
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <SideBar isOpen={isSidebarOpen} />

            {/* ── Main content ──────────────────────────────────────────────── */}
            <main className={`pt-16 min-h-screen transition-all duration-300 ${isSidebarOpen ? "pl-64" : "pl-0"
                }`}>
                <Outlet />
            </main>

            <AppToaster />
        </div>
    );
}