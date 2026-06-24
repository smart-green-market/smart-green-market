import FilterDropdown from "../UI/FilterDropdown";

export const CATEGORY_FILTER_OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Hệ thống", value: "system" },
    { label: "Đăng ký (riêng)", value: "custom" },
    { label: "Đã duyệt", value: "active" },
    { label: "Khóa", value: "inactive" },
    { label: "Từ chối", value: "rejected" },
    { label: "Chờ duyệt", value: "pending" },
];

export default function CategoryFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc danh mục"
            options={CATEGORY_FILTER_OPTIONS}
        />
    );
}
