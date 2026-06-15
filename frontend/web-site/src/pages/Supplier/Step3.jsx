import React, { useEffect, useRef, useState } from "react";
import { supplierDocumentService } from "../../services/api/supplierdocumentService";
import { extractSupplierApiMessage } from "../../utils/supplierValidation";

function extractDocumentApiMessage(error, fallback = "Có lỗi khi tải lên giấy tờ.") {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (typeof data === "string" && (data.includes("<!doctype html>") || data.includes("Not Found"))) {
    return status === 404
      ? "Không tìm thấy API upload giấy tờ. Vui lòng thử lại sau."
      : fallback;
  }

  return extractSupplierApiMessage(error, fallback);
}

const DOC_TYPES = [
  {
    key: "id_card",           // ← đổi key khớp với field API
    name: "CCCD / Hộ chiếu",
    desc: "Căn cước công dân hoặc hộ chiếu còn hạn",
    icon: "🪪",
  },
  {
    key: "business_license",  // ← giữ nguyên
    name: "Giấy phép kinh doanh",
    desc: "Đăng ký doanh nghiệp / hộ kinh doanh",
    icon: "📋",
  },
  {
    key: "tax_certificate",   // ← đổi key
    name: "Chứng nhận sản phẩm",
    desc: "VietGAP, GlobalGAP, hữu cơ hoặc tương đương",
    icon: "🏅",
  },
];


export default function Step3({ onNext, onBack }) {
  // Lưu File object thực tế, chưa upload
  const [selectedFiles, setSelectedFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Chỉ lưu file vào state, chưa gọi API
  const handleFileSelect = (file, docKey) => {
    if (!file) return;
    setSelectedFiles((prev) => ({
      ...prev,
      [docKey]: file,
    }));
  };

  // Nhấn "Hoàn tất" mới gửi tất cả lên API
  const handleSubmit = async () => {
  try {
    setError("");

    const missingDocs = DOC_TYPES.filter((doc) => !selectedFiles[doc.key]);
    if (missingDocs.length > 0) {
      setError(
        `Giấy tờ: Thiếu ${missingDocs.map((doc) => doc.name).join(", ")}. Vui lòng chọn đủ tất cả giấy tờ bắt buộc.`
      );
      return;
    }

    setLoading(true);

    await supplierDocumentService.upload(selectedFiles);

    onNext();
  } catch (err) {
    console.error("Upload lỗi DATA:", err.response?.data);
    setError(extractDocumentApiMessage(err, "Tải lên giấy tờ thất bại. Vui lòng kiểm tra lại tệp và thử lại."));
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="animate-[fadeSlide_0.28s_ease]">
      <h2 className="text-[28px] font-extrabold text-[#141b2b] tracking-tight mb-1">
        Tải lên giấy tờ
      </h2>
      <p className="text-[13.5px] text-[#5a6a5e] leading-relaxed mb-6">
        Vui lòng cung cấp các giấy tờ xác minh. Hồ sơ sẽ được duyệt trong{" "}
        <strong className="text-[#141b2b]">1–3 ngày làm việc</strong>.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2.5 mb-6">
        {DOC_TYPES.map((doc) => {
          const file = selectedFiles[doc.key];
          return (
            <DocCard
              key={doc.key}
              doc={doc}
              selectedFile={file}
              onSelect={(f) => handleFileSelect(f, doc.key)}
            />
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-5 py-3 bg-white text-[#006c49] border border-[#d1e5d9] rounded-xl text-[14px] font-semibold hover:border-[#006c49] hover:bg-[#f0faf4] transition-all"
        >
          ← Quay lại
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`flex-1 py-3 text-white rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 transition-all
            ${loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#006c49] hover:bg-[#005038] hover:-translate-y-0.5"
            }`}
        >
          {loading ? "Đang tải lên..." : "Hoàn tất đăng ký ✓"}
        </button>
      </div>

      <p className="text-[12px] text-gray-400 text-center mt-4">
        Bạn có thể bổ sung giấy tờ sau khi đăng ký thành công.
      </p>
    </div>
  );
}

function DocCard({ doc, selectedFile, onSelect }) {
  const inputRef = useRef(null);
  const isImage = selectedFile?.type?.startsWith("image/");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!isImage || !selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [isImage, selectedFile]);

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all
        ${selectedFile ? "border-emerald-400 bg-[#f0fdf8]" : "border-[#d1e5d9] bg-white"}`}
    >
      <span className="text-2xl flex-shrink-0">{doc.icon}</span>

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-[#141b2b]">{doc.name}</div>
        <div className="text-[11.5px] text-[#7a8f7e] truncate">
          {selectedFile ? selectedFile.name : doc.desc}
        </div>
        {selectedFile && (
          <div className="mt-2">
            {isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={doc.name}
                className="h-24 w-24 rounded-lg object-cover border border-emerald-200"
              />
            ) : (
              <div className="text-[11px] text-[#5a6a5e]">
                Đã chọn file: <span className="font-semibold">{selectedFile.name}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedFile ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 whitespace-nowrap hover:bg-emerald-200 transition-all"
        >
          ✓ Đã chọn
        </button>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 bg-[#f1f5f2] border border-[#d1e5d9] rounded-lg text-[12px] font-semibold text-[#006c49] hover:bg-[#006c49] hover:text-white hover:border-[#006c49] transition-all whitespace-nowrap"
        >
          Chọn file
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0])}
      />
    </div>
  );
}