import React, { useState } from "react";
import { accountService } from "../../services/api/accountService";
import { authService } from "../../services/api/authAdminService";
import { extractSupplierApiMessage } from "../../utils/supplierValidation";

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

  const handleSubmit = async () => {
    try {
      setError("");

      if (!form.full_name.trim()) {
        return setError("Họ tên: Không được để trống.");
      }

      if (!form.username.trim()) {
        return setError("Tên tài khoản: Không được để trống.");
      }

      if (!form.email.trim()) {
        return setError("Email: Không được để trống.");
      }

      if (!form.phone.trim()) {
        return setError("Số điện thoại: Không được để trống.");
      }

      if (!form.password) {
        return setError("Mật khẩu: Không được để trống.");
      }

      if (form.password !== form.repassword) {
        return setError("Xác nhận mật khẩu: Mật khẩu nhập lại không khớp.");
      }

      setLoading(true);

      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        repassword: form.repassword,
        full_name: form.full_name,
        phone: form.phone,
        role: "supplier",
      };
      const result = await accountService.create(payload);

      console.log("Đăng ký thành công:", result);
      const loginResult = await authService.login({
        username: form.username,
        password: form.password,
      });

      // Lưu token để Step2, Step3 dùng
      localStorage.setItem("access_token", loginResult.access);

      console.log("Đăng nhập sau đăng ký thành công:", loginResult);
      onNext?.(result);
    } catch (err) {
      console.log("STATUS:", err.response?.status);
      console.log("DATA:", err.response?.data);

      setError(extractSupplierApiMessage(err, "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-[fadeSlide_0.28s_ease]">
      <h2 className="text-[28px] font-extrabold text-[#141b2b] tracking-tight mb-1">
        Tạo tài khoản
      </h2>

      <p className="text-[13.5px] text-[#5a6a5e] leading-relaxed mb-8">
        Đăng ký nhà cung cấp trên Smart Green Market.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

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
          placeholder="supplier01"
        />
      </Field>

      <Field label="✉️ Email công việc">
        <input
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="supplier01@example.com"
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
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full mt-2 py-4 text-white rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 transition-all
          ${loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#006c49] hover:bg-[#005038] hover:-translate-y-0.5"
          }`}
      >
        {loading ? "Đang đăng ký..." : "Tiếp tục"}
      </button>

      <br />

      <p className="text-[13px] text-[#5a6a5e] text-center">
        Đã có tài khoản?{" "}
        <a
          href="#"
          className="text-[#006c49] font-bold no-underline"
        >
          Đăng nhập ngay
        </a>
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4 flex-1">
      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3c4a42] mb-1.5">
        {label}
      </label>

      {React.cloneElement(children, {
        className:
          "w-full px-4 py-3 bg-[#f1f5f2] border border-[#d1e5d9] rounded-xl text-[14px] text-[#141b2b] outline-none transition-all focus:border-[#006c49] focus:shadow-[0_0_0_3px_rgba(0,108,73,0.12)] focus:bg-white placeholder:text-[#a3b5a8]",
      })}
    </div>
  );
}