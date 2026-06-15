import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { XCircle, CheckCircle, RotateCcw } from "lucide-react";
import { purchaseOrderService } from "../../../services/api/purchaseOrderService";
import { useAuth } from "../../../contexts/authProvider";
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
    rejected: "Đã từ chối",
    confirmed: "Đã xác nhận",
    deposit_pending_verification: "Chờ duyệt cọc",
    deposit_paid: "Đã thanh toán cọc",
    processing: "Đang chuẩn bị hàng ",
    shipping: "Chờ giao hàng",
    delivered: "Đã giao hàng",
    final_payment_pending_verification: "Chờ duyệt thanh toán",
    completed: "Đã hoàn thành",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

export default function DealerPurchaseOrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate(); // Dùng để chuyển trang
  const { user } = useAuth(); // Lấy thông tin tài khoản đang đăng nhập

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hàm lấy chi tiết phiếu nhập từ API
  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const data = await purchaseOrderService.getById(id);
      // Chuẩn hóa cấu trúc dữ liệu từ API
      const mappedOrder = {
        id: data.order_code,
        date: new Date(data.created_at).toLocaleDateString("vi-VN"),
        deliveryDate: data.requested_delivery_time
          ? new Date(data.requested_delivery_time).toLocaleDateString("vi-VN")
          : "Chưa xác định",
        status: mapStatusToFrontend(data.status),
        rawStatus: data.status,
        dealer: {
          name: data.dealer_name || "Đại lý đối tác",
          code: `DL${String(data.dealer || "").padStart(4, "0")}`,
          phone: data.dealer_phone || data.receiver_phone || "Chưa cung cấp",
          email: data.dealer_email || "Chưa cung cấp",
        },
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
          slot: data.requested_delivery_time
            ? formatDateTime(data.requested_delivery_time)
            : "Trong giờ hành chính",
        },
        items: (data.items || []).map((item) => ({
          id: item.id,
          name: item.product_name,
          unit: item.product_unit || "Kg",
          quantity: Number(item.quantity || 0),
          price: Number(item.unit_price || 0),
          subtotal: Number(item.subtotal || 0),
        })),
        notes: data.note ? [data.note] : [],
        rawSubtotal: Number(data.total_amount || 0),
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
    // Trường hợp xem trước đơn nháp vừa tạo từ giỏ hàng
    if (location.state?.draftData) {
      const data = location.state.draftData;
      const mappedOrder = {
        id: "DỰ THẢO PHIẾU NHẬP",
        date: new Date().toLocaleDateString("vi-VN"),
        deliveryDate: new Date(data.requested_delivery_time).toLocaleDateString(
          "vi-VN",
        ),
        status: "Nháp (Chưa xác nhận)",
        rawStatus: "draft",
        isDraft: true, // check phải đơn hàng dự thảo hay không
        rawDraft: data,
        // Hiển thị thông tin chính chủ của Đại lý đang đăng nhập thay vì hardcode
        dealer: {
          name:
            user?.dealer_profile?.store_name ||
            user?.full_name ||
            "Đại lý đối tác",
          code: user?.dealer_profile?.id
            ? `DL${String(user.dealer_profile.id).padStart(4, "0")}`
            : "DL-NEW",
          phone: user?.phone || data.receiver_phone || "Chưa cung cấp",
          email: user?.email || "Chưa cung cấp",
        },
        supplier: {
          name: data.supplier_name,
          code: `NCC${String(data.supplier_id).padStart(4, "0")}`,
          phone: "0901234567",
          email: "supplier@gmail.com",
        },
        delivery: {
          recipient: data.receiver_name,
          phone: data.receiver_phone,
          address: data.delivery_address,
          slot: data.requested_delivery_time
            ? formatDateTime(data.requested_delivery_time)
            : "Trong giờ hành chính",
        },
        items: data.items,
        notes: data.note ? [data.note] : [],
        rawSubtotal: data.total_amount,
        depositAmount: data.deposit_amount,
        remainingAmount: data.debt_amount,
        payments: [],
      };
      setOrderData(mappedOrder);
      setLoading(false);
    }
    // 2. Trường hợp lấy thông tin chi tiết đơn hàng có sẵn từ URL ID
    else if (id) {
      fetchOrderDetail();
    }
    // 3. Trường hợp không hợp lệ, chuyển hướng về danh sách
    else {
      setLoading(false);
      navigate("/dai-ly/nhap-hang");
    }
  }, [id, location.state, navigate, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50/50">
        <div className="text-neutral-500 font-medium">
          Đang tải chi tiết đơn nhập hàng...
        </div>
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
  const depositAmount = orderData.depositAmount;
  const remainingAmount = orderData.remainingAmount;

  // Xử lý tạo đơn hàng chính thức từ đơn nháp
  const handleConfirmOrder = async () => {
    if (orderData.isDraft && orderData.rawDraft) {
      setLoading(true);
      try {
        const payload = {
          supplier_id: orderData.rawDraft.supplier_id,
          delivery_address: orderData.rawDraft.delivery_address,
          requested_delivery_time: orderData.rawDraft.requested_delivery_time,
          receiver_name: orderData.rawDraft.receiver_name,
          receiver_phone: orderData.rawDraft.receiver_phone,
          note: orderData.rawDraft.note,
          items: orderData.rawDraft.items.map((item) => ({
            supplier_product_id: item.supplier_product_id,
            quantity: String(item.quantity),
            note: item.note || "",
          })),
        };

        const response = await purchaseOrderService.create(payload);
        toast.success(`Tạo thành công phiếu nhập ${response.order_code}!`);
        navigate("/dai-ly/nhap-hang");
      } catch (error) {
        console.error("Lỗi khi tạo phiếu nhập hàng:", error);
        const errorMsg =
          error.response?.data?.detail ||
          error.message ||
          "Không thể tạo phiếu nhập hàng.";
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

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

  // Xử lý từ chối dự thảo hoặc hủy đơn hàng
  const handleRejectOrCancelOrder = async () => {
    if (orderData.isDraft) {
      if (
        window.confirm(
          "Bạn có chắc chắn muốn hủy phiếu nhập dự thảo này không?",
        )
      ) {
        navigate("/dai-ly/nhap-hang");
      }
    } else {
      const reason = window.prompt(
        "Nhập lý do hủy phiếu nhập hàng này (bắt buộc):",
      );
      if (reason === null) return; // Nhấn Cancel

      if (!reason.trim()) {
        toast.error("Vui lòng nhập lý do để hủy đơn!", { position: "top-center", duration: 5000 },);
        return;
      }

      setLoading(true);
      try {
        await purchaseOrderService.cancel(id, { note: reason.trim() });
        toast.success(`Đã hủy phiếu nhập ${orderData.id} thành công!`);
        await fetchOrderDetail();
      } catch (error) {
        console.error("Lỗi khi hủy phiếu nhập:", error);
        toast.error(
          error.response?.data?.detail || "Không thể hủy phiếu nhập hàng.", { position: "top-center", duration: 5000 },
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Kiểm tra điều kiện hiển thị nút hủy đơn
  const canCancel =
    !orderData.isDraft &&
    (orderData.rawStatus === "pending_supplier_confirmation" ||
      orderData.rawStatus === "confirmed");

  // Kiểm tra điều kiện hiển thị quét VietQR thanh toán cọc (status === 'confirmed')
  const showDepositQr =
    !orderData.isDraft && orderData.rawStatus === "confirmed";

  // Kiểm tra điều kiện hiển thị quét VietQR thanh toán cuối (status === 'delivered')
  const showFinalQr = !orderData.isDraft && orderData.rawStatus === "delivered";

  // Kiểm tra điều kiện hiển thị nút nhận hàng (status === 'shipping')
  const showConfirmDelivery =
    !orderData.isDraft && orderData.rawStatus === "shipping";

  // Kiểm tra điều kiện hiển thị nút yêu cầu trả hàng (status === 'completed')
  const showReturnRequest =
    !orderData.isDraft && orderData.rawStatus === "completed";

  return (
    <div className="font-['Geist',sans-serif] pb-12 px-4 sm:px-8 md:px-16 lg:px-24 bg-emerald-50/15 min-h-screen pt-6">
      {/* 1. Header (gồm Breadcrumb, title, trạng thái) */}
      <OrderDetailHeader
        orderData={orderData}
        onBack={() => {
          if (orderData?.isDraft) {
            // Nếu là đơn nháp, quay về trang tạo phiếu nhập (CreatePurchaseOrder)
            navigate("/dai-ly/nhap-hang/tao-moi", {
              state: { draftData: orderData.rawDraft },
            });
          } else {
            // Nếu là đơn hàng thật có sẵn, quay về trang danh sách đơn nhập hàng
            navigate("/dai-ly/nhap-hang");
          }
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
        depositAmount={depositAmount}
        remainingAmount={remainingAmount}
      />

      {/* 8. Các nút hành động ở cuối trang */}
      <div className="flex justify-end gap-4 border-t border-neutral-100 pt-6">
        {/* Nút hủy đơn (dành cho đơn nháp hoặc đơn đang chờ NCC/đã confirmed) */}
        {(orderData.isDraft || canCancel) && (
          <button
            onClick={handleRejectOrCancelOrder}
            className="flex items-center justify-center gap-2 px-6 h-11 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl text-xs font-bold transition-all cursor-pointer min-w-36 active:scale-95"
          >
            <XCircle className="w-4 h-4" />{" "}
            {orderData.isDraft ? "Hủy dự thảo" : "Hủy phiếu nhập"}
          </button>
        )}

        {/* Nút xác nhận nhận hàng (khi đơn hàng đang giao) */}
        {showConfirmDelivery && (
          <button
            onClick={handleConfirmDelivery}
            className="flex items-center justify-center gap-2 px-6 h-11 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer min-w-44 active:scale-95"
          >
            <CheckCircle className="w-4 h-4" /> Xác nhận đã nhận hàng
          </button>
        )}

        {showReturnRequest && (
          <button
            // onClick={handleRequestReturn}
            className="flex items-center justify-center gap-2 px-6 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer min-w-44 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Yêu cầu trả hàng
          </button>
        )}

        {/* Nút tạo đơn chính thức (dành riêng cho đơn nháp) */}
        {orderData.isDraft && (
          <button
            onClick={handleConfirmOrder}
            className="flex items-center justify-center gap-2 px-6 h-11 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer min-w-44 active:scale-95"
          >
            <CheckCircle className="w-4 h-4" /> Xác nhận gửi phiếu
          </button>
        )}
      </div>
    </div>
  );
}
