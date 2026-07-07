import { fmtMoney } from './revenueHelpers';

/**
 * RevenueMetrics — 2 cụm KPI cards:
 *  ① Dòng Tiền: Tổng Tiền Vào (xanh lá), Tổng Tiền Hoàn (đỏ), Dòng Tiền Ròng (xanh dương)
 *  ② Doanh Thu: Doanh Thu Gộp (xanh lá), Hàng Bị Trả Lại (cam), Doanh Thu Thuần (tím)
 */
export default function RevenueMetrics({ revenueStats }) {
  const {
    totalCashIn = 0,
    totalRefund = 0,
    netCashFlow = 0,
    grossRevenue = 0,
    returnedAmount = 0,
    netRevenue = 0,
  } = revenueStats || {};

  return (
    <div className="rev-kpi-wrapper">
      {/* ── Cụm 1: Dòng Tiền ── */}
      <div className="rev-kpi-section">
        <div className="rev-kpi-header">
          <i className="ti ti-arrows-exchange" />
          <span>Dòng Tiền</span>
        </div>
        <div className="rev-kpi-cards">
          <div className="rev-kpi-card">
            <div className="rev-kpi-icon g">
              <i className="ti ti-arrow-down-left" />
            </div>
            <div className="rev-kpi-info">
              <div className="rev-kpi-val">{fmtMoney(totalCashIn)}</div>
              <div className="rev-kpi-label">Tổng Tiền Vào</div>
            </div>
          </div>

          <div className="rev-kpi-card">
            <div className="rev-kpi-icon r">
              <i className="ti ti-arrow-up-right" />
            </div>
            <div className="rev-kpi-info">
              <div className="rev-kpi-val">{fmtMoney(totalRefund)}</div>
              <div className="rev-kpi-label">Tổng Tiền Hoàn</div>
            </div>
          </div>

          <div className="rev-kpi-card highlight-blue">
            <div className="rev-kpi-icon b">
              <i className="ti ti-arrows-diff" />
            </div>
            <div className="rev-kpi-info">
              <div className="rev-kpi-val">{fmtMoney(netCashFlow)}</div>
              <div className="rev-kpi-label">Dòng Tiền Ròng</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cụm 2: Doanh Thu ── */}
      <div className="rev-kpi-section">
        <div className="rev-kpi-header">
          <i className="ti ti-report-money" />
          <span>Doanh Thu</span>
        </div>
        <div className="rev-kpi-cards">
          <div className="rev-kpi-card">
            <div className="rev-kpi-icon g">
              <i className="ti ti-shopping-cart-check" />
            </div>
            <div className="rev-kpi-info">
              <div className="rev-kpi-val">{fmtMoney(grossRevenue)}</div>
              <div className="rev-kpi-label">Doanh Thu Gộp</div>
            </div>
          </div>

          <div className="rev-kpi-card">
            <div className="rev-kpi-icon a">
              <i className="ti ti-receipt-refund" />
            </div>
            <div className="rev-kpi-info">
              <div className="rev-kpi-val">{fmtMoney(returnedAmount)}</div>
              <div className="rev-kpi-label">Hàng Bị Trả Lại</div>
            </div>
          </div>

          <div className="rev-kpi-card highlight-purple">
            <div className="rev-kpi-icon p">
              <i className="ti ti-currency-dong" />
            </div>
            <div className="rev-kpi-info">
              <div className="rev-kpi-val">{fmtMoney(netRevenue)}</div>
              <div className="rev-kpi-label">Doanh Thu Thuần</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
