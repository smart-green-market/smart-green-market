import FilterDropdown from "../UI/FilterDropdown";

const OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Đang hoạt động", value: "active" },
    { label: "Tạm khóa", value: "inactive" },
    { label: "Vô hiệu hóa", value: "banned" },
    { label: "Đăng ký", value: "pending" },
];

export default function UserFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc người dùng"
            options={OPTIONS}
        />
    );
}
