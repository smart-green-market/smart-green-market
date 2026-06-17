import { appToast } from "../components/common/toast";

export function showAddToCartFeedback(result, { showToast = true } = {}) {
    if (!showToast || result?.showToast === false) return;

    if (result.added) {
        appToast.success("Đã thêm vào giỏ hàng");
        return;
    }

    if (result.reason === "spam") {
        appToast.warning(
            "Bạn đang thao tác quá nhanh. Vui lòng dừng spam thêm giỏ hàng.",
        );
        return;
    }

    if (result.reason === "already_in_cart") {
        appToast.warning("Sản phẩm đã có trong giỏ hàng");
    }
}
