import { X, Printer, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { dealerOrderService } from "../../../services/api/dealerOrderService";

export default function PrintPickingListModal({ orders, isOpen, onClose }) {
  const [detailedOrders, setDetailedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && orders && orders.length > 0) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const fetched = await Promise.all(
            orders.map(async (order) => {
              const orderId = order.originalData?.id;
              if (orderId) {
                const detail = await dealerOrderService.getById(orderId);
                return {
                  ...order,
                  originalData: detail,
                };
              }
              return order;
            })
          );
          setDetailedOrders(fetched);
        } catch (error) {
          console.error("Lỗi khi tải chi tiết đơn hàng để in phiếu soạn:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setDetailedOrders([]);
    }
  }, [isOpen, orders]);

  if (!isOpen || !orders || orders.length === 0) return null;

  const handlePrint = () => {
    const content = document.getElementById("printable-picking-area")?.innerHTML;
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
    const titleName = detailedOrders.length === 1 ? `Phieu_Soan_${detailedOrders[0].id}` : `Danh_Sach_Phieu_Soan`;
    doc.write(`<html><head><title>${titleName}</title>`);
    
    // Copy parent styles
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    styles.forEach(s => {
      doc.write(s.outerHTML);
    });
    
    doc.write('<style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page-break { page-break-after: always; } }</style>');
    doc.write("</head><body class='bg-white' style='padding: 20px;'>");
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

  const getTodayDateString = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-neutral-900/60 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto no-print">
      <div className="bg-neutral-100 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-neutral-200 bg-white">
          <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            Xem trước phiếu soạn ({orders.length} đơn hàng)
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> In ngay
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 flex-1 bg-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          /* Printable Area Container */
          <div className="p-6 overflow-y-auto bg-neutral-200/50 flex flex-col gap-8 items-center" id="printable-picking-area">
            {detailedOrders.map((order, index) => {
              const fullData = order.originalData || {};
              const products = fullData.items || [];
              const pickingCode = `PS${String(fullData.id || order.id).replace(/\D/g, '').padStart(6, '0')}`;

              return (
                <div key={order.id} className={`bg-white p-8 w-full max-w-2xl shadow-sm border border-neutral-200 mx-auto ${index < detailedOrders.length - 1 ? 'page-break' : ''} font-mono text-neutral-800`}>
                  
                  {/* Title Header */}
                  <div className="text-center border-b border-dashed border-neutral-400 pb-4 mb-4">
                    <h1 className="text-xl font-bold tracking-wider">SMART GREEN MARKET</h1>
                    <h2 className="text-lg font-bold tracking-widest mt-1">PHIẾU SOẠN HÀNG</h2>
                  </div>

                  {/* General Info */}
                  <div className="space-y-1 mb-4 text-sm">
                    <div className="flex"><span className="w-28 shrink-0">Mã phiếu:</span><span className="font-bold">{pickingCode}</span></div>
                    <div className="flex"><span className="w-28 shrink-0">Mã đơn:</span><span className="font-bold">{order.id}</span></div>
                    <div className="flex"><span className="w-28 shrink-0">Ngày in:</span><span>{getTodayDateString()}</span></div>
                  </div>

                  {/* Customer Info */}
                  <div className="border-t border-b border-dashed border-neutral-400 py-3 my-4 text-sm space-y-1">
                    <div className="flex"><span className="w-28 shrink-0">Người nhận:</span><span className="font-bold">{order.customer}</span></div>
                    <div className="flex"><span className="w-28 shrink-0">SĐT:</span><span>{fullData.customer_phone || "(Trống)"}</span></div>
                    <div className="flex"><span className="w-28 shrink-0">Địa chỉ:</span><span className="leading-tight">{fullData.delivery_address || "(Trống)"}</span></div>
                  </div>

                  {/* Products Table */}
                  <table className="w-full text-sm my-4 border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-400 text-left">
                        <th className="py-1.5 w-12 font-bold">STT</th>
                        <th className="py-1.5 font-bold">Tên sản phẩm</th>
                        <th className="py-1.5 w-20 font-bold text-center">ĐVT</th>
                        <th className="py-1.5 w-20 font-bold text-right">SL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {products.map((item, idx) => (
                        <tr key={idx} className="border-b border-dashed border-neutral-100">
                          <td className="py-2">{idx + 1}</td>
                          <td className="py-2 font-bold">{item.product_name}</td>
                          <td className="py-2 text-center">{item.product_unit}</td>
                          <td className="py-2 text-right font-bold text-base">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Footer separator */}
                  <div className="border-t border-dashed border-neutral-400 mt-6 pt-4 text-center text-xs text-neutral-500">
                    <p>-- Chúc một ngày làm việc hiệu quả! --</p>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
