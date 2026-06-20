import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import UserRegisterLeftPanel from "../../components/User/Auth/UserRegisterLeftPanel";
import { useAuth } from "../../contexts/authProvider";
import { registerBuyer, STORE_DEALER_SLUG_KEY } from "../../utils/buyerAuthUtils";

export default function UserRegisterPage() {
    const navigate = useNavigate();
    const { dealerSlug = "" } = useParams();
    const { syncSession } = useAuth();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        repassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (dealerSlug) {
            localStorage.setItem(STORE_DEALER_SLUG_KEY, dealerSlug);
        }
    }, [dealerSlug]);

    const set = (key) => (event) =>
        setForm((prev) => ({
            ...prev,
            [key]: event.target.value,
        }));

    const loginPath = `/cua-hang/${encodeURIComponent(dealerSlug)}/dang-nhap`;
    const storefrontPath = `/cua-hang/${encodeURIComponent(dealerSlug)}/trang-chu`;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const result = await registerBuyer(dealerSlug, form);

        if (!result.success) {
            setError(result.message);
            setLoading(false);
            return;
        }

        syncSession?.();
        navigate(storefrontPath, { replace: true });
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen w-full">
            <div className="hidden lg:flex lg:w-[46%]">
                <UserRegisterLeftPanel />
            </div>

            <div className="flex min-h-screen flex-1 items-start justify-center overflow-y-auto bg-gray-50 p-8 sm:p-12">
                <div className="w-full max-w-[440px] pt-2 sm:pt-6">
                    <h2 className="mb-1 text-[28px] font-extrabold tracking-tight text-[#141b2b]">
                        Tạo tài khoản
                    </h2>
                    <p className="mb-8 text-[13.5px] leading-relaxed text-[#5a6a5e]">
                        Đăng ký khách hàng tại cửa hàng đại lý trên Smart Green Market.
                    </p>

                    {error ? (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit}>
                        <Field label="👤 Họ tên">
                            <input
                                type="text"
                                value={form.full_name}
                                onChange={set("full_name")}
                                placeholder="VD: Nguyễn Văn A"
                                required
                            />
                        </Field>

                        <Field label="✉️ Email">
                            <input
                                type="email"
                                value={form.email}
                                onChange={set("email")}
                                placeholder="buyer@gmail.com"
                                required
                            />
                        </Field>

                        <Field label="📱 Số điện thoại">
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={set("phone")}
                                placeholder="0901234567"
                                required
                            />
                        </Field>

                        <Field label="🔒 Mật khẩu">
                            <input
                                type="password"
                                value={form.password}
                                onChange={set("password")}
                                placeholder="••••••••"
                                required
                            />
                        </Field>

                        <Field label="🔒 Xác nhận mật khẩu">
                            <input
                                type="password"
                                value={form.repassword}
                                onChange={set("repassword")}
                                placeholder="••••••••"
                                required
                            />
                        </Field>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`hover:scale-105 transition-all duration-300 cursor-pointer mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[15px] font-bold text-white transition-all ${
                                loading
                                    ? "cursor-not-allowed bg-gray-400"
                                    : "bg-[#006c49] hover:-translate-y-0.5 hover:bg-[#005038]"
                            }`}
                        >
                            {loading ? "Đang xử lý..." : "Đăng ký"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-[13px] text-[#5a6a5e]">
                        Đã có tài khoản?{" "}
                        <Link
                            to={loginPath}
                            className="font-bold text-[#006c49] no-underline"
                        >
                            Đăng nhập ngay
                        </Link>
                    </p>

                    <p className="mt-4 text-center">
                        <Link
                            to={storefrontPath}
                            className="text-[13px] text-[#5a6a5e] no-underline hover:text-[#006c49]"
                        >
                            ← Về cửa hàng
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="mb-4 flex-1">
            <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#3c4a42]">
                {label}
            </label>
            {React.cloneElement(children, {
                className:
                    "w-full rounded-xl border border-[#d1e5d9] bg-[#f1f5f2] px-4 py-3 text-[14px] text-[#141b2b] outline-none transition-all placeholder:text-[#a3b5a8] focus:border-[#006c49] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,108,73,0.12)]",
            })}
        </div>
    );
}
