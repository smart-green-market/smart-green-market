import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/tableStyles";
import { formatDateTime } from "../../common/formatDateTime";
import { isNotificationUnread } from "./notificationFormatters";

const STATUS_CONFIG = {
    read:  { label: "ĐÃ ĐỌC", bg: "bg-green-200",   text: "text-green-800"  },
    unread:  { label: "CHƯA ĐỌC",        bg: "bg-gray-200",     text: "text-gray-800"   },
};
const getSupplierName = async (supplierId) => {
    const response = await supplierService.getSupplierById(supplierId);
    return response.data.name;
}
const TYPE = {
    info: {label: "THÔNG BÁO"},
    warning: {label: "CẢNH BÁO"},
    success: {label: "THÀNH CÔNG"},
    error: {label: "THẤT BẠI"},
}
const TYPE_REF = {
    account_document: {label: "GIẤY TỜ - NHÀ CUNG CẤP"},
    supplier: {label: "NHÀ CUNG CẤP"},
    dealer: {label: "ĐẠI LÝ"},
    category: {label: "DANH MỤC - NHÀ CUNG CẤP"},
    certification: {label: "CHỨNG CHỈ - NHÀ CUNG CẤP"},
    supplier_product: {label: "SẢN PHẨM - NHÀ CUNG CẤP"},
    dealer_product:{label: "SẢN PHẨM - ĐẠI LÝ"},
    purchase_order:{label: "ĐƠN HÀNG - ĐẠI LÝ"},
}
// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView) => [
    {
        name: "THÔNG BÁO",
        selector: (row) => row.type,
        sortable: true,
        center: true,
        width: '150px',
        cell: (row) => {
            const st = TYPE[row.type] || {
                label: row.type || "KHÔNG XÁC ĐỊNH",
            };

            return (
                <span className="px-2.5 py-1 rounded-full font-bold text-sm font-semibold font-['Geist',sans-serif] uppercase tracking-wide">
                    {st.label}
                </span>
            );
        },
    },
    {
        name: "TIÊU ĐỀ",
        selector: (row) => row.title,
        sortable: true,
        grow: 2,
        cell: (row) => (
            <span className="font-bold text-sm font-semibold font-['Geist',sans-serif]">
                {row.title}
            </span>
        ),
    },
    {
        name: "LOẠI",
        selector: (row) => row.referenceType,
        sortable: true,
        center: true,
        width: '250px',
        grow: 1,
        cell: (row) => {
            const st = TYPE_REF[row.referenceType] || {
                label: row.referenceType || "KHÔNG XÁC ĐỊNH",
            };

            return (
                <span className="px-2.5 py-1 rounded-full font-bold text-sm font-semibold font-['Geist',sans-serif] uppercase tracking-wide">
                    {st.label}
                </span>
            );
        },
    },
    {
        name: "THỜI GIAN",
        selector: (row) => row.createdAt,
        sortable: true,
        center: true,
        width: '150px',
        cell: (row) => (
            <span className="font-bold text-sm font-semibold font-['Geist',sans-serif]">
                {formatDateTime(row.createdAt)}
            </span>
        ),
    },
    {
        name: "Trạng thái",
        selector: (row) => row.readAt,
        sortable: true,
        center: true,
        width: '150px',
        cell: (row) => {
            const st = isNotificationUnread(row) ? STATUS_CONFIG.unread : STATUS_CONFIG.read;
            return (
                <span className={`px-2.5 py-1 rounded-full text-sm font-semibold font-['Geist',sans-serif] uppercase tracking-wide ${st.bg} ${st.text}`}>
                    {st.label}
                </span>
            );
        },
    },
    {
    name: "Thao tác",
    width: "150px",
    center: true,
    cell: (row) => (
      <div className="flex items-center gap-1 pr-2">
        <button
          onClick={() => onView(row)}
          title="Xem chi tiết"
          className="p-1.5 rounded-lg font-bold text-sm font-semibold font-['Geist',sans-serif] bg-blue-200 text-blue-800  hover:bg-blue-300 transition-colors cursor-pointer"
        >
          Xem chi tiết
        </button>
      </div>
    ),
    ignoreRowClick: true,
  },
];
const conditionalRowStyles = [
    {
        when: (row) => !isNotificationUnread(row),
        style: {
            backgroundColor: "#f5f5f5", // Màu nền tối hơn (neutral-100/stone-100)
            color: "#737373",           // Chữ mờ đi chút
            opacity: 0.85,
        },
    },
    {
        when: (row) => isNotificationUnread(row),
        style: {
            backgroundColor: "#ffffff", // Sáng lên
            fontWeight: "bold",
        },
    },
];
export default function NotificationTable({ data, search, statusFilter, onView }) {
    const filtered = data.filter((row) => {
        const notiType = TYPE[row.type]?.label || row.type || "";
        const notiTypeRef = TYPE_REF[row.referenceType]?.label || row.referenceType || "";
        const notiTitle = row.title || "";

        // 1. Lọc theo thanh tìm kiếm
        const matchName = 
            notiType.toLowerCase().includes(search.toLowerCase()) ||
            notiTypeRef.toLowerCase().includes(search.toLowerCase()) ||
            notiTitle.toLowerCase().includes(search.toLowerCase());

        // 2. Logic phân loại bộ lọc nâng cao
        let matchFilter = true;

        if (statusFilter && statusFilter !== "") {
            if (statusFilter === "read") {
                matchFilter = !isNotificationUnread(row);
            } else if (statusFilter === "unread") {
                matchFilter = isNotificationUnread(row);
            } else {
                // Lọc theo các loại Group Type/Ref cũ của bạn
                const typeGroup = ["info", "warning", "success", "error"];
                if (typeGroup.includes(statusFilter)) {
                    matchFilter = row.type === statusFilter;
                } else {
                    matchFilter = row.referenceType === statusFilter;
                }
            }
        }
        
        return matchName && matchFilter;
    });

    const columns = buildColumns(onView);

    return (
        <div className="w-full rounded-xl border border-neutral-200 overflow-hidden">
            <DataTable
                columns={columns}
                data={filtered}
                pagination
                paginationPerPage={10}
                paginationComponentOptions={paginationVi}
                customStyles={tableStyles}
                conditionalRowStyles={conditionalRowStyles}
                noDataComponent={
                    <div className="py-16 text-sm text-neutral-400 font-['Geist',sans-serif]">
                        Không tìm thấy thông báo.
                    </div>
                }
                defaultSortFieldId={1}
                highlightOnHover
                responsive
            />
        </div>
    );
}