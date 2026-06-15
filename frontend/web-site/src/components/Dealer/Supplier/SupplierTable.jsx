import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/TableStyles";
import { Phone, MapPin, ChevronRight } from "lucide-react";

const AVATAR_COLORS = [
  "from-emerald-500 to-teal-600",
  "from-teal-500 to-cyan-600",
  "from-green-500 to-emerald-600",
  "from-lime-500 to-green-600",
  "from-emerald-600 to-green-700",
];

export default function SupplierTable({ filteredInventory, onRowClick }) {
  const columns = [
    {
      name: "Nhà cung cấp",
      selector: (row) => row.company_name,
      sortable: true,
      grow: 2,
      cell: (row) => {
        const initials = (row.company_name || "")
          .split(" ")
          .slice(-2)
          .map((w) => w[0])
          .join("")
          .toUpperCase() || "NC";
        const gradientColor = AVATAR_COLORS[(row.id || 0) % AVATAR_COLORS.length];

        return (
          <div className="flex items-center gap-3 py-2">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradientColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
              {initials}
            </div>
            <div className="flex flex-col">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onRowClick(row);
                }}
                className="font-bold text-sm text-emerald-800 hover:text-emerald-950 cursor-pointer hover:underline underline-offset-2 transition-colors leading-tight"
              >
                {row.company_name}
              </span>
              {row.description && (
                <span className="text-[11px] text-neutral-400 font-medium line-clamp-1 mt-0.5 max-w-[240px]">
                  {row.description}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      name: "Liên hệ",
      selector: (row) => row.phone,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="font-semibold text-sm text-neutral-700">{row.phone || "—"}</span>
        </div>
      ),
    },
    {
      name: "Địa chỉ",
      selector: (row) => row.address,
      grow: 2,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="font-medium text-xs text-neutral-600 line-clamp-2 max-w-[260px]">
            {row.address || "—"}
          </span>
        </div>
      ),
    },
    {
      name: "",
      width: "50px",
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRowClick(row);
          }}
          className="w-8 h-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer group"
        >
          <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-emerald-600 transition-colors" />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-neutral-100 overflow-hidden bg-white shadow-xs">
      <DataTable
        columns={columns}
        data={filteredInventory}
        pagination
        paginationPerPage={10}
        paginationComponentOptions={paginationVi}
        customStyles={{
          ...tableStyles,
          headRow: {
            style: {
              ...tableStyles?.headRow?.style,
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #f3f4f6",
              minHeight: "48px",
            },
          },
          headCells: {
            style: {
              ...tableStyles?.headCells?.style,
              fontSize: "11px",
              fontWeight: "700",
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              paddingLeft: "16px",
              paddingRight: "16px",
            },
          },
          rows: {
            style: {
              ...tableStyles?.rows?.style,
              minHeight: "64px",
              borderBottom: "1px solid #f9fafb",
              "&:hover": {
                backgroundColor: "#f0fdf4",
                cursor: "pointer",
              },
              transition: "background-color 0.15s ease",
            },
          },
          cells: {
            style: {
              ...tableStyles?.cells?.style,
              paddingLeft: "16px",
              paddingRight: "16px",
            },
          },
        }}
        noDataComponent={
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-7 h-7 text-neutral-300" />
            </div>
            <p className="text-sm text-neutral-400 font-semibold">
              Không tìm thấy nhà cung cấp nào.
            </p>
          </div>
        }
        highlightOnHover
        responsive
        pointerOnHover
        onRowClicked={onRowClick}
      />
    </div>
  );
}
