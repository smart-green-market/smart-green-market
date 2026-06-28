import { Lightbulb, ToggleLeft } from "lucide-react";

/**
 * Props:
 *   isPersonal : boolean
 *   accentColor: string
 *   tipBg      : string
 *   tipText    : string
 *   tipTitle   : string
 */
export default function SidePanel({ isPersonal, accentColor, tipBg, tipText, tipTitle }) {
  return (
    <>
      {/* Tip box */}
      <div className={`border rounded-xl p-3 ${tipBg}`}>
        <div className="flex gap-2">
          <Lightbulb className={`w-4 h-4 ${accentColor} flex-shrink-0 mt-0.5`} />
          <div>
            <div className={`text-xs font-semibold mb-1 ${tipTitle}`}>
              {isPersonal ? "Lưu ý sản phẩm cá nhân" : "Mẹo tối ưu"}
            </div>
            <p className={`text-xs leading-relaxed ${tipText}`}>
              {isPersonal
                ? "Sản phẩm cá nhân sẽ được admin xét duyệt. Đặt tên rõ ràng, kèm ảnh thực tế để được duyệt nhanh hơn."
                : "Sản phẩm có ảnh nền trắng và đầy đủ thông tin nhiệt độ bảo quản thường được duyệt nhanh hơn."}
            </p>
          </div>
        </div>
      </div>

      {/* Trạng thái */}
      <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50">
        <div className="flex items-center gap-2 mb-1">
          <ToggleLeft className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-zinc-600">Trạng thái sau khi tạo</span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Sản phẩm mới sẽ ở trạng thái{" "}
          <span className="font-semibold text-amber-600">Chờ duyệt</span>{" "}
          và hiển thị sau khi admin phê duyệt.
        </p>
      </div>
    </>
  );
}
