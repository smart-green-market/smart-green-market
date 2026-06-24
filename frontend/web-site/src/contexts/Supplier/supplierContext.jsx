import { createContext, useContext, useState } from "react";

const SidebarContext = createContext(null);

// Độ rộng sidebar theo trạng thái (px) — main content và header dùng chung giá trị này
export const SIDEBAR_WIDTH = {
    open: 256,      // tương đương w-64, khớp với layout hiện tại
    collapsed: 72,  // rail chỉ hiện icon
};

export function SidebarProvider({ children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    const toggle = () => setOpen((o) => !o);
    const width = open ? SIDEBAR_WIDTH.open : SIDEBAR_WIDTH.collapsed;

    return (
        <SidebarContext.Provider value={{ open, toggle, width }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) {
        throw new Error("useSidebar phải được gọi trong SidebarProvider");
    }
    return ctx;
}