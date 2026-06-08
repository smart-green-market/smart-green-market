import { Outlet } from "react-router-dom";
import { Bell } from "lucide-react";
import SideBar from "../components/Supplier/UI/SideBar";
import Logo from "../components/Supplier/UI/Logo";

export default function SupplierLayout() {
    return (
        <div className="min-h-screen bg-neutral-50">
            {/* ── Top Bar ───────────────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-stone-50 border-b border-neutral-200 flex items-center justify-between px-6">
                {/* Logo — aligns with sidebar width */}
                <Logo />

                {/* Right icons */}
                <div className="flex items-center gap-3">
                    <button className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600">
                        <Bell className="w-[18px] h-[18px]" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-teal-700 rounded-full border-2 border-stone-50" />
                    </button>

                    <div className="pl-4 border-l border-neutral-200 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-white text-xs font-bold font-['Geist',sans-serif]">
                            A
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <SideBar />

            {/* ── Main content ──────────────────────────────────────────────── */}
            <main className="pt-16 pl-64 min-h-screen">
                <Outlet />
            </main>
        </div>
    );
}