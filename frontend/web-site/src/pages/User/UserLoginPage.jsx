import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Mail,
    ShieldCheck,
    ShoppingBag,
    Store,
    Truck,
} from "lucide-react";
import { useAuth } from "../../contexts/authProvider";
import { loginBuyer, STORE_DEALER_SLUG_KEY } from "../../utils/buyerAuthUtils";

const HIGHLIGHTS = [
    { icon: ShoppingBag, label: "Mua sắm nông sản sạch" },
    { icon: Truck, label: "Theo dõi đơn hàng nhanh" },
    { icon: Store, label: "Cửa hàng đại lý uy tín" },
];

function BrandMark({ className = "h-11 w-11" }) {
    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${className}`}
        >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
                <path
                    d="M13 3C13 3 5 8 5 15a8 8 0 0016 0C21 8 13 3 13 3z"
                    fill="#006c49"
                />
                <path
                    d="M13 10v10M9 14l4-4 4 4"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}

export default function UserLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { dealerSlug = "" } = useParams();
    const { syncSession } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (dealerSlug) {
            localStorage.setItem(STORE_DEALER_SLUG_KEY, dealerSlug);
        }
    }, [dealerSlug]);

    const registerPath = `/cua-hang/${encodeURIComponent(dealerSlug)}/dang-ky`;
    const storefrontPath = `/cua-hang/${encodeURIComponent(dealerSlug)}/trang-chu`;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const result = await loginBuyer(dealerSlug, { email, password });

        if (!result.success) {
            setError(result.message);
            setLoading(false);
            return;
        }

        syncSession?.();
        const buyNow = location.state?.buyNow;
        const redirectTo =
            location.state?.from ||
            `/cua-hang/${encodeURIComponent(dealerSlug)}/trang-chu`;
        navigate(redirectTo, {
            replace: true,
            ...(buyNow ? { state: { buyNow } } : {}),
        });
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen w-full">
            <aside className="relative hidden overflow-hidden bg-[#064e3b] lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12">
                <div
                    className="admin-login-bg absolute inset-0 bg-cover bg-center opacity-40"
                    style={{
                        backgroundImage:
                            "url('https://vietpatservice.com/wp-content/uploads/2015/01/rau-cu-sach.jpg')",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#064e3b] via-[#006c49]/85 to-[#047857]/70" />
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                        backgroundSize: "28px 28px",
                    }}
                />

                <div className="relative z-10 flex items-center gap-3">
                    <BrandMark />
                    <div>
                        <p className="text-xl font-bold tracking-tight text-white">
                            GreenMarket
                        </p>
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-200/80">
                            Cửa hàng khách hàng
                        </p>
                    </div>
                </div>

                <div className="relative z-10 max-w-md space-y-8">
                    <div>
                        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Khu vực mua hàng
                        </p>
                        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-white xl:text-[2.35rem]">
                            Nông sản sạch, giao tận tay bạn
                        </h1>
                        <p className="mt-4 text-sm leading-relaxed text-emerald-100/85">
                            Đăng nhập tài khoản tại cửa hàng đại lý để đặt hàng, theo dõi giao
                            hàng và quản lý thông tin cá nhân.
                        </p>
                    </div>

                    <ul className="space-y-3">
                        {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                            <li
                                key={label}
                                className="hover:scale-105 transition-all duration-300 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 backdrop-blur-sm transition-colors hover:bg-white/10"
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                                    <Icon className="h-4 w-4 text-emerald-200" />
                                </span>
                                {label}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative z-10 text-xs text-white/35">
                    © {new Date().getFullYear()} Smart Green Market
                </p>
            </aside>

            <main className="relative flex flex-1 flex-col items-center justify-center bg-[#f7f7f5] px-4 py-10 sm:px-8">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.45]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 1px 1px, #d4d4d4 1px, transparent 0)",
                        backgroundSize: "24px 24px",
                    }}
                />

                <div className="admin-login-enter relative w-full max-w-[420px]">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <BrandMark className="h-10 w-10" />
                        <div>
                            <p className="text-lg font-bold text-emerald-950">
                                GreenMarket
                            </p>
                            <p className="text-xs text-neutral-500">Đăng nhập khách hàng</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                        <div className="h-1 bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-600" />

                        <form onSubmit={handleSubmit} className="p-6 sm:p-9">
                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-bold text-[#141b2b]">Đăng nhập</h1>
                                <p className="mt-1 text-sm text-neutral-500">
                                    Tài khoản khách hàng tại cửa hàng đại lý
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="buyer-email"
                                        className="text-xs font-semibold uppercase tracking-wider text-neutral-600"
                                    >
                                        Email
                                    </label>
                                    <div className="relative mt-2">
                                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                        <input
                                            id="buyer-email"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-4 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15"
                                            placeholder="buyer@gmail.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="buyer-password"
                                        className="text-xs font-semibold uppercase tracking-wider text-neutral-600"
                                    >
                                        Mật khẩu
                                    </label>
                                    <div className="relative mt-2">
                                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                        <input
                                            id="buyer-password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-11 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15"
                                            placeholder="Nhập mật khẩu"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-neutral-400 transition-colors hover:text-neutral-700"
                                            aria-label={
                                                showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {error ? (
                                    <div
                                        role="alert"
                                        className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700"
                                    >
                                        {error}
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-800 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-emerald-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-emerald-500/70"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        "Đăng nhập"
                                    )}
                                </button>
                            </div>

                            <p className="mt-5 text-center text-sm text-neutral-500">
                                Chưa có tài khoản?{" "}
                                <Link
                                    to={registerPath}
                                    className="font-semibold text-emerald-800 no-underline hover:text-emerald-900"
                                >
                                    Đăng ký ngay
                                </Link>
                            </p>

                            <p className="mt-4 text-center">
                                <Link
                                    to={storefrontPath}
                                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 no-underline transition-colors hover:text-emerald-800"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Về cửa hàng
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes adminLoginEnter {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes adminLoginBg {
                    from { transform: scale(1); }
                    to { transform: scale(1.06); }
                }
                .admin-login-enter { animation: adminLoginEnter 0.45s ease-out both; }
                .admin-login-bg { animation: adminLoginBg 18s ease-in-out infinite alternate; }
                @media (prefers-reduced-motion: reduce) {
                    .admin-login-enter, .admin-login-bg { animation: none; }
                }
            `}</style>
        </div>
    );
}
