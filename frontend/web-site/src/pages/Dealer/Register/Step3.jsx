import React, { useRef, useState } from "react";
import {
    dealerService,
    handleApiError,
} from "../../../services/api/dealerService";

const DOC_TYPES = [
    {
        key: "id_card",
        name: "CCCD / CMND",
        desc: "Căn cước công dân hoặc CMND còn hạn",
        icon: "🪪",
    },
    {
        key: "business_license",
        name: "Giấy phép kinh doanh",
        desc: "Đăng ký doanh nghiệp / hộ kinh doanh",
        icon: "📋",
    },
    {
        key: "tax_certificate",
        name: "Giấy chứng nhận thuế",
        desc: "Giấy chứng nhận đăng ký thuế",
        icon: "🧾",
    },
];

export default function Step3({ profile, resumeMessage, onNext, onBack }) {
    const [selectedFiles, setSelectedFiles] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileSelect = (file, docKey) => {
        if (!file) return;
        setSelectedFiles((prev) => ({
            ...prev,
            [docKey]: file,
        }));
    };

    const handleSubmit = async () => {
        try {
            setError("");

            if (!profile?.store_name || !profile?.store_address || !profile?.description) {
                return setError(
                    "Thiếu thông tin cửa hàng. Vui lòng quay lại bước trước.",
                );
            }

            const missingDocs = DOC_TYPES.filter((doc) => !selectedFiles[doc.key]);
            if (missingDocs.length > 0) {
                return setError(
                    `Vui lòng tải đủ 3 loại giấy tờ: ${missingDocs.map((d) => d.name).join(", ")}`,
                );
            }

            setLoading(true);

            await dealerService.completeRegistration(profile, selectedFiles);

            onNext?.();
        } catch (err) {
            setError(handleApiError(err, "Không thể hoàn tất đăng ký đại lý"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-[fadeSlide_0.28s_ease]">
            <h2 className="mb-1 text-[28px] font-extrabold tracking-tight text-[#141b2b]">
                Tải lên giấy tờ
            </h2>
            <p className="mb-6 text-[13.5px] leading-relaxed text-[#5a6a5e]">
                Tải đủ 3 loại giấy tờ bên dưới. Hệ thống sẽ lưu thông tin cửa hàng
                và giấy tờ cùng lúc khi bạn hoàn tất. Hồ sơ được duyệt trong{" "}
                <strong className="text-[#141b2b]">1–3 ngày làm việc</strong>.
            </p>

            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-semibold">{profile.store_name}</p>
                <p className="text-emerald-800/80">{profile.store_address}</p>
            </div>

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

            <div className="mb-6 flex flex-col gap-2.5">
                {DOC_TYPES.map((doc) => (
                    <DocCard
                        key={doc.key}
                        doc={doc}
                        selectedFile={selectedFiles[doc.key]}
                        onSelect={(file) => handleFileSelect(file, doc.key)}
                    />
                ))}
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="rounded-xl border border-[#d1e5d9] bg-white px-5 py-3 text-[14px] font-semibold text-[#006c49] transition-all hover:border-[#006c49] hover:bg-[#f0faf4] disabled:opacity-50"
                >
                    ← Quay lại
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-bold text-white transition-all ${
                        loading
                            ? "cursor-not-allowed bg-gray-400"
                            : "bg-[#006c49] hover:-translate-y-0.5 hover:bg-[#005038]"
                    }`}
                >
                    {loading ? "Đang gửi hồ sơ..." : "Hoàn tất đăng ký ✓"}
                </button>
            </div>
        </div>
    );
}

function DocCard({ doc, selectedFile, onSelect }) {
    const inputRef = useRef(null);

    return (
        <div
            className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                selectedFile
                    ? "border-emerald-400 bg-[#f0fdf8]"
                    : "border-[#d1e5d9] bg-white"
            }`}
        >
            <span className="shrink-0 text-2xl">{doc.icon}</span>

            <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-[#141b2b]">{doc.name}</div>
                <div className="truncate text-[11.5px] text-[#7a8f7e]">
                    {selectedFile ? selectedFile.name : doc.desc}
                </div>
            </div>

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                    selectedFile
                        ? "rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-200"
                        : "border border-[#d1e5d9] bg-[#f1f5f2] text-[#006c49] hover:border-[#006c49] hover:bg-[#006c49] hover:text-white"
                }`}
            >
                {selectedFile ? "✓ Đã chọn" : "Chọn file"}
            </button>

            <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                className="hidden"
                onChange={(e) => onSelect(e.target.files?.[0])}
            />
        </div>
    );
}
