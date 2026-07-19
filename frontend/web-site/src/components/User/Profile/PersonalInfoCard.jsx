import {
  User,
  Mail,
  Phone,
  ShoppingBag,
  Wallet,
  CalendarDays,
  Star,
  Gift,
  Heart,
  Ticket,
  Package,
  Clock,
  Pencil,
  ChevronRight,
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  formatBuyerDate,
  formatBuyerSpent,
} from "../../../utils/buyerProfileUtils";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";

/* ─── palette (khớp sidebar: bg-emerald-200 text-green-950) ─── */
const C = {
  icon: "text-green-900",
  iconBg: "bg-emerald-100",
  btn: "bg-green-800 hover:bg-green-900",
  accent: "text-green-800",
  hoverBorder: "hover:border-emerald-300",
  hoverBg: "hover:bg-emerald-50",
  statHover: "hover:bg-emerald-50",
  cameraBg: "bg-green-800 hover:bg-green-900",
  avatarBorder: "border-emerald-200",
  avatarBg: "bg-emerald-100",
  headerIcon: "bg-emerald-100",
};

/* ─── helpers ──────────────────────────────────────────── */
function tierStyle(label) {
  if (label.includes("Vàng")) return "bg-yellow-100 text-yellow-800";
  if (label.includes("Bạc")) return "bg-slate-100  text-slate-700";
  if (label.includes("Đồng")) return "bg-orange-100 text-orange-700";
  return "bg-emerald-200 text-green-950"; /* ← khớp sidebar active */
}

const ORDER_STATUS_MAP = {
  delivered: {
    label: "Đã giao thành công",
    cls: "bg-emerald-100 text-green-900",
  },
  completed: { label: "Hoàn thành", cls: "bg-emerald-100 text-green-900" },
  cancelled: { label: "Đã hủy", cls: "bg-red-100 text-red-600" },
  pending: { label: "Chờ xác nhận", cls: "bg-yellow-100 text-yellow-700" },
  processing: { label: "Đang xử lý", cls: "bg-blue-100 text-blue-700" },
  shipping: { label: "Đang giao", cls: "bg-indigo-100 text-indigo-700" },
};

/* ─── InfoCell ─────────────────────────────────────────── */
function InfoCell({
  icon: Icon,
  label,
  value,
  accent = false,
  onClick,
  badge,
  description,
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={[
        "flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-left transition-colors w-full",
        onClick ? `cursor-pointer ${C.hoverBorder} ${C.hoverBg}` : "",
      ].join(" ")}
    >
      <span
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${C.iconBg}`}
      >
        <Icon className={`h-[17px] w-[17px] ${C.icon}`} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[11px] leading-none text-neutral-400">
          {label}
        </span>
        <span
          className={`mt-1 block text-[14px] font-bold leading-snug ${accent ? C.accent : "text-zinc-900"}`}
        >
          {value}
        </span>
        {description && (
          <span className="mt-1 block truncate text-[11px] text-neutral-400">
            {description}
          </span>
        )}
        {badge && (
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}
          >
            {badge.label}
          </span>
        )}
      </span>

      {onClick && (
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-neutral-300" />
      )}
    </Tag>
  );
}

/* ─── QuickStat ────────────────────────────────────────── */
function QuickStat({ icon: Icon, count, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-1.5 py-4 text-center transition-colors ${C.statHover} cursor-pointer`}
    >
      <span className="flex items-center gap-1.5">
        <Icon className={`h-[17px] w-[17px] ${C.icon}`} />
        {count != null && (
          <span className="text-[16px] font-bold text-zinc-900">{count}</span>
        )}
      </span>
      <span className="text-[12px] text-neutral-500 leading-none">{label}</span>
    </button>
  );
}

