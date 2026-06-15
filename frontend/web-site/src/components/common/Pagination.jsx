import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Tạo mảng số trang để hiển thị
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6 font-['Geist',sans-serif]">
      {/* Nút Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Danh sách số trang */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
            currentPage === page
              ? "bg-emerald-700 text-white shadow-md shadow-emerald-100"
              : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          {page}
        </button>
      ))}

      {/* Nút Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}