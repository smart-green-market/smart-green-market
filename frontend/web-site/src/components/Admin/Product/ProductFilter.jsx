import FilterDropdown from "../UI/FilterDropdown";

const OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Đang hoạt động", value: "active" },
    { label: "Tạm ngưng", value: "inactive" },
    { label: "Từ chối", value: "rejected" },
    { label: "Chờ duyệt", value: "pending" },
];

export default function ProductFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc sản phẩm"
            options={OPTIONS}
        />
    );
}
