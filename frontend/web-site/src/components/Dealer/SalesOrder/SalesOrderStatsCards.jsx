import { ClipboardList, Clock, Truck, CheckCircle2, XCircle } from "lucide-react";
import StatsCard from "../Supplier/StatsCard";

export default function SalesOrderStatsCards({ salesOrders }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
                value={salesOrders.filter(o => o.delivery === "Chờ xác nhận").length} 
                iconBg="bg-amber-50" 
                valueColor="text-amber-800" 
            />
            <StatsCard 
                icon={Truck} 
                label="Đang giao" 
                value={salesOrders.filter(o => o.delivery === "Đang giao hàng").length} 
                iconBg="bg-sky-50" 
                valueColor="text-sky-800" 
            />
            <StatsCard 
                icon={CheckCircle2} 
                label="Đã giao" 
                value={salesOrders.filter(o => o.delivery === "Đã giao").length} 
                iconBg="bg-emerald-50" 
                valueColor="text-emerald-800" 
            />
            <StatsCard 
                icon={XCircle} 
                label="Đã huỷ" 
                value={salesOrders.filter(o => o.delivery === "Đã hủy").length} 
                iconBg="bg-red-50" 
                valueColor="text-red-800" 
            />
        </div>
    );
}
