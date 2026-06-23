import { Outlet, useLocation } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import NotificationBell from "../components/common/NotificationBell";
import AppToaster from "../components/common/AppToaster";
import SideBar from "../components/Supplier/UI/SideBar";
import SupplierAvatarDropdown from "../components/Supplier/UI/SupplierAvatarDropdown";
import { useEffect, useState } from "react";
import { supplierService } from "../services/api/suppilerService";
import { SidebarProvider, useSidebar } from "../contexts/Supplier/supplierContext";
import { getPageTitle } from "../components/Supplier/UI/navConfig";

function SupplierLayoutInner() {
    const [supplier, setSupplier] = useState(null);
    const { open, toggle } = useSidebar();
    const location = useLocation();

    useEffect(() => {
        const loadSupplier = async () => {
            const supplier = await supplierService.getAll()
            setSupplier(supplier[0]);
        }
        loadSupplier();
    }, []);

    return (
        <div className="h-screen flex overflow-hidden bg-neutral-50">
            {/* ── Sidebar — cao full màn hình, chứa logo/tên/vai trò nhà cung cấp ── */}
            <SideBar supplier={supplier} />

            {/* ── Cột phải: topbar + nội dung trang ───────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 flex-shrink-0 bg-stone-50 border-b border-neutral-200 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={toggle}
                            aria-label={open ? "Thu nhỏ menu" : "Mở rộng menu"}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-emerald-900 hover:bg-emerald-50 transition-colors"
                        >
                            {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                        </button>
                        <h1 className="text-base font-medium text-neutral-800">
                            {getPageTitle(location.pathname)}
                        </h1>
                    </div>

                    {/* Right icons */}
                    <div className="flex items-center gap-3">
                        <NotificationBell role="supplier" />

                        <div className="pl-4 border-l border-neutral-200 flex items-center">
                            <SupplierAvatarDropdown supplier={supplier} />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>

            <AppToaster />
        </div>
    );
}

export default function SupplierLayout() {
    return (
        <SidebarProvider>
            <SupplierLayoutInner />
        </SidebarProvider>
    );
}