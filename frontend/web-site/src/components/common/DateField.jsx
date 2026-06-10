import { formatDateTime } from "./formatDateTime";
import { CalendarDays } from "lucide-react"; 


export default function DateField({ label, value, danger = false }) {
    return (
        <div className="flex flex-col gap-2">
            {/* Label */}
            {label && (
                <label className="text-neutral-700 text-base">
                    {label}
                </label>
            )}

            {/* Khung hiển thị */}
            <div className={`px-4 py-2.5 rounded-lg border border-neutral-200 flex items-center gap-2
                ${danger ? "border-red-200 bg-red-50" : "border-neutral-200 bg-white"}`}
            >
                {/* Icon Lịch */}
                <CalendarDays
                    className={`w-4 h-4 shrink-0 ${
                        danger ? "text-red-700" : "text-neutral-500"
                    }`}
                />

                {/* Text Ngày tháng */}
                <span
                    className={`text-base ${
                        danger 
                            ? "text-red-700 font-semibold" 
                            : "text-neutral-800"
                    }`}
                >
                    {formatDateTime(value)}
                </span>
            </div>
        </div>
    );
}