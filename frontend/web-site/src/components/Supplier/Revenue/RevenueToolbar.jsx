import { GROUP_BY_OPTIONS } from './revenueHelpers';

export default function RevenueToolbar({
  startDate,
  endDate,
  groupBy,
  onStartDateChange,
  onEndDateChange,
  onGroupByChange,
  onApplyFilter,
  onOpenExport,
}) {
  return (
    <div className="rev-toolbar">
      <div className="rev-toolbar-filters">
        <div className="rev-filter-group">
          <label className="rev-filter-label" htmlFor="rev-start">Từ ngày</label>
          <input
            id="rev-start"
            type="date"
            className="rev-date-input"
            value={startDate}
            onChange={e => onStartDateChange(e.target.value)}
          />
        </div>

        <div className="rev-filter-group">
          <label className="rev-filter-label" htmlFor="rev-end">Đến ngày</label>
          <input
            id="rev-end"
            type="date"
            className="rev-date-input"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
          />
        </div>

        <div className="rev-filter-group">
          <label className="rev-filter-label" htmlFor="rev-group">Nhóm theo</label>
          <select
            id="rev-group"
            className="rev-select"
            value={groupBy}
            onChange={e => onGroupByChange(e.target.value)}
          >
            {GROUP_BY_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button className="rev-btn-apply" onClick={onApplyFilter}>
          <i className="ti ti-chart-bar" />
          Thống kê
        </button>
      </div>

      <button className="rev-btn-export" onClick={onOpenExport}>
        <i className="ti ti-download" />
        Xuất báo cáo
      </button>
    </div>
  );
}
