import { useState } from "react";
import {
  TrendingUp, ShoppingBag, Package, Users, BadgeDollarSign,
  ChevronRight, Eye, ArrowUpRight, SlidersHorizontal,
} from "lucide-react";
import SupplierPageHeader from "../../components/Supplier/UI/SupplierPageHeader";
// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const REVENUE_DATA = [
  { date: "01/10", value: 18200000 },
  { date: "05/10", value: 22500000 },
  { date: "10/10", value: 19800000 },
  { date: "15/10", value: 35400000 },
  { date: "20/10", value: 48200000 },
  { date: "25/10", value: 31600000 },
  { date: "30/10", value: 800000 },
];

const ORDER_WEEK = [
  { day: "T2", count: 38 },
  { day: "T3", count: 52 },
  { day: "T4", count: 44 },
  { day: "T5", count: 71 },
  { day: "T6", count: 58 },
  { day: "T7", count: 33 },
  { day: "CN", count: 500 },
];

const ORDER_STATUS = [
  { name: "Hoàn thành", value: 65, color: "#2D6A4F" },
  { name: "Đang giao",  value: 25, color: "#52B788" },
  { name: "Đã hủy",    value: 20, color: "#F87171" },
];

const TOP_PRODUCTS = [
  { id: 1, name: "Rau cải chíp hữu cơ", supplier: "Farm Fresh",      category: "Rau củ",   qty: 450, unit: "kg", revenue: 12450000, img: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=80&h=80&fit=crop" },
  { id: 2, name: "Táo Envy loại 1",      supplier: "Global Fresh",    category: "Trái cây", qty: 320, unit: "kg", revenue: 45600000, img: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=80&h=80&fit=crop" },
  { id: 3, name: "Cà rốt Đà Lạt",        supplier: "Green Valley",    category: "Củ quả",   qty: 280, unit: "kg", revenue: 8200000,  img: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=80&h=80&fit=crop" },
  { id: 4, name: "Bơ Booth 034",          supplier: "Tây Nguyên Farm", category: "Trái cây", qty: 190, unit: "kg", revenue: 28500000, img: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=80&h=80&fit=crop" },
];

const STAT_CARDS = [
  { key: "revenue",   label: "Doanh thu",    value: "120.500.000₫", delta: 12,  icon: BadgeDollarSign, iconCls: "text-emerald-700", bgCls: "bg-emerald-50" },
  { key: "orders",    label: "Đơn hàng",     value: "1.240",         delta: 8.5, icon: ShoppingBag,     iconCls: "text-blue-600",    bgCls: "bg-blue-50"    },
  { key: "products",  label: "Sản phẩm",     value: "850",           delta: 4.2, icon: Package,         iconCls: "text-violet-600",  bgCls: "bg-violet-50"  },
  { key: "suppliers", label: "Đại lý", value: "120",           delta: 2.1, icon: Users,           iconCls: "text-amber-600",   bgCls: "bg-amber-50"   },
 ];

const CATEGORY_STYLE = {
  "Rau củ":   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Trái cây": "bg-amber-50   text-amber-700   border border-amber-200",
  "Củ quả":   "bg-orange-50  text-orange-700  border border-orange-200",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtPrice = (n) => n.toLocaleString("vi-VN") + "₫";
const fmtShort = (n) =>
  n >= 1e9 ? (n / 1e9).toFixed(1) + " tỷ"
  : n >= 1e6 ? (n / 1e6).toFixed(0) + " tr"
  : n.toLocaleString("vi-VN");

// ─── SVG AREA / LINE CHART ────────────────────────────────────────────────────
function AreaLineChart({ data, mode = "area" }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const W = 560, H = 180, PL = 44, PR = 12, PT = 10, PB = 32;
  const cW = W - PL - PR, cH = H - PT - PB;

  const vals = data.map(d => d.value);
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const toX = (i) => PL + (i / (data.length - 1)) * cW;
  const toY = (v) => PT + cH - ((v - minV) / range) * cH;

  // smooth path via cardinal spline
  const points = data.map((d, i) => [toX(i), toY(d.value)]);
  const linePath = points.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`;
    const [px, py] = points[i - 1];
    const cpx = (px + x) / 2;
    return `${acc} C ${cpx},${py} ${cpx},${y} ${x},${y}`;
  }, "");
  const areaPath = `${linePath} L ${points[points.length-1][0]},${PT + cH} L ${PL},${PT + cH} Z`;

  // y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => minV + t * range);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ overflow: "visible" }}
      onMouseLeave={() => setHoverIdx(null)}>
      <defs>
        <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#52B788" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#52B788" stopOpacity="0.01" />
        </linearGradient>
        <clipPath id="chartClip">
          <rect x={PL} y={PT} width={cW} height={cH} />
        </clipPath>
      </defs>

      {/* Y gridlines + labels */}
      {yTicks.map((v, i) => {
        const y = toY(v);
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={PL + cW} y2={y} stroke="#F3F4F6" strokeWidth="1" />
            <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{fmtShort(v)}</text>
          </g>
        );
      })}

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="#9CA3AF">{d.date}</text>
      ))}

      {/* Area fill */}
      {mode === "area" && (
        <path d={areaPath} fill="url(#aGrad)" clipPath="url(#chartClip)" />
      )}

      {/* Line */}
      <path d={linePath} fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinejoin="round" clipPath="url(#chartClip)" />

      {/* Hover zones + dots */}
      {data.map((d, i) => {
        const x = toX(i), y = toY(d.value);
        const isHov = hoverIdx === i;
        return (
          <g key={i}>
            {/* invisible hit area */}
            <rect
              x={x - cW / data.length / 2} y={PT}
              width={cW / data.length} height={cH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
            {isHov && (
              <>
                <line x1={x} y1={PT} x2={x} y2={PT + cH} stroke="#D1FAE5" strokeWidth="1.5" strokeDasharray="4 3" />
                <circle cx={x} cy={y} r={4} fill="#2D6A4F" stroke="white" strokeWidth="2" />
                {/* Tooltip */}
                <g transform={`translate(${Math.min(x - 36, W - PL - 72)}, ${Math.max(y - 44, PT)})`}>
                  <rect rx="8" ry="8" width="72" height="34" fill="white" stroke="#E5E7EB" strokeWidth="1" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.08))" />
                  <text x="36" y="13" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontWeight="500">{d.date}</text>
                  <text x="36" y="27" textAnchor="middle" fontSize="11" fill="#111827" fontWeight="700">{fmtShort(d.value)}</text>
                </g>
              </>
            )}
            {!isHov && <circle cx={x} cy={y} r={2.5} fill="#2D6A4F" />}
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG BAR CHART ────────────────────────────────────────────────────────────
function BarChartSvg({ data }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const W = 260, H = 160, PL = 28, PR = 8, PT = 8, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxV = Math.max(...data.map(d => d.count));
  const barW = (cW / data.length) * 0.5;
  const gap  = cW / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ overflow: "visible" }}
      onMouseLeave={() => setHoverIdx(null)}>

      {/* Y gridlines */}
      {[0, 0.5, 1].map((t, i) => {
        const y = PT + cH - t * cH;
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={PL + cW} y2={y} stroke="#F3F4F6" strokeWidth="1" />
            <text x={PL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9CA3AF">{Math.round(maxV * t)}</text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const x    = PL + i * gap + gap / 2 - barW / 2;
        const barH = (d.count / maxV) * cH;
        const y    = PT + cH - barH;
        const isHov = hoverIdx === i;
        const isTop = d.day === "T5";
        return (
          <g key={i} onMouseEnter={() => setHoverIdx(i)}>
            {/* hover bg */}
            <rect x={PL + i * gap + gap * 0.05} y={PT} width={gap * 0.9} height={cH} fill={isHov ? "#F9FAFB" : "transparent"} rx="4" />
            {/* bar */}
            <rect x={x} y={y} width={barW} height={barH}
              fill={isTop ? "#2D6A4F" : isHov ? "#52B788" : "#D8F3DC"}
              rx="4" style={{ transition: "fill 0.15s" }} />
            {/* x label */}
            <text x={PL + i * gap + gap / 2} y={H - 4} textAnchor="middle" fontSize="9" fill={isTop ? "#2D6A4F" : "#9CA3AF"} fontWeight={isTop ? "700" : "400"}>{d.day}</text>
            {/* value tooltip */}
            {isHov && (
              <g transform={`translate(${PL + i * gap + gap / 2 - 18}, ${y - 30})`}>
                <rect rx="6" ry="6" width="36" height="22" fill="white" stroke="#E5E7EB" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))" />
                <text x="18" y="15" textAnchor="middle" fontSize="10" fill="#111827" fontWeight="700">{d.count}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG DONUT CHART ──────────────────────────────────────────────────────────
function DonutChart({ data, total }) {
  const R = 68, r = 48, cx = 90, cy = 90;
  let startAngle = -Math.PI / 2;

  const slices = data.map(d => {
    const angle = (d.value / 100) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(startAngle + angle);
    const y2 = cy + R * Math.sin(startAngle + angle);
    const ix1 = cx + r * Math.cos(startAngle);
    const iy1 = cy + r * Math.sin(startAngle);
    const ix2 = cx + r * Math.cos(startAngle + angle);
    const iy2 = cy + r * Math.sin(startAngle + angle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`;
    startAngle += angle;
    return { ...d, path };
  });

  return (
    <svg viewBox="0 0 180 180" className="w-40 h-40">
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} className="transition-opacity hover:opacity-80" />
      ))}
      {/* gap rings */}
      <circle cx={cx} cy={cy} r={r - 1} fill="white" />
      {/* center text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#111827">{total}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="9" fontWeight="600" fill="#9CA3AF" letterSpacing="0.05em">TỔNG ĐƠN</text>
    </svg>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [chartMode, setChartMode]       = useState("area");
  const [periodFilter, setPeriodFilter] = useState("month");

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <SupplierPageHeader
        title="Tổng quan"
        description="Theo dõi hiệu quả kinh doanh và hoạt động của hệ thống"
      />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-white text-xs font-semibold">
              {[{ key: "week", label: "Tuần này" }, { key: "month", label: "Tháng này" }, { key: "year", label: "Năm nay" }].map(o => (
                <button key={o.key} onClick={() => setPeriodFilter(o.key)}
                  className={`px-3 py-2 transition-colors ${periodFilter === o.key ? "bg-emerald-800 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}>
                  {o.label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-xl bg-white text-xs font-semibold text-neutral-600 hover:border-neutral-300 transition-colors">
              <SlidersHorizontal size={13} /> Lọc dữ liệu
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAT_CARDS.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.key} className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bgCls}`}>
                    <Icon size={17} className={card.iconCls} />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wide font-medium">{card.label}</p>
                  <p className="text-lg font-extrabold text-gray-900 leading-tight mt-0.5">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <SectionHeader
              icon={<TrendingUp size={15} className="text-emerald-700" />}
              title="Biểu đồ doanh thu"
              subtitle="Thống kê theo thời gian (30 ngày gần nhất)"
              action={
                <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden text-xs font-semibold">
                  {["area", "line"].map(m => (
                    <button key={m} onClick={() => setChartMode(m)}
                      className={`px-3 py-1.5 transition-colors ${chartMode === m ? "bg-emerald-800 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}>
                      {m === "area" ? "Area" : "Line"}
                    </button>
                  ))}
                </div>
              }
            />
            <div className="px-4 py-5" style={{ height: 230 }}>
              <AreaLineChart data={REVENUE_DATA} mode={chartMode} />
            </div>
          </div>

          {/* Donut */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col">
            <SectionHeader
              icon={<ShoppingBag size={15} className="text-emerald-700" />}
              title="Trạng thái đơn hàng"
              subtitle="Tháng này"
            />
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-5 gap-5">
              <DonutChart data={ORDER_STATUS} total="1.240" />
              <div className="w-full flex flex-col gap-2.5">
                {ORDER_STATUS.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-sm text-neutral-600">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Weekly bar */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <SectionHeader
              icon={<Package size={15} className="text-emerald-700" />}
              title="Số lượng đơn hàng"
              subtitle="Theo tuần"
            />
            <div className="px-4 py-5" style={{ height: 200 }}>
              <BarChartSvg data={ORDER_WEEK} />
            </div>
          </div>

          {/* Top products */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col">
            <SectionHeader
              icon={<BadgeDollarSign size={15} className="text-emerald-700" />}
              title="Sản phẩm bán chạy"
              action={
                <button className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
                  Xem tất cả <ChevronRight size={13} />
                </button>
              }
            />
            {/* Table head */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_36px] gap-2 px-6 py-2.5 border-b border-neutral-100">
              {["Sản phẩm", "Phân loại", "Số lượng", "Doanh thu", ""].map((h, i) => (
                <span key={i} className={`text-[11px] font-semibold text-neutral-400 uppercase tracking-wide ${i === 2 || i === 3 ? "text-right" : ""}`}>{h}</span>
              ))}
            </div>
            <div className="divide-y divide-neutral-100 flex-1">
              {TOP_PRODUCTS.map(p => (
                <div key={p.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_36px] gap-2 items-center px-6 py-3.5 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.img} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-neutral-100" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{p.supplier}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full w-fit ${CATEGORY_STYLE[p.category] ?? "bg-neutral-100 text-neutral-600"}`}>
                    {p.category}
                  </span>
                  <p className="text-sm font-medium text-gray-800 text-right">{p.qty} {p.unit}</p>
                  <p className="text-sm font-bold text-emerald-700 text-right">{fmtPrice(p.revenue)}</p>
                  <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
                    <Eye size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}