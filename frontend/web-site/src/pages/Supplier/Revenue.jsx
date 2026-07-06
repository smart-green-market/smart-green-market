import { useState } from 'react';
import { PageSpinner } from '../../components/Supplier/UI/SupplierSpinner';
import useRevenueStats from '../../hooks/useRevenueStats';

import RevenueToolbar from '../../components/Supplier/Revenue/RevenueToolbar';
import RevenueMetrics from '../../components/Supplier/Revenue/RevenueMetrics';
import RevenueTimeChart from '../../components/Supplier/Revenue/RevenueTimeChart';
import RevenueStatusBreakdown from '../../components/Supplier/Revenue/RevenueStatusBreakdown';
import RevenueByCategory from '../../components/Supplier/Revenue/RevenueByCategory';
import RevenueTopProducts from '../../components/Supplier/Revenue/RevenueTopProducts';
import RevenuePeriodTable from '../../components/Supplier/Revenue/RevenuePeriodTable';
import ExportRevenueReportModal from '../../components/Supplier/Revenue/ExportRevenueReportModal';

import '../../components/Supplier/Revenue/revenue.css';

/**
 * Trang "Doanh thu" (Supplier).
 * Tách ra từ supplier_dashboard_v2.html — giữ nguyên giao diện,
 * chuyển phần render bằng innerHTML/vanilla JS sang component React
 * và thay dữ liệu mẫu bằng API thật qua useRevenueStats.
 */
export default function RevenuePage(){
  const [period, setPeriod] = useState('day'); // 'day' | 'month' | 'year'
  const [exportOpen, setExportOpen] = useState(false);

  const { data: revenueStats, loading, error, refetch } = useRevenueStats(period);

  return (
    <div className="revenue-page">
      <RevenueToolbar
        period={period}
        onChangePeriod={setPeriod}
        onOpenExport={() => setExportOpen(true)}
      />

      {loading && (
        <PageSpinner />
      )}

      {!loading && error && (
        <div className="state-box">
          <i className="ti ti-alert-circle" style={{ fontSize: 22, color: 'var(--red8)' }} />
          Không tải được dữ liệu doanh thu.
          <button className="btn-ghost" onClick={refetch}>
            <i className="ti ti-refresh" />
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && revenueStats && (
        <>
          <RevenueMetrics revenueStats={revenueStats} />

          <div className="two">
            <RevenueTimeChart period={period} revenueStats={revenueStats} />
            <RevenueStatusBreakdown revenueStats={revenueStats} />
          </div>

          <div className="two">
            <RevenueByCategory revenueStats={revenueStats} />
            <RevenueTopProducts period={period} revenueStats={revenueStats} />
          </div>

          <RevenuePeriodTable revenueStats={revenueStats} />
        </>
      )}

      <ExportRevenueReportModal
        open={exportOpen}
        period={period}
        revenueStats={revenueStats}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
