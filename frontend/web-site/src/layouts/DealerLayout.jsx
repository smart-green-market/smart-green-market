import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import SideBar from "../components/Dealer/UI/SideBar";
import Logo from "../components/Dealer/UI/Logo";
import DealerNotificationBell from "../components/common/DealerNotificationBell";
import AppToaster from "../components/common/AppToaster";
import { dealerService } from "../services/api/dealerService";

export default function DealerLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const [dealerInfo, setDealerInfo] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        dealerService.getMe()
            .then((data) => {
                setDealerInfo(data);
            })
            .catch((err) => {
                console.error("Failed to fetch dealer info:", err);
            });
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            {/* ── Top Bar ───────────────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200/60 flex items-center justify-between px-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

                {/* Logo & Toggle Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-100 active:bg-gray-200/60 rounded-lg cursor-pointer transition-colors text-[#333333]"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <Logo username={dealerInfo?.account?.username} />
                </div>

                {/* Right icons */}
                <div className="flex items-center gap-3">
                    <DealerNotificationBell role="dealer" />

                    <div className="pl-4 border-l border-gray-200 flex items-center gap-2">
                        <button
                            onClick={() => navigate("/dai-ly/cau-hinh")}
                            className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white text-xs font-bold font-['Geist',sans-serif] shadow-sm active:scale-95 transition-all cursor-pointer overflow-hidden"
                        >
                            {dealerInfo?.account?.avatar_url ? (
                                <img
                                    src={dealerInfo.account.avatar_url}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                "D"
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <SideBar isOpen={isSidebarOpen} />

            {/* Backdrop for mobile/tablet */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 top-16 bg-black/45 z-30 lg:hidden cursor-pointer animate-in fade-in duration-200"
                />
            )}

            {/* ── Main content ──────────────────────────────────────────────── */}
            <main className={`pt-16 min-h-screen transition-all duration-300 ${isSidebarOpen ? "lg:pl-64" : "pl-0"
                }`}>
                <Outlet key={location.pathname + (location.state?.refresh ? `-${location.state.refresh}` : "")} />
            </main>

            <AppToaster />
        </div>
    );
}