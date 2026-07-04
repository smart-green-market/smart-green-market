import {
    LayoutDashboard,
    LineChart,
    ClipboardList,
    Package,
    BadgeCheck,
    Sprout,
    Coins,
    Users,
    Settings,
} from "lucide-react";

export const NAV_SECTIONS = [
    {
        label: "Tổng quan",
        items: [
            { to: "/nha-cung-cap", label: "Dashboard", icon: LayoutDashboard, end: true },
            { to: "/nha-cung-cap/phan-tich", label: "Phân tích", icon: LineChart },
        ],
    },
    {
        label: "Kinh doanh",
        items: [
            { to: "/nha-cung-cap/don-hang", label: "Đơn hàng", icon: ClipboardList, dot: true },
            { to: "/nha-cung-cap/san-pham", label: "Sản phẩm", icon: Package },
            { to: "/nha-cung-cap/chung-nhan", label: "Chứng nhận", icon: BadgeCheck },
            { to: "/nha-cung-cap/danh-muc", label: "Danh mục", icon: Sprout },
        ],
    },
    {
        label: "Quản lý",
        items: [
            { to: "/nha-cung-cap/doanh-thu", label: "Doanh thu", icon: Coins },
            { to: "/nha-cung-cap/khach-hang", label: "Khách hàng", icon: Users },
            { to: "/nha-cung-cap/cai-dat", label: "Cài đặt", icon: Settings },
        ],
    },
];

// Header dùng hàm này để hiện tên trang hiện tại (ví dụ "Chứng nhận") cạnh nút menu
export function getPageTitle(pathname) {
    if (pathname.startsWith("/nha-cung-cap/tat-ca-thong-bao")) return "Thông báo";
    for (const section of NAV_SECTIONS) {
        for (const item of section.items) {
            const matches = item.end ? pathname === item.to : pathname.startsWith(item.to);
            if (matches) return item.label;
        }
    }
    return "";
}
