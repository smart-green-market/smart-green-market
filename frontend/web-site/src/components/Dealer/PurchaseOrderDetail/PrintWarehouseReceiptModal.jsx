import { X, Printer, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { purchaseOrderService } from "../../../services/api/purchaseOrderService";
import { formatDateTime } from "../../common/formatDateTime";

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

export default function PrintWarehouseReceiptModal({ orders, isOpen, onClose }) {
  const [detailedOrders, setDetailedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && orders && orders.length > 0) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const fetched = await Promise.all(
            orders.map(async (order) => {
              // If the order already contains full product items, addresses and suppliers, use it directly!
              if (order.items && order.items.length > 0 && order.supplier && order.delivery) {
                return order;
              }
              
              // Otherwise (e.g. from bulk print list), load details from API
              const orderId = order.rawId || order.id;
              if (orderId) {
                const data = await purchaseOrderService.getById(orderId);
                return {
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
                    subtotal: Number(item.subtotal || 0),
                  })),
                  rawSubtotal: Number(data.total_amount || 0),
                  grossSubtotal: Number(data.gross_subtotal || data.total_amount || 0),
                  totalDiscountAmount: Number(data.total_discount_amount || 0),
                  depositAmount: Number(data.deposit_amount || 0),
                  remainingAmount: Number(data.debt_amount || 0),
                };
              }
              return order;
            })
          );
          setDetailedOrders(fetched);
        } catch (error) {
          console.error("Lỗi khi tải chi tiết phiếu nhập:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setDetailedOrders([]);
    }
  }, [isOpen, orders]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const content = document.getElementById("printable-receipts-area")?.innerHTML;
    if (!content) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    const isSingle = detailedOrders.length === 1;
    const titleName = isSingle ? `Phieu_Nhap_Hang_${detailedOrders[0].id}` : "In_Phieu_Nhap_Hang_Hang_Loat";
    doc.write(`<html><head><title>${titleName}</title>`);
    
    // Copy all parent styles to the iframe
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    styles.forEach(s => {
      doc.write(s.outerHTML);
    });
    
    doc.write(`
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; padding: 0; margin: 0; }
          .receipt-page { page-break-after: always; break-after: page; padding: 20px; box-shadow: none !important; border: none !important; }
          .receipt-page:last-child { page-break-after: avoid; break-after: avoid; }
        }
      </style>
    `);
    doc.write("</head><body>");
    doc.write(content);
    doc.write("</body></html>");
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN').format(Number(val || 0)) + ' đ';

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-neutral-900/60 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto no-print">
      <div className="bg-neutral-100 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-neutral-200 bg-white">
          <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            {detailedOrders.length > 1 ? `Xem trước Phiếu Nhập Hàng hàng loạt (${detailedOrders.length} đơn)` : "Xem trước Phiếu Nhập Hàng"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || detailedOrders.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> In tất cả ({detailedOrders.length})
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="p-6 overflow-y-auto bg-neutral-200/50 flex flex-col items-center gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
              <p className="text-sm text-neutral-500 font-bold">Đang chuẩn bị dữ liệu phiếu in...</p>
            </div>
          ) : (
            <div id="printable-receipts-area" className="w-full max-w-2xl flex flex-col gap-6">
              {detailedOrders.map((orderData, index) => {
                const receiptCode = `NK${String(orderData.id).replace(/\D/g, '').slice(-6).padStart(6, '0')}`;
                return (
                  <div 
                    key={orderData.rawId || index} 
                    className="receipt-page bg-white p-8 w-full shadow-sm border border-neutral-200 font-sans text-neutral-800"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-neutral-800 pb-6 mb-6">
                      <div>
                        <h1 className="text-xl font-black text-neutral-950 tracking-tight uppercase">SMART GREEN MARKET</h1>
                        <p className="text-sm text-neutral-600 font-bold mt-1">Đại Lý Nông Sản Sạch</p>
                        <p className="text-xs text-neutral-500 mt-1">Địa chỉ: {orderData.delivery.address}</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-lg font-black text-neutral-900 uppercase tracking-widest">Phiếu Nhập Hàng</h2>
                        <p className="text-sm text-neutral-600 font-bold mt-1">Mã phiếu: {receiptCode}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Mã đơn đặt: #{orderData.id}</p>
                        <p className="text-xs text-neutral-500 mt-1">Ngày lập: {orderData.completedAt ? orderData.completedAt.split(" ")[0] : orderData.date}</p>
                      </div>
                    </div>

                    {/* General Information */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div>
                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Đơn vị giao (Nhà cung cấp)</h3>
                        <p className="font-bold text-neutral-800">{orderData.supplier.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Mã NCC: {orderData.supplier.code}</p>
                        <p className="text-xs text-neutral-500">SĐT: {orderData.supplier.phone}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Đơn vị nhận (Kho Đại lý)</h3>
                        <p className="font-bold text-neutral-800">{orderData.delivery.recipient}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">SĐT: {orderData.delivery.phone}</p>
                        <p className="text-xs text-neutral-500">Hình thức: Nhập hàng nông sản</p>
                      </div>
                    </div>

                    {/* Products Table */}
                    <table className="w-full mb-6 border-collapse text-sm">
                      <thead>
                        <tr className="border-b-2 border-neutral-800 text-left">
                          <th className="py-2 w-16 text-xs font-black text-neutral-600 uppercase tracking-wider text-center">Đã kiểm</th>
                          <th className="py-2 w-12 text-xs font-black text-neutral-600 uppercase tracking-wider">STT</th>
                          <th className="py-2 text-xs font-black text-neutral-600 uppercase tracking-wider">Tên sản phẩm</th>
                          <th className="py-2 text-xs font-black text-neutral-600 uppercase tracking-wider text-center">ĐVT</th>
                          <th className="py-2 text-xs font-black text-neutral-600 uppercase tracking-wider text-right">SL Yêu cầu</th>
                          <th className="py-2 text-xs font-black text-neutral-600 uppercase tracking-wider text-right">SL Thực nhận</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {orderData.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 text-center">
                              <div className="w-4 h-4 border-2 border-neutral-400 rounded mx-auto"></div>
                            </td>
                            <td className="py-3 text-neutral-500">{idx + 1}</td>
                            <td className="py-3 font-bold text-neutral-800">{item.name}</td>
                            <td className="py-3 text-center text-neutral-600">{item.unit}</td>
                            <td className="py-3 text-right text-neutral-500 font-mono">{item.original_quantity}</td>
                            <td className="py-3 text-right font-black text-neutral-900 font-mono">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pricing details */}
                    <div className="border-t border-dashed border-neutral-300 pt-4 flex justify-end">
                      <div className="w-80 space-y-1.5 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-500">Tổng tiền hàng:</span>
                          <span className="font-semibold text-neutral-800 font-mono">{formatCurrency(orderData.grossSubtotal)}</span>
                        </div>
                        {orderData.totalDiscountAmount > 0 && (
                          <div className="flex justify-between items-center text-neutral-600">
                            <span>Tổng giảm giá:</span>
                            <span className="font-semibold font-mono">- {formatCurrency(orderData.totalDiscountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-neutral-600 border-b border-neutral-100 pb-1.5">
                          <span>Tiền cọc đã trả:</span>
                          <span className="font-semibold text-neutral-800 font-mono">{formatCurrency(orderData.depositAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5">
                          <span className="font-black text-neutral-900 uppercase text-xs">Cần thanh toán còn lại:</span>
                          <span className="text-lg font-black text-emerald-700 font-mono">{formatCurrency(orderData.remainingAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Signature Area */}
                    <div className="mt-12 grid grid-cols-3 gap-4 text-center text-xs font-bold text-neutral-700">
                      <div>
                        <p className="uppercase tracking-wider">Người lập phiếu</p>
                        <p className="text-[10px] font-normal text-neutral-400 mt-0.5">(Ký, ghi rõ họ tên)</p>
                        <div className="h-20"></div>
                        <p className="font-normal text-neutral-500">{orderData.delivery.recipient}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wider">Người giao hàng</p>
                        <p className="text-[10px] font-normal text-neutral-400 mt-0.5">(Ký, ghi rõ họ tên)</p>
                        <div className="h-20"></div>
                        <p className="font-normal text-neutral-300">........................</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wider">Thủ kho xác nhận</p>
                        <p className="text-[10px] font-normal text-neutral-400 mt-0.5">(Ký, đóng dấu nếu có)</p>
                        <div className="h-20"></div>
                        <p className="font-normal text-neutral-300">........................</p>
                      </div>
                    </div>

                    {/* Footer notes */}
                    <div className="mt-12 border-t border-neutral-200 pt-4 text-center text-[10px] text-neutral-400 font-medium">
                      <p>Mọi thắc mắc về hàng lỗi, hao hụt vui lòng liên hệ bộ phận hỗ trợ Smart Green Market.</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
