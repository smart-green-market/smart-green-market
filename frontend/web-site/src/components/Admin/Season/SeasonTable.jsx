import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/tableStyles";

const STATUS_CONFIG = {
    active: { label: "HOẠT ĐỘNG", bg: "bg-green-200", text: "text-green-800" },
    inactive: { label: "KHÓA", bg: "bg-gray-200", text: "text-gray-800" },
};

const buildColumns = (onView) => [
    {
        id: 1,
        name: "Tên mùa",
        selector: (row) => row.name,
        sortable: true,
        grow: 1.2,
        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif]">
                {row.name}
            </span>
        ),
    },
    {
        name: "Khoảng tháng",
        selector: (row) => row.month_label,
        sortable: true,
        grow: 1,
        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif]">
                {row.month_label}
            </span>
        ),
    },
    {
        name: "Trạng thái",
        selector: (row) => row.status,
        sortable: true,
        center: true,
        grow: 1,
        cell: (row) => {
            const status = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.active;
            return (
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${status.bg} ${status.text}`}
                >
                    {status.label}
                </span>
            );
        },
    },
    {
        name: "Thao tác",
        center: true,
        width: "150px",
        cell: (row) => (
            <button
                onClick={() => onView(row)}
                title="Xem chi tiết"
                className="cursor-pointer rounded-lg bg-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-300"
            >
                Xem chi tiết
            </button>
        ),
        ignoreRowClick: true,
    },
];

export default function SeasonTable({ data, search, statusFilter, onView }) {
    const filtered = data.filter((row) => {
        const keyword = search.toLowerCase();
        const matchSearch =
            row.name.toLowerCase().includes(keyword) ||
            row.code.toLowerCase().includes(keyword) ||
            row.description.toLowerCase().includes(keyword) ||
            row.month_label.toLowerCase().includes(keyword);

        const matchStatus = !statusFilter || row.status === statusFilter;

        return matchSearch && matchStatus;
    });

    return (
        <div className="w-full overflow-hidden rounded-xl border border-neutral-200">
            <DataTable
                columns={buildColumns(onView)}
                data={filtered}
                pagination
                paginationPerPage={10}
                paginationComponentOptions={paginationVi}
                customStyles={tableStyles}
                noDataComponent={
                    <div className="py-6 text-sm text-neutral-500">
                        Không tìm thấy mùa...
                    </div>
                }
                defaultSortFieldId={1}
                highlightOnHover
                responsive
            />
        </div>
    );
}
