import { Outlet } from "react-router-dom";
import NotificationBell from "../components/common/NotificationBell";
import AppToaster from "../components/common/AppToaster";
import SideBar from "../components/Supplier/UI/SideBar";
import Logo from "../components/Supplier/UI/Logo";
import { useEffect, useState } from "react";
import { supplierService } from "../services/api/suppilerService";
export default function SupplierLayout() {
    const [supplier, setSupplier] = useState(null);
    useEffect(() => {
        const loadSupplier = async () => {
            const supplier = await supplierService.getAll()
            setSupplier(supplier[0]);
        }
        loadSupplier();
        
        console.log(supplier);
    }, []);
    return (
        <div className="min-h-screen bg-neutral-50">
            {/* ── Top Bar ───────────────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-stone-50 border-b border-neutral-200 flex items-center justify-between px-6">
                {/* Logo — aligns with sidebar width */}
                <Logo />

                {/* Right icons */}
                <div className="flex items-center gap-3">
                <NotificationBell role="supplier" />

                    <div className="pl-4 border-l border-neutral-200 flex items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-800 flex items-center justify-center text-white text-xs font-bold font-['Geist',sans-serif]">
                            <img src={supplier?supplier.account.avatar_url:null} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
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

            <AppToaster />
        </div>
    );
}