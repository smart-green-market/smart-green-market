import React, { useState, useEffect } from "react";
import { CreditCard, Upload, RefreshCw, AlertCircle, FileText, Check } from "lucide-react";
import { purchaseOrderService } from "../../../services/api/purchaseOrderService";
import { toast } from "sonner";

export default function PaymentQrSection({ orderId, paymentType, onSuccess }) {
  const [qrData, setQrData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [errorQr, setErrorQr] = useState(null);

  // Form states
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentProvider, setPaymentProvider] = useState("");
  const [note, setNote] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQr = async () => {
      setLoadingQr(true);
      setErrorQr(null);
      try {
        const data = await purchaseOrderService.getPaymentQr(orderId, paymentType);
        setQrData(data);
      } catch (err) {
        console.error("Lỗi khi lấy mã QR thanh toán:", err);
        setErrorQr(err.response?.data?.detail || "Không thể lấy thông tin QR tài khoản của nhà cung cấp.");
      } finally {
        setLoadingQr(false);
      }
    };
    if (orderId && paymentType) {
      fetchQr();
    }
  }, [orderId, paymentType]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      toast.error("Vui lòng tải lên ảnh hoặc tệp biên lai chuyển khoản!", { position: "top-center", duration: 5000 },);
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("payment_method", paymentMethod);
    formData.append("receipt_file", receiptFile);
    if (paymentProvider) formData.append("payment_provider", paymentProvider);
    if (note) formData.append("note", note);

    try {
      if (paymentType === "deposit") {
        await purchaseOrderService.submitDeposit(orderId, formData);
        toast.success("Đã nộp minh chứng chuyển khoản đặt cọc thành công!");
      } else {
        await purchaseOrderService.submitFinalPayment(orderId, formData);
        toast.success("Đã nộp minh chứng chuyển khoản thanh toán cuối thành công!");
      }
      // Reset form
      setReceiptFile(null);
      setPaymentProvider("");
      setNote("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Lỗi khi nộp minh chứng thanh toán:", err);
      const errMsg = err.response?.data?.detail || "Không thể nộp minh chứng thanh toán.";
      toast.error(errMsg, { position: "top-center", duration: 5000 },);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingQr) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100 p-8 shadow-xs mb-6 flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-neutral-500 text-sm font-medium">Đang tải mã QR thanh toán VietQR...</p>
      </div>
    );
  }

  if (errorQr) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-xs mb-6 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-red-600 font-bold text-sm">Lỗi tải thông tin thanh toán</p>
        <p className="text-neutral-500 text-xs mt-1.5 max-w-md">{errorQr}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 lg:p-8 shadow-xs mb-6 flex flex-col lg:flex-row gap-8 items-start">
      {/* CỘT TRÁI: HIỂN THỊ MÃ QR */}
      {qrData && (
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col items-center">
          <h3 className="font-bold text-neutral-800 text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            QUÉT MÃ VIETQR {paymentType === "deposit" ? "ĐẶT CỌC" : "THANH TOÁN CUỐI"}
          </h3>
          
          <div className="w-full max-w-[280px] aspect-square border border-neutral-100 rounded-3xl overflow-hidden p-3 bg-neutral-50 flex items-center justify-center shadow-inner mb-4">
            <img
              src={qrData.qr_image_url}
              alt="VietQR Payment Code"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 text-center leading-relaxed px-4">
            * Vui lòng chuyển khoản chính xác số tiền và nội dung chuyển khoản để hệ thống tự động xác nhận nhanh nhất.
          </p>
        </div>
      )}

      {/* CỘT PHẢI: THÔNG TIN & FORM */}
      <div className="flex-1 w-full flex flex-col min-w-0">
        {qrData && (
          <div className="w-full bg-neutral-50/80 rounded-2xl p-5 md:p-6 text-sm font-semibold text-neutral-600 flex flex-col gap-3.5 border border-neutral-100 mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-neutral-500 text-xs uppercase tracking-wider font-bold">Ngân hàng:</span>
              <span className="text-neutral-800 font-bold">{qrData.bank_name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-neutral-500 text-xs uppercase tracking-wider font-bold">Chủ tài khoản:</span>
              <span className="text-neutral-800 font-bold uppercase">{qrData.account_name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-neutral-500 text-xs uppercase tracking-wider font-bold">Số tài khoản:</span>
              <span className="text-emerald-700 font-extrabold text-base select-all">{qrData.account_number}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-3 mt-1 border-t border-neutral-200">
              <span className="text-neutral-500 text-xs uppercase tracking-wider font-bold">Số tiền chuyển:</span>
              <span className="text-emerald-700 font-extrabold text-lg">
                {Number(qrData.amount).toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-3 border-t border-neutral-200">
              <span className="text-neutral-500 text-xs uppercase tracking-wider font-bold">Nội dung chuyển khoản:</span>
              <span className="text-emerald-800 font-extrabold bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/60 select-all">
                {qrData.transfer_content}
              </span>
            </div>
          </div>
        )}

        {/* THÊM MINH CHỨNG */}
        <div>
          <h3 className="font-bold text-neutral-800 text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            GỬI MINH CHỨNG CHUYỂN KHOẢN
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
              {/* Ghi chú */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ghi chú thêm</label>
                <input
                  type="text"
                  placeholder="Nhập ghi chú (tùy chọn)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-11 px-4 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-neutral-50/50 hover:bg-white transition-all"
                />
              </div>
            </div>

            {/* Tải lên ảnh biên lai */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ảnh biên lai / hóa đơn <span className="text-red-500">*</span></label>
              <div className="relative border-2 border-dashed border-neutral-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center p-6 min-h-32 cursor-pointer group">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {receiptFile ? (
                  <div className="flex items-center gap-3 text-emerald-700 text-sm font-bold bg-emerald-100/50 px-4 py-2 rounded-xl border border-emerald-200">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span className="truncate max-w-[250px]">{receiptFile.name}</span>
                    <Check className="w-5 h-5 text-emerald-600 ml-1" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                      <Upload className="w-5 h-5 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <p className="text-sm font-bold text-neutral-600 group-hover:text-emerald-700 transition-colors">Kéo thả hoặc nhấp để tải lên ảnh chụp màn hình</p>
                    <p className="text-xs text-neutral-400 mt-1 font-medium">Hỗ trợ JPG, PNG, PDF (Tối đa 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Nút gửi */}
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={submitting || !receiptFile}
                className="h-12 px-8 bg-emerald-700 hover:bg-emerald-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Hoàn tất & Gửi minh chứng
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
