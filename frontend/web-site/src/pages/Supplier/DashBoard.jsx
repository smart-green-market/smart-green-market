import { useState, useEffect, useMemo } from "react";
import { orderService, parseOrderList } from "../../services/api/orderService";
import { NavLink, Link } from "react-router-dom";
// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtMoney = (n) => {
  const num = parseFloat(n) || 0;
  if (num >= 1e9) return (num / 1e9).toFixed(1) + " tỷ";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "tr";
  if (num >= 1e3) return Math.round(num / 1e3) + "k";
  return num.toLocaleString("vi-VN");
};

const fmtDate = (str) => {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function getLiveDate() {
  const d = new Date();
  const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  return `${days[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1} · ${d.getFullYear()}`;
}

// Map API status → display label + pill style
const STATUS_CONFIG = {
  pending_supplier_confirmation: { label: "Chờ duyệt", cls: "pill-blue" },
  pending: { label: "Chờ duyệt", cls: "pill-blue" },
  confirmed: { label: "Đã duyệt", cls: "pill-green" },
  rejected: { label: "Đã từ chối", cls: "pill-red" },
  deposit_pending: { label: "Chờ cọc", cls: "pill-amber" },
  deposit_pending_verification: { label: "Chờ xác nhận cọc", cls: "pill-amber" },
  processing: { label: "Đang xử lý", cls: "pill-blue" },
  shipping: { label: "Đang giao", cls: "pill-amber" },
  final_payment_pending: { label: "Chờ TT cuối", cls: "pill-amber" },
  final_payment_pending_verification: { label: "Chờ xác nhận TT", cls: "pill-amber" },
  completed: { label: "Hoàn thành", cls: "pill-green" },
  cancelled: { label: "Đã hủy", cls: "pill-gray" },
};

const ACTIVE_STATUSES = new Set(["pending_supplier_confirmation", "pending", "shipping"]);

// ─── SPARKLINE DATA (mock revenue 6 months) ───────────────────────────────────
const REVENUE_DATA = [
  { label: "T1", val: 8.2 },
  { label: "T2", val: 7.5 },
  { label: "T3", val: 9.8 },
  { label: "T4", val: 10.4 },
  { label: "T5", val: 10.5 },
  { label: "T6", val: 12.4 },
];

// ─── TOP PRODUCTS (mock) ──────────────────────────────────────────────────────
const TOP_PRODUCTS = [
  { name: "Rau cải thìa hữu cơ", pct: 88 },
  { name: "Cà chua bi Đà Lạt", pct: 72 },
  { name: "Dâu tây hữu cơ", pct: 60 },
  { name: "Súp lơ xanh sạch", pct: 45 },
];

// ─── SPARKLINE CHART ──────────────────────────────────────────────────────────
function Sparkline({ data }) {
  const max = Math.max(...data.map((d) => d.val));
  return (
    <div className="spk">
      {data.map((d, i) => {
        const h = Math.round((d.val / max) * 44) + 8;
        const isHi = i === data.length - 1;
        return (
          <div key={i} className="spk-col">
            <div
              className={`spk-bar${isHi ? " hi" : ""}`}
              style={{ height: h }}
              title={`${d.label}: ${d.val}tr đ`}
            />
            <span className="spk-lbl">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── STATUS PILL ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "pill-gray" };
  return <span className={`pill ${cfg.cls}`}>{cfg.label}</span>;
}

// ─── ORDER ROW ────────────────────────────────────────────────────────────────
function OrderRow({ order }) {
  const code = order.order_code ?? order.id ?? "—";
  const date = fmtDate(order.created_at ?? order.order_date);
  const items = order.items ?? [];
  const itemSummary = items.length
    ? items.map((it) => `${it.product_name ?? "SP"} x${it.quantity ?? 1}`).join(", ")
    : order.items_summary ?? "—";
  const total = order.total_amount ?? order.total ?? order.amount ?? 0;
  const qty = items.reduce((s, it) => s + (parseInt(it.quantity) || 0), 0) || order.total_items || "—";
  const buyer = order.dealer_name ?? order.store_name ?? order.buyer_name ?? order.customer_name ?? "—";

  return (
    <div className="plr">
      <div className="oc-id">
        <div className="o-code">{code}</div>
        <div className="o-date">{date}</div>
      </div>
      <div className="oc-cust">{buyer}</div>
      <div className="oc-items">{itemSummary}</div>
      <div className="oc-qty">{qty}</div>
      <div className="oc-amt">{fmtMoney(total)}</div>
      <div className="oc-status">
        <StatusPill status={order.status} />
      </div>
      <div className="oc-act">
        <div className="p-actions">
          <button className="p-act" title="Xem chi tiết">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
// Các status KHÔNG được tính vào đơn hàng tháng
const EXCLUDED_STATUSES = new Set([
  "pending_supplier_confirmation",
  "cancelled",
  "rejected",
]);

export default function DashboardPage() {
  const [liveDate, setLiveDate] = useState(getLiveDate());
  const [allOrders, setAllOrders] = useState([]); // toàn bộ — để count
  const [orders, setOrders] = useState([]); // pending + shipping — để hiển thị
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setLiveDate(getLiveDate()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    orderService
      .getAll()
      .then((data) => {
        if (cancelled) return;
        const list = parseOrderList(data);
        setAllOrders(list);                                              // ← lưu toàn bộ
        setOrders(list.filter((o) => ACTIVE_STATUSES.has(o.status)));   // ← chỉ active
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Không thể tải đơn hàng");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const pendingCount = orders.filter((o) => o.status === "pending_supplier_confirmation" || o.status === "pending").length;
  const shippingCount = orders.filter((o) => o.status === "shipping").length;

  const count_order_month = useMemo(() => {
    const now = new Date();
    return allOrders.filter((o) => {
      if (EXCLUDED_STATUSES.has(o.status)) return false;
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [allOrders]);

  return (
    <>
      <style>{`
        /* ── Design tokens (match supplier_dashboard_v2.html) ── */
        :root {
          --bg:       #f3f4f6;
          --surface:  #ffffff;
          --surface2: #f9fafb;
          --border:   #e5e7eb;
          --text1:    #111827;
          --text2:    #565f6b;
          --text3:    #80899a;
          --green9:   #0f3d20;
          --green8:   #1a5c2a;
          --green7:   #166534;
          --green3:   #6ee7b7;
          --green1:   #d1fae5;
          --green0:   #EAF3DE;
          --amber0:   #FAEEDA;
          --amber8:   #854F0B;
          --blue0:    #E6F1FB;
          --blue8:    #185FA5;
          --purple0:  #EEEDFE;
          --purple8:  #534AB7;
          --red0:     #FCEBEB;
          --red8:     #A32D2D;
          --white1:     white;
        }

        /* ── Banner ── */
        .db-banner {
          background: var(--green9);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .db-banner-greeting { font-size: 11px; color: white; margin-bottom: 3px; }
        .db-banner-title    { font-size: 17px; font-weight: 500; color: var(--green1); }
        .db-banner-sub      { font-size: 12px; color: white; margin-top: 3px; }
        .db-banner-stats    { display: flex; gap: 8px; }
        .bstat {
          background: var(--green8);
          border-radius: 10px;
          padding: 9px 16px;
          text-align: center;
          min-width: 64px;
        }
        .bstat-val   { font-size: 20px; font-weight: 500; color: var(--white1); }
        .bstat-label { font-size: 10px; color: white; margin-top: 2px; }

        /* ── Metric cards ── */
        .db-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 10px;
        }
        .mc {
          background: var(--surface);
          border: 0.5px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
        }
        .mc-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .mc-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .mc-icon.g { background: var(--green0); color: #3B6D11; }
        .mc-icon.a { background: var(--amber0); color: var(--amber8); }
        .mc-icon.b { background: var(--blue0);  color: var(--blue8);  }
        .mc-icon.p { background: var(--purple0);color: var(--purple8);}
        .mc-delta { font-size: 10px; padding: 2px 7px; border-radius: 20px; font-weight: 500; }
        .mc-delta.up  { background: var(--green0); color: #3B6D11; }
        .mc-delta.neu { background: #f3f4f6; color: var(--text2); }
        .mc-val   { font-size: 24px; font-weight: 500; color: var(--text1); line-height: 1; }
        .mc-label { font-size: 11px; color: var(--text3); margin-top: 4px; }

        /* ── Two column ── */
        .db-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ── Cards ── */
        .card {
          background: var(--surface);
          border: 0.5px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }
        .ch {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 0.5px solid var(--border);
        }
        .ch-left { display: flex; align-items: center; gap: 8px; }
        .ch-ico {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
        }
        .ch-ico.g { background: var(--green0); color: #3B6D11; }
        .ch-ico.a { background: var(--amber0); color: var(--amber8); }
        .ch-ico.b { background: var(--blue0);  color: var(--blue8); }
        .ch-title { font-size: 13px; font-weight: 500; color: var(--text1); }
        .ch-link  { font-size: 11px; color: var(--green8); cursor: pointer; }
        .cb { padding: 0 16px; }

        /* ── Recent order rows ── */
        .or {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 0; border-bottom: 0.5px solid var(--border);
        }
        .or:last-child { border: none; }
        .or-info { flex: 1; min-width: 0; }
        .or-code { font-size: 12px; font-weight: 500; color: var(--text1); white-space: nowrap; }
        .or-dealer { font-size: 10px; color: var(--text3); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .or-amt  { font-size: 12px; font-weight: 500; color: var(--text1); white-space: nowrap; flex-shrink: 0; text-align: right; }

        /* ── Pills ── */
        .pill {
          display: inline-flex; align-items: center;
          padding: 2px 8px; border-radius: 20px;
          font-size: 10px; font-weight: 500; white-space: nowrap; flex-shrink: 0;
        }
        .pill-green  { background: var(--green0); color: #3B6D11; }
        .pill-amber  { background: var(--amber0); color: var(--amber8); }
        .pill-blue   { background: var(--blue0);  color: var(--blue8); }
        .pill-gray   { background: #f3f4f6;        color: var(--text2); }
        .pill-red    { background: var(--red0);    color: var(--red8); }

        /* ── Sparkline ── */
        .spk { display: flex; align-items: flex-end; gap: 5px; padding: 12px 16px 10px; }
        .spk-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
        .spk-bar {
          width: 100%; border-radius: 3px 3px 0 0;
          background: var(--green0); transition: background .12s; cursor: pointer;
        }
        .spk-bar:hover { background: #3B6D11; }
        .spk-bar.hi    { background: var(--green8); }
        .spk-lbl { font-size: 9px; color: var(--text3); }

        /* ── Progress bars (top products) ── */
        .pr {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 0; border-bottom: 0.5px solid var(--border);
        }
        .pr:last-child { border: none; }
        .pr-name  { font-size: 12px; color: var(--text1); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pr-track { flex: 1; height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
        .pr-fill  { height: 100%; border-radius: 2px; background: var(--green8); }
        .pr-pct   { font-size: 11px; color: var(--text3); width: 28px; text-align: right; flex-shrink: 0; }

        /* ── Orders table ── */
        .db-orders-card { margin-top: 2px; }
        .pl-wrap { overflow-x: auto; }
        .plh, .plr {
          display: flex; align-items: center; gap: 10px;
          min-width: 780px; padding: 0 16px;
        }
        .plh {
          padding: 10px 16px;
          font-size: 10px; color: var(--text3);
          text-transform: uppercase; letter-spacing: .6px;
          border-bottom: 0.5px solid var(--border);
        }
        .plr {
          padding: 10px 16px;
          border-bottom: 0.5px solid var(--border);
          transition: background .1s;
        }
        .plr:last-child { border: none; }
        .plr:hover { background: var(--surface2); }

        .oc-id     { width: 180px; flex-shrink: 0; }
        .oc-cust   { width: 140px; flex-shrink: 0; font-size: 12px; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .oc-items  { flex: 1; min-width: 0; font-size: 12px; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .oc-qty    { width: 32px; flex-shrink: 0; font-size: 12px; color: var(--text2); text-align: center; }
        .oc-amt    { width: 72px; flex-shrink: 0; font-size: 12px; font-weight: 500; color: var(--text1); text-align: right; }
        .oc-status { width: 110px; flex-shrink: 0; text-align: center; }
        .oc-act    { width: 36px; flex-shrink: 0; text-align: right; }

        .o-code { font-size: 12px; font-weight: 500; color: var(--text1); white-space: nowrap; }
        .o-date { font-size: 10px; color: var(--text3); margin-top: 1px; }

        .p-actions { display: flex; gap: 3px; justify-content: flex-end; }
        .p-act {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text3); cursor: pointer; border: 0.5px solid transparent;
          background: transparent; transition: background .1s, border-color .1s;
        }
        .p-act:hover { background: var(--surface2); border-color: var(--border); color: var(--text2); }

        /* ── Empty / loading state ── */
        .db-empty {
          padding: 28px 16px;
          text-align: center;
          font-size: 12px;
          color: var(--text3);
        }
        .db-spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid var(--border);
          border-top-color: var(--green8);
          border-radius: 50%;
          animation: spin .7s linear infinite;
          margin-right: 6px;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Section wrapper ── */
        .db-page {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px 20px;
          background: var(--bg);
          min-height: 100%;
        }

        @media (max-width: 640px) {
          .db-two { grid-template-columns: 1fr; }
          .db-metrics { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="db-page">

        {/* ── BANNER ── */}
        <div className="db-banner">
          <div>
            <div className="db-banner-greeting">{liveDate}</div>
            <div className="db-banner-title">{getGreeting()}, Vườn Nhà Sạch 👋</div>
            <div className="db-banner-sub">
              {loading
                ? "Đang tải đơn hàng…"
                : `Hiện có ${pendingCount} đơn chờ duyệt · ${shippingCount} đơn đang giao`}
            </div>
          </div>
          <div className="db-banner-stats">
            <div className="bstat">
              <div className="bstat-val">{loading ? "…" : pendingCount}</div>
              <div className="bstat-label">Chờ duyệt</div>
            </div>
            <div className="bstat">
              <div className="bstat-val">{loading ? "…" : shippingCount}</div>
              <div className="bstat-label">Đang giao</div>
            </div>
          </div>
        </div>

        {/* ── METRIC CARDS ── */}
        <div className="db-metrics">
          <Link to="/nha-cung-cap/doanh-thu">
            <div className="mc">
              <div className="mc-top">
                <div className="mc-icon g">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                </div>
              </div>
              <div className="mc-val">12.4tr</div>
              <div className="mc-label">Doanh thu tháng 6</div>
            </div>
          </Link>


          <Link to="/nha-cung-cap/don-hang">
            <div className="mc">
              <div className="mc-top">
                <div className="mc-icon a">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="M9 12h6M9 16h4" />
                  </svg>
                </div>
              </div>
              <div className="mc-val">{count_order_month}</div>
              <div className="mc-label">Đơn hàng tháng này</div>
            </div>
          </Link>

          <Link to="/nha-cung-cap/san-pham">
            <div className="mc">
              <div className="mc-top">
                <div className="mc-icon b">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
                  </svg>
                </div>
              </div>
              <div className="mc-val">36</div>
              <div className="mc-label">Sản phẩm đang bán</div>
            </div>
          </Link>

        </div>

        {/* ── TWO COL: Orders + Charts ── */}
        <div className="db-two">

          {/* Left: Active orders from API */}
          <div className="card">
            <div className="ch">
              <div className="ch-left">
                <div className="ch-ico a">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" />
                  </svg>
                </div>
                <span className="ch-title">Đơn cần xử lý</span>
              </div>
              <span className="ch-link">
                <Link to="/nha-cung-cap/don-hang"> {!loading && `${shippingCount} đơn`}</Link>
              </span>
            </div>
            <div className="cb">
              {loading && (
                <div className="db-empty">
                  <span className="db-spinner" />Đang tải…
                </div>
              )}
              {!loading && error && (
                <div className="db-empty" style={{ color: "var(--red8)" }}>
                  {error}
                </div>
              )}
              {!loading && !error && orders.length === 0 && (
                <div className="db-empty">Không có đơn nào cần xử lý.</div>
              )}
              {!loading && !error && orders.map((order) => {
                if (order.status === "pending_supplier_confirmation") {
                  const code = order.order_code ?? order.id ?? "—";
                  const total = order.total_amount ?? order.total ?? order.amount ?? 0;
                  const dealer = order.dealer_name ?? order.store_name ?? order.buyer_name ?? order.customer_name ?? "—";
                  return (
                    <div key={order.id ?? code} className="or">
                      <div className="or-info">
                        <div className="or-code">{code}</div>
                        <div className="or-dealer">{dealer}</div>
                      </div>
                      <StatusPill status={order.status} />
                      <span className="or-amt">{fmtMoney(total)}</span>
                    </div>
                  )
                };
              })}
            </div>
          </div>

          {/* Right: Revenue sparkline + top products */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            <div className="card">
              <div className="ch">
                <div className="ch-left">
                  <div className="ch-ico g">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <span className="ch-title">Doanh thu 6 tháng</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#1a5c2a" }}>12.4tr đ</span>
              </div>
              <Sparkline data={REVENUE_DATA} />
            </div>

            <div className="card" style={{ flex: 1 }}>
              <div className="ch">
                <div className="ch-left">
                  <div className="ch-ico b">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 17 2 2 4-4" /><path d="m3 7 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" />
                    </svg>
                  </div>
                  <span className="ch-title">Sản phẩm bán chạy</span>
                </div>
                <span className="ch-link">Chi tiết →</span>
              </div>
              <div className="cb">
                {TOP_PRODUCTS.map((p) => (
                  <div key={p.name} className="pr">
                    <span className="pr-name">{p.name}</span>
                    <div className="pr-track">
                      <div className="pr-fill" style={{ width: `${p.pct}%` }} />
                    </div>
                    <span className="pr-pct">{p.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── FULL ORDERS TABLE ── */}
        <div className="card db-orders-card">
          <div className="ch">
            <div className="ch-left">
              <div className="ch-ico a">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" />
                </svg>
              </div>
              <span className="ch-title">Danh sách đơn hàng — Chờ duyệt &amp; Đang giao</span>
            </div>
            <span className="ch-link"><Link to="/nha-cung-cap/don-hang"> {!loading && `${orders.length} đơn hàng`} </Link></span>
          </div>
          <div className="pl-wrap">
            <div className="plh">
              <div className="oc-id">Đơn hàng</div>
              <div className="oc-cust">Khách hàng</div>
              <div className="oc-items">Sản phẩm</div>
              <div className="oc-qty">SL</div>
              <div className="oc-amt">Tổng tiền</div>
              <div className="oc-status">Trạng thái</div>
              <div className="oc-act" />
            </div>

            {loading && (
              <div className="db-empty">
                <span className="db-spinner" />Đang tải đơn hàng…
              </div>
            )}
            {!loading && error && (
              <div className="db-empty" style={{ color: "var(--red8)" }}>{error}</div>
            )}
            {!loading && !error && orders.length === 0 && (
              <div className="db-empty">Không có đơn hàng nào cần xử lý.</div>
            )}
            {!loading && !error && orders.map((order) => (
              <OrderRow key={order.id ?? order.order_code} order={order} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
