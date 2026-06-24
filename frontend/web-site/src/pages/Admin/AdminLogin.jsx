import { useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    ShieldCheck,
    User,
    Users,
    Package,
    Bell,
} from "lucide-react";
import { useAuth } from "../../contexts/authProvider";

const HIGHLIGHTS = [
    { icon: Users, label: "Nhà cung cấp & đại lý" },
    { icon: Package, label: "Duyệt sản phẩm, danh mục" },
    { icon: Bell, label: "Thông báo hệ thống" },
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

export default function AdminLoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await login(username, password, "admin");

        if (!result.success) {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="flex min-h-screen min-h-[100dvh] w-full font-['Geist',sans-serif]">
            {/* ── Left panel ── */}
            <aside className="relative hidden overflow-hidden bg-[#064e3b] lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 admin-login-bg"
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
                        <p className="font-['Noto_Serif',serif] text-xl font-bold tracking-tight text-white">
                            GreenMarket
                        </p>
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-200/80">
                            Bảng quản trị
                        </p>
                    </div>
                </div>

                <div className="relative z-10 max-w-md space-y-8">
                    <div>
                        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Khu vực quản trị
                        </p>
                        <h1 className="font-['Noto_Serif',serif] text-[2rem] font-bold leading-tight tracking-tight text-white xl:text-[2.35rem]">
                            Điều phối toàn bộ nền tảng từ một nơi
                        </h1>
                        <p className="mt-4 text-sm leading-relaxed text-emerald-100/85">
                            Theo dõi nhà cung cấp, duyệt hồ sơ và xử lý thông báo vận hành gọn gàng trong một màn hình.
                        </p>
                    </div>

                    <ul className="space-y-3">
                        {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                            <li
                                key={label}
                                className="hover:scale-105 cursor-pointer flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 backdrop-blur-sm transition-colors hover:bg-white/10"
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

            {/* ── Form panel (responsive mobile; desktop giữ nguyên layout) ── */}
            <main className="relative flex flex-1 flex-col items-center justify-center bg-[#f7f7f5] px-4 py-6 sm:px-8 sm:py-10">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.45]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 1px 1px, #d4d4d4 1px, transparent 0)",
                        backgroundSize: "24px 24px",
                    }}
                />

                <div className="admin-login-enter relative w-full max-w-[420px]">
                    {/* Header mobile — ẩn trên desktop (logo đã có ở panel trái) */}
                    <div className="mb-5 flex items-center gap-3 sm:mb-6 lg:hidden">
                        <BrandMark className="h-10 w-10 sm:h-11 sm:w-11" />
                        <div className="min-w-0">
                            <p className="truncate font-['Noto_Serif',serif] text-lg font-bold text-emerald-950 sm:text-xl">
                                GreenMarket
                            </p>
                            <p className="text-xs text-neutral-500 sm:text-sm">
                                Đăng nhập quản trị
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                        <div className="h-1 bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-600" />

                        <form
                            onSubmit={handleSubmit}
                            className="p-5 sm:p-8 lg:p-9"
                        >
                            <div className="mb-6 text-center sm:mb-8">
                                <h1 className="text-2xl font-bold text-[#141b2b] sm:text-3xl">
                                    Đăng nhập
                                </h1>
                                <p className="mt-1 text-sm text-neutral-500">
                                    Tài khoản quản trị viên hệ thống
                                </p>
                            </div>

                            <div className="space-y-4 sm:space-y-5">
                                <div>
                                    <label
                                        htmlFor="admin-username"
                                        className="text-xs font-semibold uppercase tracking-wider text-neutral-600"
                                    >
                                        Tên đăng nhập
                                    </label>
                                    <div className="relative mt-2">
                                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                        <input
                                            id="admin-username"
                                            type="text"
                                            autoComplete="username"
                                            value={username}
                                            onChange={(e) =>
                                                setUsername(e.target.value)
                                            }
                                            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-4 text-base text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 sm:text-sm"
                                            placeholder="Nhập tên đăng nhập"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="admin-password"
                                        className="text-xs font-semibold uppercase tracking-wider text-neutral-600"
                                    >
                                        Mật khẩu
                                    </label>
                                    <div className="relative mt-2">
                                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                        <input
                                            id="admin-password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-11 text-base text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 sm:text-sm"
                                            placeholder="Nhập mật khẩu"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((v) => !v)
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition-colors hover:text-neutral-700"
                                            aria-label={
                                                showPassword
                                                    ? "Ẩn mật khẩu"
                                                    : "Hiện mật khẩu"
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
                                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-800 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-emerald-500/70 sm:hover:scale-[1.01]"
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

                            <p className="mt-5 text-center sm:mt-6">
                                <Link
                                    to="/"
                                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 no-underline transition-colors hover:text-emerald-800"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Về trang chủ
                                </Link>
                            </p>
                        </form>
                    </div>

                    <p className="mt-4 text-center text-xs text-neutral-400 lg:hidden">
                        © {new Date().getFullYear()} Smart Green Market
                    </p>
                </div>
            </main>

            <style>{`
                @keyframes adminLoginEnter {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes adminLoginBg {
                    from { transform: scale(1); }
                    to { transform: scale(1.06); }
                }
                .admin-login-enter {
                    animation: adminLoginEnter 0.45s ease-out both;
                }
                .admin-login-bg {
                    animation: adminLoginBg 18s ease-in-out infinite alternate;
                }
                @media (prefers-reduced-motion: reduce) {
                    .admin-login-enter,
                    .admin-login-bg {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
