import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Newspaper, User } from "lucide-react";
import { useAuth } from "../../../contexts/authProvider";
import { useCart } from "../../../contexts/cartProvider";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";

function isBuyerUser(user) {
    if (!user) return false;
    return user.role === "buyer" || user.auth_scope === "storefront";
}

export default function Header() {
    const navigate = useNavigate();
    const paths = useStorefrontPaths();
    const { itemCount } = useCart();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    const isLoggedIn = isBuyerUser(user);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        navigate(paths.search(searchQuery));
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
            <div className="max-w-[1280px] mx-auto px-10 h-[72px] flex items-center justify-between gap-8">
                <div className="flex items-center gap-8 shrink-0">
                    <span className="text-emerald-950 text-2xl font-bold font-serif cursor-pointer select-none">
                        <Link to={paths.home}>Smart Green Market</Link>
                    </span>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Tìm kiếm thực phẩm sạch..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all"
                        />
                    </div>
                </form>

                <div className="flex items-center gap-2 shrink-0">
                    {isLoggedIn ? (
                        <>
                            <Link
                                to={paths.orderStatus}
                                className="hover:scale-110 p-2 rounded-full hover:bg-zinc-100 hover:text-green-600 transition-colors text-zinc-700"
                                title="Theo dõi đơn hàng"
                            >
                                <Newspaper className="w-5 h-5" />
                            </Link>
                            <Link
                                to={paths.cart}
                                className="relative hover:scale-110 p-2 rounded-full hover:bg-zinc-100 hover:text-green-600 transition-colors text-zinc-700"
                                title="Giỏ hàng"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {itemCount > 0 ? (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold text-white">
                                        {itemCount > 99 ? "99+" : itemCount}
                                    </span>
                                ) : null}
                            </Link>
                            <Link
                                to={paths.account}
                                className="hover:scale-110 p-2 rounded-full hover:bg-zinc-100 hover:text-green-600 transition-colors text-zinc-700"
                                title="Tài khoản"
                            >
                                <User className="w-5 h-5" />
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                to={paths.login}
                                className="rounded-lg border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-800 no-underline transition-colors hover:bg-emerald-50"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                to={paths.register}
                                className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-emerald-900"
                            >
                                Đăng ký
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
