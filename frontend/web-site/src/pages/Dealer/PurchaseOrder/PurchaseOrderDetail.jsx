import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { XCircle, CheckCircle, RotateCcw } from "lucide-react";
import { purchaseOrderService } from "../../../services/api/purchaseOrderService";
import RejectModal from "../../../components/common/RejectModal";
import RequestReturnModal from "../../../components/Dealer/PurchaseOrderDetail/RequestReturnModal";
import ApproveAdjustmentModal from "../../../components/Dealer/PurchaseOrderDetail/ApproveAdjustmentModal";
import OrderDetailHeader from "../../../components/Dealer/PurchaseOrderDetail/OrderDetailHeader";
import OrderDetailInfoCards from "../../../components/Dealer/PurchaseOrderDetail/OrderDetailInfoCards";
import OrderDetailItemsTable from "../../../components/Dealer/PurchaseOrderDetail/OrderDetailItemsTable";
import OrderDetailSummary from "../../../components/Dealer/PurchaseOrderDetail/OrderDetailSummary";
import PaymentQrSection from "../../../components/Dealer/PurchaseOrderDetail/PaymentQrSection";
import PaymentHistory from "../../../components/Dealer/PurchaseOrderDetail/PaymentHistory";
import OrderStatusBanner from "../../../components/Dealer/PurchaseOrderDetail/OrderStatusBanner";
import { formatDateTime } from "../../../components/common/formatDateTime";

const mapStatusToFrontend = (status) => {
  const statusMap = {
    pending_supplier_confirmation: "Chờ xác nhận",
    pending_dealer_confirmation: "Chờ đại lý xác nhận thay đổi",
    rejected: "Đã từ chối",
    confirmed: "Đã xác nhận",
    deposit_pending_verification: "Chờ duyệt cọc",
    deposit_paid: "Đã thanh toán cọc",
    processing: "Đang chuẩn bị hàng",
    shipping: "Đang giao hàng",
    delivered: "Đã giao hàng",
    final_payment_pending_verification: "Chờ duyệt thanh toán",
    completed: "Đã hoàn thành",
    cancelled: "Đã hủy",
    return_requested: "Yêu cầu trả hàng",
    return_approved: "Đã duyệt trả hàng",
    return_rejected: "Từ chối trả hàng",
    returned: "Đã trả hàng",
  };
  return statusMap[status] || status;
};

