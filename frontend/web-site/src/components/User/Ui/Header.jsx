import { Search, ShoppingCart, Newspaper, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../../contexts/cartProvider";
import CategoryDropdown from "../Home/CategoryDropdown";

export default function Header() {
    const { totalQuantity } = useCart();
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
            <div className="max-w-[1280px] mx-auto px-10 h-[72px] flex items-center justify-between gap-8">

                {/* Logo + Nav */}
                <div className="flex items-center gap-8 shrink-0">
                    <span className="text-emerald-950 text-2xl font-bold font-serif cursor-pointer select-none">
                        <Link to="/trang-chu">GreenMarket</Link>
                    </span>
                    <nav className="flex items-center gap-6">
                        <Link to="/trang-chu" className="text-neutral-600 text-sm font-medium hover:scale-105 hover:text-green-600 transition-colors">
                            Cửa hàng
                        </Link>
                        <CategoryDropdown />
                    </nav>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm thực phẩm sạch..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Icons */}
                <div className="flex items-center gap-2 shrink-0">
                    <Link to="/theo-doi-don-hang"
                        className="hover:scale-110 p-2 rounded-full hover:bg-zinc-100 hover:text-green-600 transition-colors text-zinc-700">
                        <Newspaper className="w-5 h-5" />
                    </Link>
                    <Link
                        to="/gio-hang"
                        className="relative hover:scale-110 p-2 rounded-full hover:bg-zinc-100 hover:text-green-600 transition-colors text-zinc-700"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {totalQuantity > 0 ? (
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold text-white">
                                {totalQuantity > 99 ? "99+" : totalQuantity}
                            </span>
                        ) : null}
                    </Link>
                    <Link to="/tai-khoan/" className="hover:scale-110 p-2 rounded-full hover:bg-zinc-100 hover:text-green-600 transition-colors text-zinc-700">
                        <User className="w-5 h-5" />
                    </Link>
                </div>

            </div>
        </header>
    );
}