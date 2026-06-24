import FilterDropdown from "../UI/FilterDropdown";

const OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Đang hoạt động", value: "approved" },
    { label: "Từ chối", value: "rejected" },
    { label: "Đăng ký", value: "pending" },
];

export default function SuppilerFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc nhà cung cấp"
            options={OPTIONS}
        />
    );
}
