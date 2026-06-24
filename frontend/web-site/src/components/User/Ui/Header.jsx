import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Newspaper, User } from "lucide-react";
import { useAuth } from "../../../contexts/authProvider";
import { isBuyerUser } from "../../../utils/buyerAuthUtils";
import { useCart } from "../../../contexts/cartProvider";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";

function HeaderNavLink({ to, icon: Icon, label, title, badge }) {
    return (
        <Link
            to={to}
            className="hover:scale-110 transition-transform duration-200 flex flex-col items-center gap-0.5 rounded-full p-2 text-zinc-700 no-underline transition-colors hover:bg-zinc-100 hover:text-green-600 md:rounded-lg md:px-3 md:py-1.5"
            title={title}
            aria-label={title}
        >
            <span className="relative inline-flex">
                <Icon className="h-5 w-5" />
                {badge}
            </span>
            <span className="hidden text-xs font-medium leading-none md:block">
                {label}
            </span>
        </Link>
    );
}

function HeaderNavDivider() {
    return (
        <span
            className="hidden px-1.5 text-sm text-neutral-300 md:inline"
            aria-hidden
        >
            |
        </span>
    );
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

    const searchInput = (
        <div className="relative w-full min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm kiếm thực phẩm sạch..."
                className="w-full rounded-lg bg-zinc-100 py-2 pl-10 pr-4 text-sm text-neutral-700 placeholder-neutral-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-300"
            />
        </div>
    );

    return (
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-stone-200 bg-white/90 shadow-sm backdrop-blur-md">
            <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
                {/* Hàng trên: logo + actions */}
                <div className="flex h-14 items-center justify-between gap-2 sm:gap-4 md:h-[72px] md:gap-8">
                    <Link
                        to={paths.home}
                        className="min-w-0 shrink font-serif text-lg font-bold text-emerald-950 no-underline sm:text-xl md:text-2xl"
                    >
                        <span className="truncate md:hidden">Green Market</span>
                        <span className="hidden md:inline">Smart Green Market</span>
                    </Link>

                    {/* Search desktop — nằm giữa hàng 1 */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="hidden min-w-0 flex-1 md:block md:max-w-md"
                    >
                        {searchInput}
                    </form>

                    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 md:gap-0">
                        {isLoggedIn ? (
                            <>
                                <HeaderNavLink
                                    to={paths.orderStatus}
                                    icon={Newspaper}
                                    label="Đơn hàng"
                                    title="Theo dõi đơn hàng"
                                />
                                <HeaderNavDivider />
                                <HeaderNavLink
                                    to={paths.cart}
                                    icon={ShoppingCart}
                                    label="Giỏ hàng"
                                    title="Giỏ hàng"
                                    badge={
                                        itemCount > 0 ? (
                                            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold text-white">
                                                {itemCount > 9
                                                    ? "9+"
                                                    : itemCount}
                                            </span>
                                        ) : null
                                    }
                                />
                                <HeaderNavDivider />
                                <HeaderNavLink
                                    to={paths.account}
                                    icon={User}
                                    label="Tài khoản"
                                    title="Tài khoản"
                                />
                            </>
                        ) : (
                            <>
                                <Link
                                    to={paths.login}
                                    className="whitespace-nowrap rounded-lg border border-emerald-800 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 no-underline transition-colors hover:bg-emerald-50 sm:px-4 sm:py-2 sm:text-sm"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to={paths.register}
                                    className="whitespace-nowrap rounded-lg bg-emerald-800 px-2.5 py-1.5 text-xs font-semibold text-white no-underline transition-colors hover:bg-emerald-900 sm:px-4 sm:py-2 sm:text-sm"
                                >
                                    Đăng ký
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Search mobile — hàng 2 */}
                <form
                    onSubmit={handleSearchSubmit}
                    className="pt-1 pb-3 md:hidden"
                >
                    {searchInput}
                </form>
            </div>
        </header>
    );
}
