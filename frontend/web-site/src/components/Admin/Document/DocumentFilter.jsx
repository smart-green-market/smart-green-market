import FilterDropdown from "../UI/FilterDropdown";

const OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Đã duyệt", value: "approved" },
    { label: "Từ chối", value: "rejected" },
    { label: "Giấy phép kinh doanh", value: "business_license" },
    { label: "CMND / CCCD", value: "id_card" },
    { label: "Chứng nhận thuế", value: "tax_certificate" },
    { label: "Đăng ký", value: "pending" },
];

export default function DocumentFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc giấy tờ"
            options={OPTIONS}
        />
    );
}
