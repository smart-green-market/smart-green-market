import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { XCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { purchaseOrderService } from "../../../services/api/purchaseOrderService";
import { useAuth } from "../../../contexts/authProvider";
import OrderDetailInfoCards from "../../../components/Dealer/PurchaseOrderDetail/OrderDetailInfoCards";
import OrderDetailItemsTable from "../../../components/Dealer/PurchaseOrderDetail/OrderDetailItemsTable";
import { formatDateTime } from "../../../components/common/formatDateTime";

export default function DraftOrderPreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Lấy dữ liệu draftData từ state
  const rawData = location.state?.draftData;
  const draftList = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);

  if (draftList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50/50 font-['Geist',sans-serif]">
        <div className="text-red-500 font-medium mb-4">Không có dữ liệu phiếu nhập dự thảo.</div>
        <button onClick={() => navigate("/dai-ly/nhap-hang/tao-moi")} className="text-emerald-600 hover:underline">
          Quay lại trang tạo phiếu
        </button>
      </div>
    );
  }

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      let successCount = 0;
      for (const draft of draftList) {
        const payload = {
          supplier_id: draft.supplier_id,
          delivery_address: draft.delivery_address,
          requested_delivery_time: draft.requested_delivery_time,
          receiver_name: draft.receiver_name,
          receiver_phone: draft.receiver_phone,
          note: draft.note,
          items: draft.items.map((item) => ({
            supplier_product_id: item.supplier_product_id,
            quantity: String(item.quantity),
            note: item.note || "",
          })),
        };
        await purchaseOrderService.create(payload);
        successCount++;
      }
      toast.success(`Tạo thành công ${successCount} phiếu nhập!`);
      navigate("/dai-ly/nhap-hang");
    } catch (error) {
      console.error("Lỗi khi tạo phiếu nhập hàng:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Không thể tạo phiếu nhập hàng.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy phiếu nhập dự thảo này không?")) {
      navigate("/dai-ly/nhap-hang/tao-moi");
    }
  };

  return (
    <div className="font-['Geist',sans-serif] pb-12 px-4 sm:px-8 md:px-16 lg:px-24 bg-emerald-50/15 min-h-screen pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/dai-ly/nhap-hang/tao-moi", { state: { draftData: rawData } })}
          className="p-2 hover:bg-neutral-200 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <h1 className="text-2xl font-bold text-neutral-800">Xác nhận phiếu nhập hàng</h1>
      </div>

      <div className="flex flex-col gap-8">
        {draftList.map((draft, index) => {
          const mappedOrderData = {
            dealer: {
              name: user?.dealer_profile?.store_name || user?.full_name || "Đại lý đối tác",
              code: user?.dealer_profile?.id ? `DL${String(user.dealer_profile.id).padStart(4, "0")}` : "DL-NEW",
              phone: user?.phone || draft.receiver_phone || "Chưa cung cấp",
              email: user?.email || "Chưa cung cấp",
            },
            supplier: {
              name: draft.supplier_name,
              code: `NCC${String(draft.supplier_id).padStart(4, "0")}`,
              phone: "Chưa cung cấp",
              email: "Chưa cung cấp",
            },
            delivery: {
              recipient: draft.receiver_name,
              phone: draft.receiver_phone,
              address: draft.delivery_address,
              slot: draft.requested_delivery_time ? formatDateTime(draft.requested_delivery_time) : "Trong giờ hành chính",
            }
          };

          return (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
            <h2 className="text-lg font-bold text-emerald-800 mb-4 border-b border-emerald-50 pb-2">
              Phiếu {draftList.length > 1 ? `#${index + 1}` : ""} - {draft.supplier_name}
            </h2>
{/*             
            <OrderDetailInfoCards orderData={mappedOrderData} /> */}

            {/* Danh sách sản phẩm */}
            <OrderDetailItemsTable items={draft.items} />

            {/* Tổng tiền */}
            <div className="flex justify-end">
              <div className="bg-emerald-50 text-emerald-900 px-6 py-4 rounded-xl flex items-center gap-4">
                <span className="font-semibold">Tổng tiền phiếu này:</span>
                <span className="text-2xl font-bold">{Number(draft.total_amount).toLocaleString("vi-VN")} đ</span>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Các nút hành động */}
      <div className="flex justify-end gap-4 border-t border-neutral-200 mt-8 pt-6">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 h-11 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl text-xs font-bold transition-all cursor-pointer min-w-36 active:scale-95 disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" /> Hủy dự thảo
        </button>
        <button
          onClick={handleConfirmOrder}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 h-11 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer min-w-44 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
             <CheckCircle className="w-4 h-4" />
          )}
          Xác nhận gửi {draftList.length > 1 ? "tất cả phiếu" : "phiếu"}
        </button>
      </div>
    </div>
  );
}
