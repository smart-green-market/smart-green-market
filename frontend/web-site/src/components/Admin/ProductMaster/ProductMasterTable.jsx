import DataTable from "react-data-table-component";
import { tableStyles } from "../../common/tableStyles";
import { getSeasonTagClassName } from "./productMasterHelpers";

const STATUS_CONFIG = {
    active: { label: "HOẠT ĐỘNG", bg: "bg-green-200", text: "text-green-800" },
    inactive: { label: "KHÓA", bg: "bg-gray-200", text: "text-gray-800" },
};

const SeasonCell = ({ seasons = [] }) => {
    if (!seasons.length) {
        return <span className="text-sm text-neutral-400">—</span>;
    }

    return (
        <div className="mx-auto grid w-full max-w-[220px] grid-cols-2 gap-1.5 py-1.5">
            {seasons.map((season) => (
                <span
                    key={season.id}
                    className={`inline-flex min-h-[30px] items-center justify-center rounded-lg border px-2 py-1 text-center text-sm font-semibold leading-tight ${getSeasonTagClassName(season)}`}
                >
                    {season.name}
                </span>
            ))}
        </div>
    );
};

const buildColumns = (onView) => [
    {
        id: 1,
        name: "Tên sản phẩm",
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
        name: "Danh mục",
        selector: (row) => row.category_name,
        sortable: true,
        grow: 1,
        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif]">
                {row.category_name}
            </span>
        ),
    },
    // {
    //     name: "Mùa",
    //     selector: (row) => row.season_label,
    //     sortable: true,
    //     center: true,
    //     grow: 1,
    //     cell: (row) => <SeasonCell seasons={row.seasons} />,
    // },
    {
        name: "Đơn vị",
        selector: (row) => row.default_unit,
        sortable: true,
        center: true,
        width: "120px",
        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif] uppercase">
                {row.default_unit}
            </span>
        ),
    },
    {
        name: "Trạng thái",
        selector: (row) => row.status,
        sortable: true,
        center: true,
        width: "140px",
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

export default function ProductMasterTable({
    data,
    onView,
}) {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-neutral-200">
            <DataTable
                columns={buildColumns(onView)}
                data={data}
                customStyles={tableStyles}
                noDataComponent={
                    <div className="py-6 text-sm text-neutral-500">
                        Không tìm thấy sản phẩm...
                    </div>
                }
                defaultSortFieldId={1}
                highlightOnHover
                responsive
            />
        </div>
    );
}
