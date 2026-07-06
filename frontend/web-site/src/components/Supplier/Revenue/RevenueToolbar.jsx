const PERIODS = [
  { key: 'day', label: 'Theo ngày' },
  { key: 'month', label: 'Theo tháng' },
  { key: 'year', label: 'Theo năm' },
];

export default function RevenueToolbar({ period, onChangePeriod, onOpenExport }) {
  return (
    <div className="toolbar">
      <div className="chip-group">
        {PERIODS.map((p) => (
          <div
            key={p.key}
            className={`chip${period === p.key ? ' on' : ''}`}
            onClick={() => onChangePeriod(p.key)}
          >
            {p.label}
          </div>
        ))}
      </div>
      <button className="btn-ghost" onClick={onOpenExport}>
        <i className="ti ti-download" />
        Xuất báo cáo
      </button>
    </div>
  );
}
