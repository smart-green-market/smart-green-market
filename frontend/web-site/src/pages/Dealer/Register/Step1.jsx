import React, { useState } from "react";
import { Link } from "react-router-dom";
import { accountService } from "../../../services/api/accountService";
import { authService } from "../../../services/api/authAdminService";
import { saveAuthTokens } from "../../../services/token/authTokenStorage";
import { extractApiError } from "../../../utils/extractApiError";
import {
    attemptResumeDealerRegistration,
    isAccountExistsError,
} from "./dealerRegistrationHelpers";

export default function Step1({ onNext }) {
    const [form, setForm] = useState({
        full_name: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        repassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const set = (key) => (e) =>
        setForm((prev) => ({
            ...prev,
            [key]: e.target.value,
        }));

    const saveSession = (loginResult) => {
        saveAuthTokens({
            access: loginResult.access,
            refresh: loginResult.refresh,
        });
        localStorage.setItem("user", JSON.stringify(loginResult.account));
    };

    const handleSubmit = async () => {
        try {
            setError("");

            if (!form.full_name.trim()) return setError("Vui lòng nhập họ tên");
            if (!form.username.trim()) return setError("Vui lòng nhập tên tài khoản");
            if (!form.email.trim()) return setError("Vui lòng nhập email");
            if (!form.phone.trim()) return setError("Vui lòng nhập số điện thoại");
            if (!form.password) return setError("Vui lòng nhập mật khẩu");
            if (form.password !== form.repassword) {
                return setError("Mật khẩu xác nhận không khớp");
            }

            setLoading(true);

            try {
                await accountService.create({
                    username: form.username.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    repassword: form.repassword,
                    full_name: form.full_name.trim(),
                    phone: form.phone.trim(),
                    role: "dealer",
                });

                const loginResult = await authService.login({
                    username: form.username.trim(),
                    password: form.password,
                });

                saveSession(loginResult);
                onNext?.();
            } catch (createErr) {
                if (!isAccountExistsError(createErr)) {
                    throw createErr;
                }

                const resume = await attemptResumeDealerRegistration(
                    form.username,
                    form.password,
                );

                onNext?.(resume);
            }
        } catch (err) {
            setError(extractApiError(err, "Đăng ký thất bại"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-[fadeSlide_0.28s_ease]">
            <h2 className="mb-1 text-[28px] font-extrabold tracking-tight text-[#141b2b]">
                Tạo tài khoản
            </h2>
            <p className="mb-8 text-[13.5px] leading-relaxed text-[#5a6a5e]">
                Đăng ký đại lý trên Smart Green Market.
            </p>

            {error ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            ) : null}

            <Field label="👤 Họ tên">
                <input
                    type="text"
                    value={form.full_name}
                    onChange={set("full_name")}
                    placeholder="VD: Nguyễn Văn A"
                />
            </Field>

            <Field label="👤 Tài khoản">
                <input
                    type="text"
                    value={form.username}
                    onChange={set("username")}
                    placeholder="dealer01"
                />
            </Field>

            <Field label="✉️ Email">
                <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="dealer01@example.com"
                />
            </Field>

            <Field label="📱 Số điện thoại">
                <input
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="0901234567"
                />
            </Field>

            <Field label="🔒 Mật khẩu">
                <input
                    type="password"
                    value={form.password}
                    onChange={set("password")}
                    placeholder="••••••••"
                />
            </Field>

            <Field label="🔒 Xác nhận mật khẩu">
                <input
                    type="password"
                    value={form.repassword}
                    onChange={set("repassword")}
                    placeholder="••••••••"
                />
            </Field>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[15px] font-bold text-white transition-all ${loading
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-[#006c49] hover:-translate-y-0.5 hover:bg-[#005038]"
                    }`}
            >
                {loading ? "Đang xử lý..." : "Tiếp tục"}
            </button>

            <p className="mt-6 text-center text-[13px] text-[#5a6a5e]">
                Đã có tài khoản?{" "}
                <Link to="/dai-ly/dang-nhap" className="font-bold text-[#006c49] no-underline">
                    Đăng nhập ngay
                </Link>
            </p>
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