export default function DealerPurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate(); // Dùng để chuyển trang

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  // Hàm lấy chi tiết phiếu nhập từ API
  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const data = await purchaseOrderService.getById(id);
      // Chuẩn hóa cấu trúc dữ liệu từ API
      const mappedOrder = {
        id: data.order_code,
        date: new Date(data.created_at).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' }),
        deliveryDate: (data.confirmed_delivery_time || data.requested_delivery_time)
          ? new Date(data.confirmed_delivery_time || data.requested_delivery_time).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })
          : "Chưa xác định",
        completedAt: data.completed_at
          ? new Date(data.completed_at).toLocaleString("vi-VN")
          : null,
        status: mapStatusToFrontend(data.status),
        rawStatus: data.status,
        supplier: {
          name: data.supplier_name || "Nhà cung cấp",
          code: `NCC${String(data.supplier || "").padStart(4, "0")}`,
          phone: data.supplier_phone || "Chưa cung cấp",
          email: data.supplier_email || "Chưa cung cấp",
        },
        delivery: {
          recipient: data.receiver_name || "Chưa cung cấp",
          phone: data.receiver_phone || "Chưa cung cấp",
          address: data.delivery_address || "Chưa cung cấp",
          slot: (data.confirmed_delivery_time || data.requested_delivery_time)
            ? formatDateTime(data.confirmed_delivery_time || data.requested_delivery_time)
            : "Trong giờ hành chính",
        },
        items: (data.items || []).map((item) => ({
          id: item.id,
          name: item.product_name,
          unit: item.product_unit || "Kg",
          quantity: Number(item.quantity || 0),
          original_quantity: Number(item.original_quantity || 0),
          price: Number(item.unit_price || 0),
          unit_price: Number(item.unit_price || 0),
          base_unit_price: Number(item.base_unit_price || item.unit_price || 0),
          base_price: Number(item.base_unit_price || item.unit_price || 0),
          discount_type: item.discount_type,
          discount_value: item.discount_value,
          discount_min_quantity: item.discount_min_quantity,
          discount_label: item.discount_label,
          has_quantity_discount: item.has_quantity_discount,
          line_discount_amount: Number(item.line_discount_amount || 0),
          discount_amount: Number(item.line_discount_amount || 0),
          subtotal: Number(item.subtotal || 0),
          product_thumbnail_url: item.product_thumbnail_url,
          review_status: item.review_status,
          rejection_reason: item.rejection_reason,
          return_status: item.return_status,
          return_status_label: item.return_status_label,
          pending_return_quantity: Number(item.pending_return_quantity || 0),
          returned_quantity: Number(item.returned_quantity || 0),
          returnable_quantity: Number(item.returnable_quantity ?? item.quantity ?? 0),
          rejected_returns: (data.returns || [])
            .filter((ret) => ret.status === "rejected" && (ret.items || []).some((ri) => ri.purchase_order_item_id === item.id))
            .map((ret) => ({
              id: ret.id,
              review_note: ret.review_note || "Không có lý do chi tiết",
              quantity: (ret.items || []).find((ri) => ri.purchase_order_item_id === item.id)?.quantity || 0,
            })),
        })),
        notes: data.note ? [data.note] : [],
        rawSubtotal: Number(data.total_amount || 0),
        grossSubtotal: Number(data.gross_subtotal || data.total_amount || 0),
        totalDiscountAmount: Number(data.total_discount_amount || 0),
        depositAmount: Number(data.deposit_amount || 0),
        remainingAmount: Number(data.debt_amount || 0),
        payments: data.payments || [],
        rejectionReason: data.rejection_reason || "",
      };
      setOrderData(mappedOrder);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đơn nhập hàng:", error);
      toast.error("Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Trường hợp lấy thông tin chi tiết đơn hàng có sẵn từ URL ID
    if (id) {
      fetchOrderDetail();
    }
    // Trường hợp không hợp lệ, chuyển hướng về danh sách
    else {
      setLoading(false);
      navigate("/dai-ly/nhap-hang");
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="p-6 bg-emerald-50/15 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50/50">
        <div className="text-red-500 font-medium">
          Không tìm thấy thông tin đơn hàng.
        </div>
      </div>
    );
  }

  const rawSubtotal = orderData.rawSubtotal;
  const grossSubtotal = orderData.grossSubtotal ?? rawSubtotal;
  const totalDiscountAmount = orderData.totalDiscountAmount ?? 0;
  const depositAmount = orderData.depositAmount;
  const remainingAmount = orderData.remainingAmount;



  // Xử lý xác nhận đã nhận hàng (khi đơn hàng đang giao)
  const handleConfirmDelivery = async () => {
    if (
      window.confirm(
        "Bạn xác nhận đã nhận đủ hàng và đúng tiêu chuẩn nông sản?",
      )
    ) {
      setLoading(true);
      try {
        await purchaseOrderService.confirmDelivery(id, {
          note: "Đại lý đã nhận đủ hàng",
        });
        toast.success("Xác nhận đã nhận hàng thành công!");
        await fetchOrderDetail(); // Tải lại chi tiết đơn hàng
      } catch (error) {
        console.error("Lỗi khi xác nhận nhận hàng:", error);
        toast.error(
          error.response?.data?.detail || "Không thể xác nhận nhận hàng.",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Mở modal xác nhận thay đổi đơn hàng
  const handleApproveAdjustmentClick = () => {
    setIsApproveModalOpen(true);
  };

  // Xác nhận duyệt thay đổi từ modal (có nhận optional note)
  const handleApproveAdjustmentConfirm = async (data) => {
    try {
      await purchaseOrderService.approveAdjustment(id, data);
      toast.success("Xác nhận thay đổi đơn hàng thành công!");
      await fetchOrderDetail();
    } catch (error) {
      console.error("Lỗi khi xác nhận thay đổi đơn hàng:", error);
      const errMsg = error.response?.data?.detail || "Không thể xác nhận thay đổi đơn hàng.";
      toast.error(errMsg, { position: "top-center", duration: 5000 });
      throw error; // Ném lỗi để modal giữ trạng thái loading/không tự đóng
    }
  };

  // Xử lý hủy đơn hàng - Mở modal nhập lý do
  const handleRejectOrCancelOrder = () => {
    setIsCancelModalOpen(true);
  };

  // Xác nhận hủy đơn hàng từ modal
  const handleCancelOrderConfirm = async (reason) => {
    try {
      await purchaseOrderService.cancel(id, { reason: reason });
      toast.success(`Đã hủy phiếu nhập ${orderData.id} thành công!`);
      await fetchOrderDetail();
    } catch (error) {
      console.error("Lỗi khi hủy phiếu nhập:", error);
      toast.error(
        error.response?.data?.detail || "Không thể hủy phiếu nhập hàng.",
        { position: "top-center", duration: 5000 },
      );
      throw error; // Ném lỗi để modal giữ trạng thái loading/không tự đóng
    }
  };

  // Mở modal yêu cầu trả hàng
  const handleRequestReturn = () => {
    setIsReturnModalOpen(true);
  };

  // Xác nhận gửi yêu cầu trả hàng từ modal
  const handleRequestReturnConfirm = async (reason, evidenceFile, selectedItems) => {
    const formData = new FormData();
    formData.append("reason", reason);
    if (evidenceFile) {
      formData.append("evidence_file", evidenceFile);
    }

    if (selectedItems && selectedItems.length > 0) {
      selectedItems.forEach((item, index) => {
        formData.append(`items[${index}]purchase_order_item_id`, item.purchase_order_item_id);
        formData.append(`items[${index}]quantity`, item.quantity);
        if (item.reason) {
          formData.append(`items[${index}]reason`, item.reason);
        }
      });
    }

    try {
      await purchaseOrderService.requestReturn(id, formData);
      toast.success("Gửi yêu cầu trả hàng thành công!");
      await fetchOrderDetail();
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu trả hàng:", error);
      const errMsg = error.response?.data?.detail || "Không thể gửi yêu cầu trả hàng.";
      toast.error(errMsg, { position: "top-center", duration: 5000 });
      throw error; // Ném lỗi để giữ modal mở và dừng loading
    }
  };

  // Kiểm tra điều kiện hiển thị nút hủy đơn
  const canCancel =
    orderData.rawStatus === "pending_supplier_confirmation" ||
    orderData.rawStatus === "confirmed" ||
    orderData.rawStatus === "pending_dealer_confirmation";

  // Kiểm tra điều kiện hiển thị quét VietQR thanh toán cọc (status === 'confirmed')
  const showDepositQr = orderData.rawStatus === "confirmed" && orderData.depositAmount > 0;
  
  // Kiểm tra điều kiện hiển thị quét VietQR thanh toán cuối (status === 'delivered')
  const showFinalQr = orderData.rawStatus === "delivered" && orderData.remainingAmount > 0;

  // Kiểm tra điều kiện hiển thị nút nhận hàng (status === 'shipping')
  const showConfirmDelivery = orderData.rawStatus === "shipping";

  // Kiểm tra điều kiện hiển thị nút yêu cầu trả hàng (status === 'delivered')
  const showReturnRequest = orderData.rawStatus === "delivered";

  // Kiểm tra điều kiện hiển thị nút xác nhận thay đổi (status === 'pending_dealer_confirmation')
  const showApproveAdjustment = orderData.rawStatus === "pending_dealer_confirmation";

  return (
    <div className="font-['Geist',sans-serif] pb-12 px-4 sm:px-8 md:px-16 lg:px-24 bg-emerald-50/15 min-h-screen pt-6">
      {/* 1. Header (gồm Breadcrumb, title, trạng thái) */}
      <OrderDetailHeader
        orderData={orderData}
        onBack={() => {
          // Quay về trang danh sách đơn nhập hàng
          navigate("/dai-ly/nhap-hang");
        }}
      />

      {/* 2. Thanh thông báo trạng thái — hướng dẫn đại lý từng bước */}
      <OrderStatusBanner
        rawStatus={orderData.rawStatus}
        rejectionReason={orderData.rejectionReason}
      />

      {/* 3. Lưới thông tin đại lý, nhà cung cấp, giao nhận */}
      <OrderDetailInfoCards orderData={orderData} />

      {/* 3. Khối thanh toán quét mã QR cọc. Check showDepositQr = true mới hiện PaymentQrSection */}
      {showDepositQr && (
        <PaymentQrSection
          orderId={id}
          paymentType="deposit"
          onSuccess={fetchOrderDetail}
        />
      )}

      {/* 4. Khối thanh toán quét mã QR thanh toán cuối */}
      {showFinalQr && (
        <PaymentQrSection
          orderId={id}
          paymentType="final_payment"
          onSuccess={fetchOrderDetail}
        />
      )}

      {/* 5. Lịch sử các giao dịch minh chứng đã chuyển khoản */}
      <PaymentHistory payments={orderData.payments} />

      {/* 6. Danh sách sản phẩm của phiếu nhập */}
      <OrderDetailItemsTable items={orderData.items} />

      {/* 7. Ghi chú yêu cầu và Chi phí tóm tắt */}
      <OrderDetailSummary
        orderData={orderData}
        rawSubtotal={rawSubtotal}
        grossSubtotal={grossSubtotal}
        totalDiscountAmount={totalDiscountAmount}
        depositAmount={depositAmount}
        remainingAmount={remainingAmount}
      />

      {/* 8. Các nút hành động ở cuối trang */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 border-t border-neutral-100 pt-6">
        {/* Nút hủy đơn */}
        {canCancel && (
          <button
            onClick={handleRejectOrCancelOrder}
            className="flex items-center justify-center gap-2 px-6 h-11 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl text-xs font-bold transition-all cursor-pointer w-full sm:w-auto sm:min-w-36 active:scale-95"
          >
            <XCircle className="w-4 h-4" /> Hủy phiếu nhập
          </button>
        )}

        {/* Nút xác nhận nhận hàng (khi đơn hàng đang giao) */}
        {showConfirmDelivery && (
          <button
            onClick={handleConfirmDelivery}
            className="flex items-center justify-center gap-2 px-6 h-11 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto sm:min-w-44 active:scale-95"
          >
            <CheckCircle className="w-4 h-4" /> Xác nhận đã nhận hàng
          </button>
        )}

        {/* Nút xác nhận thay đổi (khi NCC đề xuất điều chỉnh đơn) */}
        {showApproveAdjustment && (
          <button
            onClick={handleApproveAdjustmentClick}
            className="flex items-center justify-center gap-2 px-6 h-11 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto sm:min-w-44 active:scale-95"
          >
            <CheckCircle className="w-4 h-4" /> Xác nhận thay đổi
          </button>
        )}

        {showReturnRequest && (
          <button
            onClick={handleRequestReturn}
            className="flex items-center justify-center gap-2 px-6 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto sm:min-w-44 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Yêu cầu trả hàng
          </button>
        )}
      </div>

      <RejectModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelOrderConfirm}
        title="Hủy phiếu nhập"
        message="Bạn có chắc chắn muốn hủy phiếu nhập hàng này không?"
        confirmText="Hủy phiếu nhập"
        cancelText="Đóng"
        reasonLabel="Lý do hủy"
        reasonPlaceholder="Nhập lý do hủy phiếu nhập hàng..."
        reasonRequiredMessage="Vui lòng nhập lý do hủy."
        showToast={false}
      />

      <RequestReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onConfirm={handleRequestReturnConfirm}
        orderItems={(orderData?.items || []).filter(item => item.review_status !== "rejected")}
      />

      <ApproveAdjustmentModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApproveAdjustmentConfirm}
      />
    </div>
  );
}
