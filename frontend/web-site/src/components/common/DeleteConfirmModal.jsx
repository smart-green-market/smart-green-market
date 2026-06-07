import Modal from "./Modal";

/**
 * DeleteConfirmModal — wraps base Modal for delete confirmation
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   onConfirm : () => void
 *   itemName  : string
 *   itemType  : string  — e.g. "sản phẩm" | "danh mục"
 */
export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName, itemType = "mục", }) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="justify-center">
          Xác nhận xóa
        </span>
      }
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-neutral-200"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Xóa
          </button>
        </>
      }
    >
      <p className="text-sm text-neutral-600 leading-relaxed">
        Bạn có chắc muốn xóa {itemType}{" "}
        {itemName && (
          <span className="font-semibold text-emerald-950">"{itemName}"</span>
        )}
       ? Hành động này không thể hoàn tác.
      </p>
    </Modal>
  );
}