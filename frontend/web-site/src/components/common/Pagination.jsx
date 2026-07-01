import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Tạo mảng số trang để hiển thị
  const getPages = () => {
    if (totalPages <= 5) {
      const list = [];
      for (let i = 1; i <= totalPages; i++) {
        list.push(i);
      }
      return list;
    }

    const pageSet = new Set();
    // 2 ô đầu
    pageSet.add(1);
    pageSet.add(2);
    // 2 ô cuối
    pageSet.add(totalPages - 1);
    pageSet.add(totalPages);

    // Các ô xung quanh currentPage
    pageSet.add(currentPage);
    if (currentPage > 1) pageSet.add(currentPage - 1);
    if (currentPage < totalPages) pageSet.add(currentPage + 1);

    const sortedPages = Array.from(pageSet).sort((a, b) => a - b);
    const result = [];

    for (let i = 0; i < sortedPages.length; i++) {
      if (i > 0 && sortedPages[i] - sortedPages[i - 1] > 1) {
        result.push("...");
      }
      result.push(sortedPages[i]);
    }
    return result;
  };

  const pages = getPages();

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
      {pages.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`dots-${index}`}
              className="w-9 h-9 flex items-center justify-center text-xs font-bold text-neutral-400"
            >
              ...
            </span>
          );
        }
        return (
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
        );
      })}

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