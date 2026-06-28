import { X, User } from "lucide-react";

/**
 * Props:
 *   isPersonal : boolean
 *   headerColor: string  (tailwind text class)
 *   saving     : boolean
 *   onClose    : () => void
 */
export default function ModalHeader({ isPersonal, headerColor, saving, onClose }) {
  return (
    <>
      <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-start gap-3">
          {isPersonal && (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-4 h-4 text-blue-700" />
            </div>
          )}
          <div>
            <h2 className={`${headerColor} text-lg font-bold`}>
              {isPersonal ? "Thêm Sản Phẩm Cá Nhân" : "Thêm Sản Phẩm Mới"}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isPersonal
                ? "Sản phẩm do bạn tự đặt tên — sẽ chờ admin duyệt trước khi hiển thị."
                : "Vui lòng điền đầy đủ các thông tin bắt buộc để niêm yết sản phẩm lên hệ thống."}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          disabled={saving}
          className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors flex-shrink-0 ml-4 disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Badge mode */}
      {isPersonal && (
        <div className="mx-6 mb-2 flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            <User className="w-3 h-3" />
            Sản phẩm cá nhân — danh mục riêng của bạn
          </span>
        </div>
      )}
    </>
  );
}
