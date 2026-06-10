import { useState } from "react";
import { useAuth } from "../../contexts/authProvider"; // Đảm bảo đường dẫn này đúng với project của bạn

export default function SupplierLoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Truyền thêm tham số "supplier" để AuthProvider kiểm tra role
        const result = await login(username, password, "supplier");

        if (!result.success) {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
            <form 
                onSubmit={handleSubmit} 
                className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 p-8"
            >
                <h1 className="text-3xl font-bold text-center mb-8 text-green-700">
                    Đăng Nhập Nhà Cung Cấp
                </h1>
                
                <div className="flex flex-col gap-5">
                    {/* Username Input */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700">
                            Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-2 w-full h-12 px-4 rounded-xl border border-neutral-300 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                            placeholder="Nhập tên đăng nhập"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-2 w-full h-12 px-4 rounded-xl border border-neutral-300 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                            placeholder="Nhập mật khẩu"
                            required
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`h-12 rounded-xl text-white font-semibold transition-colors ${
                            loading ? "bg-green-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-800"
                        }`}
                    >
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </button>
                </div>
            </form>
        </div>
    );
}