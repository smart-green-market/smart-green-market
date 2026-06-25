import FilterDropdown from "../UI/FilterDropdown";

const OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Đã duyệt", value: "approved" },
    { label: "Từ chối", value: "rejected" },
    { label: "Đăng ký", value: "pending" },
];

export default function CertificationFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc chứng chỉ"
            options={OPTIONS}
        />
    );
}
