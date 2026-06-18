import { useState } from "react";
import { 
  Download, Plus, Users, Award, AlertTriangle, 
  Star, TrendingUp, TrendingDown, 
  MoreHorizontal
} from "lucide-react";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";

export default function DealerCustomerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const customers = [
    {
      id: 1,
      initials: "HT",
      name: "Hợp tác xã Nông nghiệp Xanh",
      type: "Đại lý cấp 1",
      phone: "0901 234 567",
      history: "124.5M đ",
      trend: { value: "+ 5%", isUp: true },
      aiClass: { label: "VIP", type: "vip" }
    },
    {
      id: 2,
      initials: "TV",
      name: "Trang trại Việt GAP",
      type: "Đại lý cấp 2",
      phone: "0988 765 432",
      history: "45.2M đ",
      trend: { value: "+ 12%", isUp: true },
      aiClass: { label: "Tiềm năng", type: "potential" }
    },
    {
      id: 3,
      initials: "CH",
      name: "Cửa hàng Vật tư Nông nghiệp 365",
      type: "Bán lẻ",
      phone: "0912 345 678",
      history: "12.8M đ",
      trend: { value: "↓ 8%", isUp: false },
      aiClass: { label: "Có rủi ro", type: "risk" }
    }
  ];

  const filterOptions = [
    { label: "Tất cả phân khúc", value: "", colorClass: "text-neutral-700" },
    { label: "Khách hàng VIP", value: "vip", colorClass: "text-yellow-700" },
    { label: "Tiềm năng", value: "potential", colorClass: "text-sky-700" },
    { label: "Có rủi ro", value: "risk", colorClass: "text-orange-700" }
  ];

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      customer.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "" || customer.aiClass.type === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-neutral-50/50 min-h-screen font-['Geist',sans-serif]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Quản lý Khách hàng</h1>
          <p className="text-sm text-neutral-500 font-medium mt-1">
            Phân tích và chăm sóc tập khách hàng đại lý với AI Insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-sm font-bold transition-colors">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#006A3A] hover:bg-[#005A30] text-white rounded-xl text-sm font-bold transition-colors shadow-md">
            <Plus className="w-4 h-4" /> Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 bg-emerald-100/60 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">
              <TrendingUp className="w-3 h-3" /> +12%
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Tổng khách hàng</p>
            <h2 className="text-4xl font-black text-neutral-900 tracking-tight">1,248</h2>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
            <div className="bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full text-xs font-bold">
              Phân khúc AI
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Khách hàng VIP</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-black text-neutral-900 tracking-tight">342</h2>
              <span className="text-sm font-bold text-neutral-400">/ 27% tổng số</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-bold">
              Cần chú ý
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-neutral-500 mb-1">Nguy cơ rời bỏ</p>
            <h2 className="text-4xl font-black text-neutral-900 tracking-tight">56</h2>
          </div>
        </div>
      </div>

      <SupplierFilter 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        filterOptions={filterOptions}
        placeholder="Tìm kiếm khách hàng (tên, số điện thoại)..."
      />

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
        
        {/* Table Header */}
        <div className="p-5 flex justify-between items-center border-b border-neutral-100 bg-neutral-50/50">
          <h3 className="text-base font-black text-neutral-900 tracking-tight">Danh sách chi tiết</h3>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider w-[35%]">Tên khách hàng</th>
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider">Số điện thoại</th>
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider">Lịch sử mua hàng (Tháng)</th>
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider">Phân loại AI</th>
                <th className="py-4 px-6 text-[11px] font-black text-neutral-500 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-neutral-200/70 flex items-center justify-center text-neutral-600 font-bold text-sm shrink-0">
                        {customer.initials}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 text-sm leading-tight">{customer.name}</p>
                        <p className="text-[12px] font-medium text-neutral-500 mt-0.5">{customer.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-semibold text-neutral-600">{customer.phone}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-neutral-900">{customer.history}</span>
                      <span className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                        customer.trend.isUp ? 'bg-emerald-100/60 text-emerald-700' : 'bg-red-100/60 text-red-700'
                      }`}>
                        {customer.trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {customer.trend.value.replace('↓ ', '')}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {customer.aiClass.type === 'vip' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100/60 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200/50">
                        <Star className="w-3.5 h-3.5 fill-yellow-700/20" /> {customer.aiClass.label}
                      </span>
                    )}
                    {customer.aiClass.type === 'potential' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100/60 text-sky-700 rounded-full text-xs font-bold border border-sky-200/50">
                        <TrendingUp className="w-3.5 h-3.5" /> {customer.aiClass.label}
                      </span>
                    )}
                    {customer.aiClass.type === 'risk' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100/60 text-orange-700 rounded-full text-xs font-bold border border-orange-200/50">
                        <AlertTriangle className="w-3.5 h-3.5" /> {customer.aiClass.label}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

       
      </div>

    </div>
  );
}
