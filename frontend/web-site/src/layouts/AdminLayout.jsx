import { Outlet } from "react-router-dom";
import AppToaster from "../components/common/AppToaster";
import SideBar from "../components/Admin/UI/SideBar";
import NotificationBell from "../components/common/NotificationBell";

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-neutral-50">
            {/* ── Top Bar ───────────────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-stone-50 border-b border-neutral-200 flex items-center justify-between px-6">
                {/* Logo — aligns with sidebar width */}
                <div className="w-56 flex items-center px-2">
                    <span className="text-emerald-950 text-xl font-bold font-['Noto_Serif',serif] leading-7">
                        GreenMarket
                    </span>
                </div>

                {/* Right icons */}
                <div className="flex items-center gap-3">
                    <NotificationBell />

                    <div className="pl-4 border-l border-neutral-200 flex items-center gap-2">
                        <button className="hover:scale-105 w-8 h-8 rounded-full bg-emerald-800 hover:bg-emerald-900 flex items-center justify-center text-white text-xs font-bold font-['Geist',sans-serif] cursor-pointer transition-all shadow-sm overflow-hidden">
                            A
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <SideBar />

            {/* ── Main content ──────────────────────────────────────────────── */}
            <main className="pt-16 pl-64 min-h-screen">
                <Outlet />
            </main>

            {/* ── Toast ─────────────────────────────────────────────────────── */} 
            <AppToaster />
        </div>
    );
}