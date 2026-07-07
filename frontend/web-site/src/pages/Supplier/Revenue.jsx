import { useState, useCallback } from 'react';
import useRevenueStats from '../../hooks/useRevenueStats';
import { getFirstDayOfMonth, getToday } from '../../components/Supplier/Revenue/revenueHelpers';

import RevenueToolbar from '../../components/Supplier/Revenue/RevenueToolbar';
import RevenueMetrics from '../../components/Supplier/Revenue/RevenueMetrics';
import RevenueChart from '../../components/Supplier/Revenue/RevenueChart';
import ExportRevenueReportModal from '../../components/Supplier/Revenue/ExportRevenueReportModal';

import '../../components/Supplier/Revenue/revenue.css';

/**
 * Trang "Doanh thu" (Supplier).
 * Layout 3 phần:
 *  ① Bộ lọc (Date Range + Group By + nút Thống kê)
 *  ② KPI Cards — 2 cụm: Dòng Tiền & Doanh Thu
 *  ③ Biểu đồ cột ghép — Dòng Tiền Ròng vs Doanh Thu Thuần
 */
export default function RevenuePage() {
  // ── Filter state (controlled inputs) ──
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getToday());
  const [groupBy, setGroupBy] = useState('day');

  // ── Applied filters (only change when "Thống kê" is clicked) ──
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getToday(),
    groupBy: 'day',
  });

  const [exportOpen, setExportOpen] = useState(false);

  // ── Data fetch ──
  const { data: revenueStats, loading, error, refetch } = useRevenueStats(appliedFilters);

  const handleApplyFilter = useCallback(() => {
    setAppliedFilters({ startDate, endDate, groupBy });
  }, [startDate, endDate, groupBy]);

  return (
    <div className="revenue-page">
      {/* ── Phần 1: Bộ lọc ── */}
      <RevenueToolbar
        startDate={startDate}
        endDate={endDate}
        groupBy={groupBy}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onGroupByChange={setGroupBy}
        onApplyFilter={handleApplyFilter}
        onOpenExport={() => setExportOpen(true)}
      />

      {/* ── Loading state ── */}
      {loading && (
        <div className="state-box">
          <i className="ti ti-loader-2 rev-spin" style={{ fontSize: 22 }} />
          Đang tải dữ liệu doanh thu...
        </div>
      )}

      {/* ── Error state ── */}
      {!loading && error && (
        <div className="state-box">
          <i className="ti ti-alert-circle" style={{ fontSize: 22, color: 'var(--red8)' }} />
          Không tải được dữ liệu doanh thu.
          <button className="rev-btn-export" onClick={refetch}>
            <i className="ti ti-refresh" />
            Thử lại
          </button>
        </div>
      )}

      {/* ── Data loaded ── */}
      {!loading && !error && revenueStats && (
        <>
          {/* ── Phần 2: KPI Cards ── */}
          <RevenueMetrics revenueStats={revenueStats} />

          {/* ── Phần 3: Biểu đồ ── */}
          <RevenueChart chartData={revenueStats.chartData} />
        </>
      )}

      {/* ── Modal xuất báo cáo ── */}
      <ExportRevenueReportModal
        open={exportOpen}
        revenueStats={revenueStats}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
