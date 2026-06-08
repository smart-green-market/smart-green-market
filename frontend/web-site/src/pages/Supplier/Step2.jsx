import React, { useState } from "react";
import { supplierService } from "../../services/api/suppilerService";

export default function Step2({ onNext, onBack }) {
  const [form, setForm] = useState({
    company_name: "",
    tax_code: "",
    phone: "",
    address: "",
    description: "",
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

      if (!form.company_name.trim()) {
        return setError("Vui lòng nhập tên công ty");
      }

      if (!form.tax_code.trim()) {
        return setError("Vui lòng nhập mã số thuế");
      }

      if (!form.phone.trim()) {
        return setError("Vui lòng nhập số điện thoại");
      }

      if (!form.address.trim()) {
        return setError("Vui lòng nhập địa chỉ");
      }

      if (!form.description.trim()) {
        return setError("Vui lòng nhập mô tả hoạt động");
      }

      setLoading(true);

      const payload = {
        company_name: form.company_name,
        tax_code: form.tax_code,
        phone: form.phone,
        address: form.address,
        description: form.description,
      };

      console.log("Payload gửi lên:", payload);

      const result = await supplierService.create(payload);

      console.log("Tạo nhà cung cấp thành công:", result);

      onNext?.(result);
    } catch (err) {
      console.error("FULL ERROR:", err);
      console.log("STATUS:", err.response?.status);
      console.log("DATA:", err.response?.data);

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Có lỗi xảy ra khi tạo nhà cung cấp";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-[fadeSlide_0.28s_ease]">
      <h2 className="text-[28px] font-extrabold text-[#141b2b] tracking-tight mb-1">
        Thông tin doanh nghiệp
      </h2>

      <p className="text-[13.5px] text-[#5a6a5e] leading-relaxed mb-8">
        Điền thông tin để xác minh tư cách nhà cung cấp của bạn.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <Field label="🏢 Tên công ty / hộ kinh doanh">
        <input
          value={form.company_name}
          onChange={set("company_name")}
          placeholder="VD: Công ty Nông Sản ABC"
        />
      </Field>

      <Field label="🔢 Mã số thuế">
        <input
          value={form.tax_code}
          onChange={set("tax_code")}
          placeholder="0123456789"
        />
      </Field>

      <Field label="📱 Số điện thoại liên hệ">
        <input
          type="tel"
          value={form.phone}
          onChange={set("phone")}
          placeholder="0901234567"
        />
      </Field>

      <Field label="📍 Địa chỉ">
        <input
          value={form.address}
          onChange={set("address")}
          placeholder="123 Đường X, Quận Y, TP.HCM"
        />
      </Field>

      <Field label="📝 Mô tả hoạt động kinh doanh">
        <textarea
          value={form.description}
          onChange={set("description")}
          placeholder="Chuyên cung cấp rau củ hữu cơ, trái cây sạch..."
          rows={4}
          className="w-full px-4 py-3 bg-[#f1f5f2] border border-[#d1e5d9] rounded-xl text-[14px] text-[#141b2b] outline-none transition-all focus:border-[#006c49] focus:shadow-[0_0_0_3px_rgba(0,108,73,0.12)] focus:bg-white placeholder:text-[#a3b5a8] resize-y"
        />
      </Field>

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="px-6 py-3 bg-[#f1f5f2] text-[#141b2b] border border-[#d1e5d9] rounded-xl text-[15px] font-bold hover:bg-[#e2e8e5] transition-all"
        >
          Quay lại
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`px-6 py-3 text-white rounded-xl text-[15px] font-bold transition-all ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#006c49] hover:bg-[#005038]"
          }`}
        >
          {loading ? "Đang xử lý..." : "Tiếp tục"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3c4a42] mb-1.5">
        {label}
      </label>

      {children.type === "textarea"
        ? children
        : React.cloneElement(children, {
            className:
              "w-full px-4 py-3 bg-[#f1f5f2] border border-[#d1e5d9] rounded-xl text-[14px] text-[#141b2b] outline-none transition-all focus:border-[#006c49] focus:shadow-[0_0_0_3px_rgba(0,108,73,0.12)] focus:bg-white placeholder:text-[#a3b5a8]",
          })}
    </div>
  );
}