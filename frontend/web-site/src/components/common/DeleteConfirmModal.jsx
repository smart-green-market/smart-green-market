import ConfirmModal from "./ConfirmModal";

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    itemType = "mục",
    loading = false,
    showToast = true,
    ...props
}) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Xác nhận xóa"
            message={`Bạn có chắc muốn xóa ${itemType}${itemName ? ` "${itemName}"` : ""}? Hành động này không thể hoàn tác.`}
            confirmText="Xóa"
            cancelText="Hủy"
            variant="danger"
            loading={loading}
            successMessage={`Đã xóa ${itemType} thành công`}
            errorMessage={`Không thể xóa ${itemType}`}
            showToast={showToast}
            {...props}
        />
    );
}
