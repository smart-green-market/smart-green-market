import { BarChart3, FileSpreadsheet } from "lucide-react";

/**
 * StatsHeader
 * Renders the page title and the "Export CSV" button.
 *
 * Props:
 *   data       – the full stats data object (used to disable the button when null)
 *   onExport   – callback invoked when the export button is clicked
 */
export default function StatsHeader({ data, onExport }) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                    <h1 className="text-2xl font-black text-emerald-950">Phân tích &amp; Thống kê</h1>
                </div>
                <p className="text-sm text-neutral-500 font-medium">
                    Theo dõi và phân tích tình hình kinh doanh, dòng tiền, và hao hụt kho hàng
                </p>
            </div>

            <button
                onClick={onExport}
                disabled={!data}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
                <FileSpreadsheet className="w-4 h-4" />
                Xuất báo cáo CSV
            </button>
        </div>
    );
}
