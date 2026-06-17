import { BookOpen, Layers, Trash2, Edit } from "lucide-react";

export default function CategoryGrid({ categories, onViewDetail, onDelete, onUpdate }) {

  if (categories.length === 0) {
    return (
      <div className="col-span-full py-16 bg-white border border-neutral-150 rounded-2xl text-center text-sm font-semibold text-neutral-400 font-['Geist',sans-serif]">
        Không tìm thấy danh mục nông sản nào.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((cat, idx) => (
        <div
          key={idx}
          className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            {/* Card Top */}
            <div className="flex items-center justify-between mb-4">
              
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  cat.status === "Hoạt động"
                    ? "bg-emerald-100 text-emerald-800"
                    : cat.status === "Chờ duyệt"
                    ? "bg-amber-100 text-amber-800"
                    : cat.status === "Từ chối"
                    ? "bg-red-100 text-red-800"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {cat.status}
              </span>
            </div>

            {/* Card Body */}
            <h3 className="text-base font-bold text-neutral-800 mb-2">{cat.name}</h3>
            <p className="text-xs text-neutral-500 line-clamp-3 mb-4 leading-relaxed">
              {cat.description}
            </p>
          </div>

          {/* Card Footer */}
          <div className="border-t border-neutral-50 pt-4 flex items-center justify-between mt-auto">
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> {cat.product_count} {" sản phẩm"}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdate && onUpdate(cat)}
                className="text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> Sửa
              </button>
              <button
                onClick={() => onDelete && onDelete(cat.id)}
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa
              </button>
              <button
                onClick={() => onViewDetail && onViewDetail(cat)}
                className="text-xs font-bold text-neutral-500 hover:text-emerald-700 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" /> Chi tiết
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
