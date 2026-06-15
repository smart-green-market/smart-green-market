import { supplierTableStyles, paginationVi } from "../UI/supplierTableStyles";
import { SupplierActionButton, SupplierActionGroup } from "../UI/SupplierTableActions";
import DataTable from "react-data-table-component";

const STATUS_CONFIG = {
  pending: { label: "CHỜ DUYỆT", bg: "bg-amber-500/10", text: "text-amber-600" },
  approved: { label: "ĐÃ DUYỆT", bg: "bg-emerald-600/10", text: "text-emerald-700" },
  rejected: { label: "TỪ CHỐI", bg: "bg-red-600/10", text: "text-red-600" },
  expired: { label: "HẾT HẠN", bg: "bg-neutral-500/10", text: "text-neutral-600" },
  revoked: { label: "THU HỒI", bg: "bg-rose-600/10", text: "text-rose-700" },
};

const buildColumns = (onView) => [
  {
    name: "Mã chứng nhận",
    selector: (row) => row.certificate_code || row.code,
    sortable: true,
    minWidth: "150px",
    cell: (row) => (
      <span className="text-emerald-800 text-xs font-semibold font-mono">
        {row.certificate_code || row.code}
      </span>
    ),
  },
  {
    name: "Hình ảnh",
    width: "100px",
    cell: (row) => {
      const imgUrl =
        row.images?.length > 0 ? row.images[0].image_url : row.image;
      return (
        <img
          src={imgUrl || "https://placehold.co/48x48"}
          alt={row.name}
          className="w-14 h-14 rounded-lg border border-stone-300 object-cover"
        />
      );
    },
  },
  {
    name: "Tên chứng nhận",
    selector: (row) => row.name,
    sortable: true,
    minWidth: "180px",
    grow: 2,
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.name}
      </span>
    ),
  },
  {
    name: "Nơi cấp",
    selector: (row) => row.issued_by,
    sortable: true,
    minWidth: "140px",
    cell: (row) => (
      <span className="text-sm text-neutral-600">{row.issued_by || "—"}</span>
    ),
  },
  {
    name: "Thời hạn",
    minWidth: "140px",
    cell: (row) => (
      <div className="flex flex-col text-xs font-['Geist',sans-serif] gap-1">
        <span className="text-neutral-600">
          Cấp: <strong>{row.issue_date || "—"}</strong>
        </span>
        <span className="text-red-600">
          Hết: <strong>{row.expiry_date || "—"}</strong>
        </span>
      </div>
    ),
  },
  {
    name: "Trạng thái",
    selector: (row) => row.status,
    sortable: true,
    width: "130px",
    cell: (row) => {
      const st = STATUS_CONFIG[row.status] ?? {
        label: row.status,
        bg: "bg-gray-100",
        text: "text-gray-600",
      };
      return (
        <span
          className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide ${st.bg} ${st.text}`}
        >
          {st.label}
        </span>
      );
    },
  },
  {
    name: "Thao tác",
    minWidth: "120px",
    right: true,
    cell: (row) => (
      <SupplierActionGroup>
        <SupplierActionButton label="Xem chi tiết" onClick={() => onView(row)} />
      </SupplierActionGroup>
    ),
    ignoreRowClick: true,
  },
];

export default function CertificationTable({ data, search, statusFilter, onView }) {
  const filtered = data.filter((row) => {
    const searchStr = (search || "").toLowerCase();
    const matchName = (row?.name || "").toLowerCase().includes(searchStr);
    const matchCode = (row?.certificate_code || row?.code || "")
      .toLowerCase()
      .includes(searchStr);
    const matchStatus = statusFilter ? row.status === statusFilter : true;

    return (matchName || matchCode) && matchStatus;
  });

  return (
    <div className="w-full rounded-xl border border-neutral-200 overflow-hidden">
      <DataTable
        columns={buildColumns(onView)}
        data={filtered}
        pagination
        paginationPerPage={6}
        paginationRowsPerPageOptions={[6, 12, 20]}
        paginationComponentOptions={paginationVi}
        customStyles={supplierTableStyles}
        noDataComponent={
          <div className="py-16 text-sm text-neutral-400 font-['Geist']">
            Không có chứng nhận nào phù hợp.
          </div>
        }
        highlightOnHover
        responsive
      />
    </div>
  );
}
