import { useState } from "react";
import { X, Tag } from "lucide-react";

export default function CreateCategoryModal({ onClose, onConfirm }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;


    onConfirm({
      name: name.trim(),
      description: description.trim(),
      count: "0 sản phẩm",
      status: "Chờ duyệt",
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 font-['Geist',sans-serif]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[460px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" /> Thêm Danh Mục Mới
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required  
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Rau ăn củ, Trái cây nhiệt đới..."
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
                Mô tả danh mục
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả ngắn gọn về danh mục..."
                rows="3"
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-medium resize-none"
              />
            </div>

            
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 bg-neutral-50 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-200/50 rounded-xl transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-100"
            >
              Tạo danh mục
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
