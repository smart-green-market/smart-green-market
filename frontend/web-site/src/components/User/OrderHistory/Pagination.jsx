// ============================================================
// Pagination.jsx
// Phân trang cho danh sách đơn hàng
// ============================================================
// Props:
//   currentPage : number  (trang hiện tại, bắt đầu từ 1)
//   totalPages  : number  (tổng số trang)
//   onChange    : (page: number) => void
// ============================================================
import React from "react";

const Pagination = ({ currentPage, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  // Tạo dãy số trang hiển thị (window = 2 xung quanh trang hiện tại)
  const getPages = () => {
    const pages = [];
    const delta = 1; // số trang hiển thị mỗi bên
    const left  = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);

    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push("...");
    }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) {
      if (right < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPages();

  const btnBase =
    "w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-medium transition-all duration-150";
  const btnActive =
    "bg-[#1a5c2a] text-white";
  const btnIdle =
    "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900";
  const btnDisabled =
    "bg-white text-gray-300 border border-gray-100 cursor-not-allowed";

  return (
    <div className="flex items-center justify-center gap-1.5 py-4">

      {/* First page */}
      <button
        onClick={() => onChange(1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`}
        aria-label="Trang đầu"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      {/* Prev page */}
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`}
        aria-label="Trang trước"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center text-[13px] text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`${btnBase} ${p === currentPage ? btnActive : btnIdle}`}
            aria-label={`Trang ${p}`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next page */}
      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnIdle}`}
        aria-label="Trang sau"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Last page */}
      <button
        onClick={() => onChange(totalPages)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnIdle}`}
        aria-label="Trang cuối"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>

    </div>
  );
};

export default Pagination;
