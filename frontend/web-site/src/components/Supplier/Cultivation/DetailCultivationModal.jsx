import { X } from "lucide-react";
import { Overlay, ModalBox, Field } from "./CreateCultivationModal";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DetailCultivationModal({ isOpen, onClose, process }) {
  if (!isOpen || !process) return null;

  return (
    <Overlay onClose={onClose}>
      <ModalBox>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chi tiết quy trình</h2>
            <p className="text-xs text-gray-400 mt-0.5">Thông tin bước canh tác</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X size={18} className="text-neutral-500" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          <Field label="Sản phẩm">
            <p className="text-sm text-neutral-800 font-medium">
              {process.product_name ?? `SP #${process.supplier_product}`}
            </p>
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Số thứ tự bước">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
                {process.step_order}
              </span>
            </Field>
            <div className="col-span-2">
              <Field label="Tên quy trình">
                <p className="text-sm font-semibold text-gray-900">{process.process_name}</p>
              </Field>
            </div>
          </div>

          <Field label="Mô tả chi tiết">
            <p className="text-sm text-neutral-600 whitespace-pre-wrap">
              {process.description || "—"}
            </p>
          </Field>

          <Field label="Ngày tạo">
            <p className="text-sm text-neutral-500">{formatDate(process.created_at)}</p>
          </Field>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );
}
