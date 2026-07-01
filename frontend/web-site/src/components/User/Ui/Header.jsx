import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Newspaper, User, Package } from "lucide-react";
import { useAuth } from "../../../contexts/authProvider";
import { isBuyerUser } from "../../../utils/buyerAuthUtils";
import { useCart } from "../../../contexts/cartProvider";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import BuyerNotificationBell from "../../common/BuyerNotificationBell";

function HeaderNavLink({ to, icon: Icon, label, title, badge }) {
    return (
        <Link
            to={to}
            className="hover:scale-110 transition-transform duration-200 flex flex-col items-center gap-0.5 rounded-full p-2 text-white no-underline transition-colors hover:bg-white/10 md:rounded-lg md:px-3 md:py-1.5"
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
            className="hidden px-1.5 text-sm text-white/40 md:inline"
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm kiếm thực phẩm sạch..."
                className="w-full rounded-lg bg-white/15 py-2 pl-10 pr-4 text-sm text-white placeholder-white/60 outline-none transition-all focus:bg-white/20 focus:ring-2 focus:ring-white/30"
            />
        </div>
    );

    return (
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-emerald-900/30 bg-emerald-700 shadow-sm">
            <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
                {/* Hàng trên: logo + actions */}
                <div className="flex h-14 items-center justify-between gap-2 sm:gap-4 md:h-[72px] md:gap-8">
                    <Link
                        to={paths.home}
                        className="min-w-0 shrink text-lg font-bold text-white no-underline sm:text-xl md:text-2xl"
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

                    <div
                        className={`flex shrink-0 items-center gap-0.5 sm:gap-1 ${
                            isLoggedIn ? "md:gap-0" : "md:gap-3"
                        }`}
                    >
                        <HeaderNavLink
                            to={paths.products}
                            icon={Package}
                            label="Sản phẩm"
                            title="Sản phẩm"
                        />
                        {isLoggedIn ? (
                            <>
                                <HeaderNavDivider />
                                <BuyerNotificationBell />
                                <HeaderNavDivider />
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
                                            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-emerald-700">
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
                                <HeaderNavDivider />
                                <Link
                                    to={paths.login}
                                    className="whitespace-nowrap rounded-lg border border-white px-2.5 py-1.5 text-xs font-semibold text-white no-underline transition-colors hover:bg-white/10 sm:px-4 sm:py-2 sm:text-sm md:px-5"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to={paths.register}
                                    className="whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 no-underline transition-colors hover:bg-white/90 sm:px-4 sm:py-2 sm:text-sm md:px-5"
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
