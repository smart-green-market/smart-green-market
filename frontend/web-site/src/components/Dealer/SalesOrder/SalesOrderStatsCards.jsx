import { ClipboardList, Clock, CheckCircle2, Package } from "lucide-react";
import StatsCard from "../Supplier/StatsCard";

export default function SalesOrderStatsCards({ salesOrders }) {
    const countByStatus = (status) => salesOrders.filter(o => o.status === status).length;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard 
                icon={ClipboardList} 
                label="Tất cả đơn" 
                value={salesOrders.length} 
                iconBg="bg-blue-50" 
                valueColor="text-blue-800" 
            />
            <StatsCard 
                icon={Clock} 
                label="Chờ xác nhận" 
                value={countByStatus("Chờ xác nhận")} 
                iconBg="bg-amber-50" 
                valueColor="text-amber-800" 
            />
            <StatsCard 
                icon={CheckCircle2} 
                label="Đã xác nhận" 
                value={countByStatus("Đã xác nhận")} 
                iconBg="bg-indigo-50" 
                valueColor="text-indigo-800" 
            />
            <StatsCard 
                icon={Package} 
                label="Đang chuẩn bị" 
                value={countByStatus("Đang chuẩn bị hàng")} 
                iconBg="bg-orange-50" 
                valueColor="text-orange-800" 
            />
        </div>
    );
}
