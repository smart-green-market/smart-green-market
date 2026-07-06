import { NavLink } from "react-router-dom";
import { useSidebar } from "../../../contexts/Supplier/supplierContext";
import { NAV_SECTIONS } from "./navConfig";

function getInitials(name = "") {
    const initials = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");
    return initials || "NC";
}

export default function SideBar({ supplier }) {
    const { open, width } = useSidebar();

    return (
        <aside
            style={{ width }}
            className="h-full flex flex-col flex-shrink-0 bg-emerald-900 overflow-hidden py-4 transition-[width] duration-200"
        >
            {/* ── Logo + tên + vai trò của nhà cung cấp ── */}
            <div className={`flex items-center gap-3 mb-4 flex-shrink-0 ${open ? "px-3" : "justify-center px-0"}`}>
                <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {supplier?.logo_url ? (
                        <img
                            src={supplier.logo_url}
                            alt={supplier.company_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-emerald-300 text-sm font-semibold">
                            {getInitials(supplier?.company_name)}
                        </span>
                    )}
                </div>
                {open && (
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {supplier?.company_name ?? "Đang tải..."}
                        </p>
                        <p className="text-xs text-emerald-400">Nhà cung cấp</p>
                    </div>
                )}
            </div>

            <div className={`h-px bg-emerald-800 mb-3 flex-shrink-0 ${open ? "w-full" : "w-8 mx-auto"}`} />

            {/* ── Điều hướng ── */}
            <nav className={`flex flex-col flex-1 overflow-y-auto ${open ? "px-3" : "items-center px-0"}`}>
                {NAV_SECTIONS.map((section, si) => (
                    <div key={section.label} className="w-full flex flex-col">
                        {si > 0 && (
                            <div className={`h-px bg-emerald-800 my-2 ${open ? "w-full" : "w-8 mx-auto"}`} />
                        )}

                        {open && (
                            <div className="text-[10px] uppercase tracking-wider text-emerald-600 px-2 pt-2 pb-1 whitespace-nowrap">
                                {section.label}
                            </div>
                        )}

                        {section.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `relative flex items-center rounded-lg mb-0.5 transition-colors ${
                                            open ? "gap-3 px-2.5 h-10 w-full" : "h-10 w-10 justify-center mx-auto"
                                        } ${
                                            isActive
                                                ? "bg-emerald-700 text-emerald-50"
                                                : "text-emerald-100 hover:bg-emerald-700/60"
                                        }`
                                    }
                                >
                                    <Icon size={18} className="flex-shrink-0" />
                                    {open && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                                    {item.dot && (
                                        <span
                                            className={`absolute w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950 ${
                                                open ? "top-2.5 right-2.5" : "top-1.5 right-1.5"
                                            }`}
                                        />
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </aside>
    );
}