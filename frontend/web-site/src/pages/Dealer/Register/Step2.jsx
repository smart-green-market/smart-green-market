import React, { useState } from "react";

export default function Step2({ initialValues, resumeMessage, onNext, onBack }) {
    const [form, setForm] = useState({
        store_name: initialValues?.store_name || "",
        store_address: initialValues?.store_address || "",
        description: initialValues?.description || "",
    });
    const [error, setError] = useState("");

    const set = (key) => (e) =>
        setForm((prev) => ({
            ...prev,
            [key]: e.target.value,
        }));

    const handleSubmit = () => {
        setError("");

        if (!form.store_name.trim()) {
            return setError("Vui lòng nhập tên cửa hàng");
        }

        if (!form.store_address.trim()) {
            return setError("Vui lòng nhập địa chỉ cửa hàng");
        }

        if (!form.description.trim()) {
            return setError("Vui lòng nhập mô tả cửa hàng");
        }

        // Chỉ lưu cục bộ — không gọi API update ở bước này
        onNext?.({
            store_name: form.store_name.trim(),
            store_address: form.store_address.trim(),
            description: form.description.trim(),
        });
    };

    return (
        <div className="animate-[fadeSlide_0.28s_ease]">
            <h2 className="mb-1 text-[28px] font-extrabold tracking-tight text-[#141b2b]">
                Thông tin cửa hàng
            </h2>
            <p className="mb-8 text-[13.5px] leading-relaxed text-[#5a6a5e]">
                Điền thông tin cửa hàng đại lý. Dữ liệu sẽ được gửi lên hệ thống
                sau khi bạn hoàn tất bước tải giấy tờ.
            </p>

            {resumeMessage ? (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {resumeMessage}
                </div>
            ) : null}

            {error ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            ) : null}

            <Field label="🏪 Tên cửa hàng">
                <input
                    value={form.store_name}
                    onChange={set("store_name")}
                    placeholder="VD: Cửa hàng Rau Sạch ABC"
                />
            </Field>

            <Field label="📍 Địa chỉ cửa hàng">
                <input
                    value={form.store_address}
                    onChange={set("store_address")}
                    placeholder="123 Đường X, Quận Y, TP.HCM"
                />
            </Field>

            <Field label="📝 Mô tả cửa hàng">
                <textarea
                    value={form.description}
                    onChange={set("description")}
                    placeholder="Giới thiệu ngắn về cửa hàng, sản phẩm kinh doanh..."
                    rows={4}
                    className="w-full resize-y rounded-xl border border-[#d1e5d9] bg-[#f1f5f2] px-4 py-3 text-[14px] text-[#141b2b] outline-none transition-all placeholder:text-[#a3b5a8] focus:border-[#006c49] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,108,73,0.12)]"
                />
            </Field>

            <div className="mt-2 flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-xl border border-[#d1e5d9] bg-[#f1f5f2] px-6 py-3 text-[15px] font-bold text-[#141b2b] transition-all hover:bg-[#e2e8e5]"
                >
                    Quay lại
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-xl bg-[#006c49] px-6 py-3 text-[15px] font-bold text-white transition-all hover:bg-[#005038]"
                >
                    Tiếp tục
                </button>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="mb-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#3c4a42]">
                {label}
            </label>
            {children.type === "textarea"
                ? children
                : React.cloneElement(children, {
                      className:
                          "w-full rounded-xl border border-[#d1e5d9] bg-[#f1f5f2] px-4 py-3 text-[14px] text-[#141b2b] outline-none transition-all placeholder:text-[#a3b5a8] focus:border-[#006c49] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,108,73,0.12)]",
                  })}
        </div>
    );
}
