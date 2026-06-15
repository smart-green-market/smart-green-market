import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/authProvider";

export default function DealerLoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await login(username, password, "dealer");

        if (!result.success) {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="flex min-h-screen w-full">
            <div className="relative hidden flex-1 overflow-hidden bg-[#006c49] lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-50"
                    style={{
                        backgroundImage:
                            "url('https://vietpatservice.com/wp-content/uploads/2015/01/rau-cu-sach.jpg')",
                        mixBlendMode: "overlay",
                    }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(0deg, rgba(0,108,73,0.92) 0%, rgba(0,108,73,0.25) 100%)",
                    }}
                />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                        <span className="text-lg">🏪</span>
                    </div>
                    <span className="text-[20px] font-bold tracking-tight text-white">
                        Smart Green Market
                    </span>
                </div>

                <div className="relative z-10 max-w-md">
                    <h1 className="mb-4 text-[34px] font-extrabold leading-tight tracking-tight text-white">
                        Khu vực đại lý
                    </h1>
                    <p className="text-sm leading-relaxed text-[#9df4c9] opacity-90">
                        Quản lý cửa hàng, sản phẩm bán lẻ và theo dõi hoạt động
                        kinh doanh của bạn trên nền tảng Smart Green Market.
                    </p>
                </div>

                <div className="relative z-10 text-[11px] text-white/40">
                    © 2025 Smart Green Market
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4 py-12">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl"
                >
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-[#141b2b]">
                            Đăng nhập
                        </h1>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700">
                                Tên đăng nhập
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-2 h-12 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                placeholder="Nhập tên đăng nhập"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700">
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-2 h-12 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                placeholder="Nhập mật khẩu"
                                required
                            />
                        </div>

                        {error ? (
                            <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`h-12 rounded-xl font-semibold text-white transition-colors ${
                                loading
                                    ? "cursor-not-allowed bg-emerald-400"
                                    : "bg-emerald-700 hover:bg-emerald-800"
                            }`}
                        >
                            {loading ? "Đang xử lý..." : "Đăng nhập"}
                        </button>
                    </div>

                    <p className="mt-6 text-center text-sm text-neutral-500">
                        Chưa có tài khoản?{" "}
                        <Link
                            to="/dai-ly/dang-ky"
                            className="font-semibold text-emerald-700 no-underline hover:text-emerald-800"
                        >
                            Đăng ký đại lý
                        </Link>
                    </p>

                    <p className="mt-3 text-center text-sm text-neutral-400">
                        <Link to="/" className="text-neutral-500 no-underline hover:text-neutral-700">
                            ← Về trang chủ
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
