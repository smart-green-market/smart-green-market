import { Printer } from "lucide-react";

export default function PrintPreviewModal({ htmlContent, onClose }) {
  const handlePrint = () => {
    const iframe = document.getElementById("print-iframe");
    if (!iframe) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  return (
    <>
      {/* Ẩn modal khi in thật — chỉ in nội dung iframe */}
      <style>{`@media print { .print-modal-shell { display: none !important; } }`}</style>

      <div className="print-modal-shell fixed inset-0 z-[60] flex flex-col bg-black/60">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-2">
            <Printer size={15} className="text-emerald-700" />
            <span className="font-bold text-gray-900 text-sm">Xem trước khi in</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Printer size={13} /> In / Xuất PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-neutral-300 p-6 flex justify-center">
          <div className="w-full max-w-[860px] shadow-2xl rounded-lg overflow-hidden bg-white">
            <iframe
              id="print-iframe"
              srcDoc={htmlContent}
              className="w-full border-0"
              style={{ height: "calc(100vh - 120px)", minHeight: 600 }}
              title="print-preview"
            />
          </div>
        </div>
      </div>
    </>
  );
}