/* ─── Main ─────────────────────────────────────────────── */
export default function PersonalInfoCard({
  profile,
  loyaltyScore,
  loyaltyLoading = false,
  completedOrders = null,
  ordersLoading = false,
  onEdit,
  onOpenLoyaltyTiers,
}) {
  const navigate = useNavigate();
  const paths = useStorefrontPaths();

  const avatar = profile?.user?.avatar_url || null;
  const fullName = profile?.user?.full_name || "—";
  const email = profile?.user?.email || "—";
  const phone = profile?.user?.phone || "—";
  const tier = loyaltyScore?.current_tier?.name || "Khách hàng";
  const joinedAt = formatBuyerDate(profile?.created_at);
  const lastOrderDate = formatBuyerDate(profile?.last_order_at);
  const lastStatus = profile?.last_order_status ?? null;
  const totalOrders = profile?.total_orders ?? 0;
  const totalSpent = formatBuyerSpent(profile?.total_spent);
  const loyaltyPoints =
    loyaltyScore?.loyalty_points ?? profile?.loyalty_points ?? 0;
  const loyalty = Number(loyaltyPoints).toLocaleString("vi-VN");
  const loyaltyHint = loyaltyScore?.next_tier
    ? `Còn ${Number(loyaltyScore.remaining_points ?? loyaltyScore.next_tier.remaining_points ?? 0).toLocaleString("vi-VN")} điểm để lên ${loyaltyScore.next_tier.name}`
    : "Xem quyền lợi các cấp bậc";
  const inDelivery = profile?.in_delivery_count ?? null;
  const wishlist = profile?.wishlist_count ?? null;
  const vouchers = profile?.voucher_count ?? null;

  const lastBadge = lastStatus
    ? (ORDER_STATUS_MAP[lastStatus] ?? {
        label: lastStatus,
        cls: "bg-gray-100 text-gray-600",
      })
    : null;

  const toOrders = () => navigate(`${paths.account}/lich-su-don-hang`);
  const toVoucher = () => navigate(`${paths.account}/vouchers`);
  const toLoyaltyHistory = () => navigate(`${paths.account}/lich-su-diem`);

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
      {/* ══ HEADER ══════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full ${C.headerIcon}`}
          >
            <User className={`h-5 w-5 ${C.icon}`} />
          </span>
          <div>
            <h2 className="text-[17px] font-bold text-zinc-900">
              Thông tin cá nhân
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Quản lý thông tin tài khoản và theo dõi hoạt động của bạn.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl ${C.btn} px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Chỉnh sửa hồ sơ
        </button>
      </div>

      {/* ══ BODY ════════════════════════════════════════ */}
      <div className="px-6 py-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* ── Avatar column ──────────────────────── */}
          <div className="flex flex-col items-center gap-2 md:w-44 flex-shrink-0">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={fullName}
                  className={`h-[112px] w-[112px] rounded-full border-4 ${C.avatarBorder} object-cover`}
                />
              ) : (
                <div
                  className={`flex h-[112px] w-[112px] items-center justify-center rounded-full border-4 ${C.avatarBorder} ${C.avatarBg}`}
                >
                  <User className="h-12 w-12 text-emerald-300" />
                </div>
              )}
              <button
                type="button"
                onClick={onEdit}
                title="Đổi ảnh đại diện"
                className={`absolute bottom-1 right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ${C.cameraBg} text-white ring-2 ring-white shadow transition-colors`}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-[15px] font-bold text-zinc-900 text-center">
              {fullName}
            </p>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold ${tierStyle(tier)}`}
            >
              <User className="h-3 w-3" />
              {tier}
            </span>

            <p className="text-[12px] text-neutral-400">
              Thành viên từ {joinedAt}
            </p>
          </div>

          {/* ── Info grid ──────────────────────────── */}
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoCell icon={User} label="Họ tên" value={fullName} />
            <InfoCell icon={Mail} label="Email" value={email} />
            <InfoCell icon={Phone} label="Số điện thoại" value={phone} />
            <InfoCell
              icon={ShoppingBag}
              label="Đơn hàng hoàn thành"
              value={
                ordersLoading
                  ? "Đang tải..."
                  : `${completedOrders ?? 0} đơn hàng`
              }
              onClick={toOrders}
            />
            <InfoCell
              icon={Wallet}
              label="Tổng chi tiêu"
              value={totalSpent}
              accent
              onClick={toOrders}
            />
            <InfoCell
              icon={CalendarDays}
              label="Đơn gần nhất"
              value={lastOrderDate}
              onClick={toOrders}
              badge={lastBadge}
            />
            <InfoCell
              icon={Star}
              label="Cấp bậc"
              value={loyaltyLoading ? "Đang tải..." : tier}
              description={
                loyaltyLoading ? "Đang đồng bộ hạng thành viên" : loyaltyHint
              }
              onClick={onOpenLoyaltyTiers}
            />
            <InfoCell
              icon={Gift}
              label="Điểm tích lũy"
              value={loyaltyLoading ? "Đang tải..." : `${loyalty} điểm`}
              description="Xem lịch sử cộng và trừ điểm"
              onClick={toLoyaltyHistory}
            />
          </div>
        </div>
      </div>

      {/* ══ QUICK-STATS BAR ═════════════════════════════ */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100 bg-white">
        <QuickStat
          icon={Heart}
          count={wishlist}
          label="Sản phẩm yêu thích"
          onClick={() => {}}
        />
        <QuickStat
          icon={Ticket}
          count={vouchers}
          label="Voucher của tôi"
          onClick={toVoucher}
        />
        <QuickStat
          icon={Package}
          count={inDelivery}
          label="Đang giao"
          onClick={() => navigate(`${paths.orderStatus}?status=shipping`)}
        />
        <QuickStat
          icon={Clock}
          count={null}
          label="Xem đơn hàng"
          onClick={toOrders}
        />
      </div>
    </section>
  );
}
