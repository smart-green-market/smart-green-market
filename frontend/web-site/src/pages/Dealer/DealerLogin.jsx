import { useState } from "react";
import { useAuth } from "../../contexts/authProvider";
import { Leaf, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";

// Thêm state

export default function DealerLoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Truyền role "dealer" để AuthProvider kiểm tra phân quyền
        const result = await login(username, password, "dealer");

        if (!result.success) {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-emerald-100/40 via-stone-50 to-green-100/30 px-4 font-['Geist',sans-serif]">

            {/* Login Card */}
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-emerald-100/40 p-8 relative overflow-hidden">
                {/* Decorative top green glow */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500" />

                <div className="text-center mb-8">
                    {/* Icon leaf representing veggie green */}
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                        <Leaf className="w-6 h-6 text-emerald-600" />
                    </div>

                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">
                        Đại lý nông sản
                    </span>
                    <h1 className="text-2xl font-extrabold mt-3 text-emerald-950 tracking-tight">
                        Đăng Nhập Đại Lý
                    </h1>
                    <p className="text-xs text-emerald-800/60 mt-1.5">
                        Quản lý cửa hàng phân phối sản phẩm hữu cơ
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username Input */}
                    <div>
                        <label className="block text-xs font-bold text-emerald-900/80 uppercase tracking-wider">
                            Tên đăng nhập
                        </label>
                        <div className="relative mt-2">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                                <User className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-xs text-neutral-800 font-medium"
                                placeholder="Nhập tên đăng nhập của đại lý"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-xs font-bold text-emerald-900/80 uppercase tracking-wider">
                            Mật khẩu
                        </label>
                        <div className="relative mt-2">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-xs text-neutral-800 font-medium"
                                placeholder="Nhập mật khẩu"
                                required
                            />
                            {/* Icon mắt */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-3.5 rounded-xl text-center font-bold">
                            {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full h-11 rounded-xl text-white font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${loading
                            ? "bg-emerald-600/50 cursor-not-allowed"
                            : "bg-emerald-700 hover:bg-emerald-800 shadow-emerald-100"
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            "Đăng nhập"
                        )}
                    </button>
                </form>

                {/* Footer note */}
                <div className="mt-8 text-center border-t border-neutral-100 pt-6">
                    <p className="text-[10px] text-neutral-400">
                        Hệ thống cung ứng thực phẩm an toàn GreenMarket
                    </p>
                </div>
            </div>
        </div>
    );
}
