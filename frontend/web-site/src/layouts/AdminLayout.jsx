import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AppToaster from "../components/common/AppToaster";
import SideBar from "../components/Admin/UI/SideBar";
import AdminLogo from "../components/Admin/UI/AdminLogo";
import NotificationBell from "../components/common/NotificationBell";

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-neutral-50">
            <header className="fixed left-0 right-0 top-0 z-50 border-b border-emerald-900/10 bg-[#eef2ef]">
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen((open) => !open)}
                            aria-label={isSidebarOpen ? "Đóng menu" : "Mở menu"}
                            className="cursor-pointer rounded-xl p-2 text-emerald-800 transition-colors hover:bg-emerald-100/70 active:bg-emerald-100"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <AdminLogo />
                    </div>

                    <div className="flex items-center gap-3">
                        <NotificationBell role="admin" />

                        <div className="flex items-center gap-2 border-l border-emerald-900/10 pl-4">
                            <button
                                type="button"
                                className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-slate-800 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-900"
                            >A
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <SideBar isOpen={isSidebarOpen} />

            <main
                className={`min-h-screen bg-neutral-50 pt-16 transition-all duration-300 ${
                    isSidebarOpen ? "pl-64" : "pl-0"
                }`}
            >
                <Outlet />
            </main>

            <AppToaster />
        </div>
    );
}
