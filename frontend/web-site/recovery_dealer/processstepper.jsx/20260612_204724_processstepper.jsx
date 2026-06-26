import { FileText } from "lucide-react";

export default function ProcessStepper() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-xs">
      <h2 className="font-bold text-neutral-800 text-sm flex items-center gap-2 mb-5 border-b border-neutral-50 pb-3 uppercase tracking-wider">
        <span className="p-1 bg-neutral-100 rounded-md text-neutral-600">
          <FileText className="w-4 h-4" />
        </span>
        Trạng Thái Quy Trình
      </h2>

      <div className="flex flex-col gap-6 pl-2 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-neutral-100">
        {/* Step 1 */}
        <div className="flex gap-4 relative">
          <div className="z-10 w-4 h-4 rounded-full bg-emerald-600 border-4 border-emerald-100 mt-1 flex items-center justify-center" />
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-neutral-800 text-xs">
                Chờ xác nhận
              </span>
              <span className="bg-emerald-50 text-emerald-700 rounded-md text-[8px] font-extrabold px-1.5 py-0.5 tracking-wider uppercase">
                ĐANG THỰC HIỆN
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">
              Hệ thống đang chờ bạn hoàn tất phiếu nhập.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4 relative">
          <div className="z-10 w-4 h-4 rounded-full bg-neutral-200 border-4 border-white mt-1" />
          <div className="flex-1">
            <span className="font-bold text-neutral-400 text-xs">
              Chờ đặt cọc
            </span>
            <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">
              Thanh toán cọc sau khi NCC xác nhận.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4 relative">
          <div className="z-10 w-4 h-4 rounded-full bg-neutral-200 border-4 border-white mt-1" />
          <div className="flex-1">
            <span className="font-bold text-neutral-400 text-xs">
              Đã thanh toán
            </span>
            <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">
              Hoàn tất 100% giá trị đơn hàng.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4 relative">
          <div className="z-10 w-4 h-4 rounded-full bg-neutral-200 border-4 border-white mt-1" />
          <div className="flex-1">
            <span className="font-bold text-neutral-400 text-xs">
              Đã nhận hàng
            </span>
            <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">
              Kiểm kho và nhập kho đại lý.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
