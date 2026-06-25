import FilterDropdown from "../UI/FilterDropdown";

const OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Đã đọc", value: "read" },
    { label: "Chưa đọc", value: "unread" },
    { label: "Thông báo", value: "info" },
    { label: "Cảnh báo", value: "warning" },
    { label: "Thành công", value: "success" },
    { label: "Thất bại", value: "error" },
    { label: "Giấy tờ", value: "supplier_document" },
    { label: "Chứng chỉ", value: "certification" },
];

export default function NotificationFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc thông báo"
            options={OPTIONS}
        />
    );
}
