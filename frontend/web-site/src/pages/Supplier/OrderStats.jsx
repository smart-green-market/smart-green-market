import { useState } from 'react';
import useOrderStats from '../../hooks/useOrderStats';
import { PageSpinner } from '../../components/Supplier/UI/SupplierSpinner';
import {
  OrderStatsToolbar,
  OrderStatsMetrics,
  OrderStatsChart,
  OrderStatsTopPeriods,
  OrderStatsDonut,
  OrderStatsTable,
  ExportOrderStatsModal,
  computeOrderStatsSummary,
} from '../../components/Supplier/OrderStats';
import '../../components/Supplier/OrderStats/OrderStats.css';

/**
 * Trang "Thống kê đơn hàng" — dành cho Supplier
 * Route gợi ý: /supplier/order-stats
 */
export default function OrderStats() {
  const [period, setPeriod] = useState('day');
  const [exportOpen, setExportOpen] = useState(false);

  const { data, loading, error } = useOrderStats(period);
  const summary = computeOrderStatsSummary(data);

  if (loading && !data) {
    return <div className="page"><PageSpinner /></div>;
  }

  if (error && !data) {
    return <div className="page">Không thể tải dữ liệu thống kê đơn hàng. Vui lòng thử lại.</div>;
  }

  return (
    <div className="page">
      <OrderStatsToolbar
        period={period}
        onChangePeriod={setPeriod}
        onExport={() => setExportOpen(true)}
      />

      <OrderStatsMetrics period={period} summary={summary} />

      <OrderStatsChart period={period} data={data} />

      <div className="two">
        <OrderStatsTopPeriods data={data} />
        <OrderStatsDonut summary={summary} />
      </div>

      <OrderStatsTable data={data} />

      <ExportOrderStatsModal
        open={exportOpen}
        period={period}
        data={data}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}

