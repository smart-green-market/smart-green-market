import { X, Printer, Package } from "lucide-react";
import { useEffect } from "react";

export default function PrintInvoiceModal({ orders, isOpen, onClose }) {
  if (!isOpen || !orders || orders.length === 0) return null;

  const handlePrint = () => {
    const content = document.getElementById("printable-area").innerHTML;
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
    doc.write("<html><head><title>In Hoá Đơn</title>");
    
    // Copy all styles from parent to iframe
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    styles.forEach(s => {
      doc.write(s.outerHTML);
    });
    
    doc.write('<style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page-break { page-break-after: always; } }</style>');
    doc.write("</head><body class='bg-white' style='padding: 20px;'>");
    doc.write(content);
    doc.write("</body></html>");
    doc.close();

    // Wait for styles to load in iframe then print
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

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-neutral-900/60 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto no-print">
      <div className="bg-neutral-100 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-neutral-200 bg-white">
          <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            Xem trước bản in ({orders.length} hoá đơn)
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" /> In ngay
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area Container */}
        <div className="p-6 overflow-y-auto bg-neutral-200/50 flex flex-col gap-8 items-center" id="printable-area">
          
          
          {orders.map((order, index) => {
            const fullData = order.originalData || {};
            const products = fullData.items || [];
            const formatCurrency = (val) => new Intl.NumberFormat('vi-VN').format(Number(val || 0)) + ' đ';

            return (
              <div key={order.id} className={`bg-white p-8 w-full max-w-2xl shadow-sm border border-neutral-200 mx-auto ${index < orders.length - 1 ? 'page-break' : ''}`}>
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-800 pb-6 mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">Đại Lý Nông Sản</h1>
                    <p className="text-sm text-neutral-600 font-medium mt-1">Smart Green Market</p>
                    <p className="text-xs text-neutral-500 mt-1">SĐT: 0123 456 789 - Email: hotro@sgm.vn</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-neutral-800 uppercase tracking-widest">Hoá Đơn</h2>
                    <p className="text-sm text-neutral-600 font-bold mt-1">#{order.id}</p>
                    <p className="text-xs text-neutral-500 mt-1">Ngày: {order.date}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 border-b border-neutral-100 pb-1">Giao đến</h3>
                  <p className="font-bold text-neutral-800 text-lg">{order.customer}</p>
                  <p className="text-sm text-neutral-600 mt-1">SĐT khách hàng: {fullData.customer_phone || "(Đang cập nhật)"}</p>
                  <p className="text-sm text-neutral-600 mt-0.5">Địa chỉ giao: {fullData.delivery_address || "(Đang cập nhật)"}</p>
                </div>

                {/* Items Table */}
                <table className="w-full mb-6">
                  <thead>
                    <tr className="border-b-2 border-neutral-800 text-left">
                      <th className="py-2 text-xs font-black text-neutral-600 uppercase tracking-wider">STT</th>
                      <th className="py-2 text-xs font-black text-neutral-600 uppercase tracking-wider">Tên sản phẩm</th>
                      <th className="py-2 text-xs font-black text-neutral-600 uppercase tracking-wider text-right">SL</th>
                      <th className="py-2 text-xs font-black text-neutral-600 uppercase tracking-wider text-right">Đơn giá</th>
                      <th className="py-2 text-xs font-black text-neutral-600 uppercase tracking-wider text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {products.map((item, idx) => {
                      return (
                        <tr key={idx}>
                          <td className="py-3 text-sm text-neutral-500 font-medium">{idx + 1}</td>
                          <td className="py-3 text-sm font-bold text-neutral-800">{item.product_name}</td>
                          <td className="py-3 text-sm font-black text-neutral-900 text-right">{item.quantity} {item.product_unit}</td>
                          <td className="py-3 text-sm text-neutral-600 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="py-3 text-sm font-bold text-emerald-700 text-right">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t-2 border-neutral-800 pt-4 flex justify-end">
                  <div className="w-72">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-600 font-bold">Thanh toán:</span>
                      <span className="text-sm font-bold text-neutral-800 uppercase text-right truncate max-w-[150px]" title={fullData.payment_method}>{fullData.payment_method || order.payment}</span>
                    </div>
                    {Number(fullData.shipping_fee) > 0 && (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-neutral-600 font-bold">Tạm tính:</span>
                          <span className="text-sm font-bold text-neutral-800">{formatCurrency(fullData.subtotal_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-neutral-600 font-bold">Phí vận chuyển:</span>
                          <span className="text-sm font-bold text-neutral-800">{formatCurrency(fullData.shipping_fee)}</span>
                        </div>
                      </>
                    )}
                    {Number(fullData.discount_amount) > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-neutral-600 font-bold">Giảm giá:</span>
                        <span className="text-sm font-bold text-neutral-800">- {formatCurrency(fullData.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center bg-neutral-50 p-3 mt-2 rounded-lg border border-neutral-200">
                      <span className="text-sm text-neutral-800 font-black uppercase">Tổng tiền:</span>
                      <span className="text-lg font-black text-emerald-700">{formatCurrency(fullData.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-12 text-center text-xs text-neutral-400 font-medium">
                  <p>Cảm ơn quý khách đã tin tưởng mua hàng tại Smart Green Market!</p>
                  <p className="mt-1">Vui lòng kiểm tra kỹ hàng hoá trước khi nhận.</p>
                </div>
                
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
