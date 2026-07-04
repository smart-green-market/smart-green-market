import FilterDropdown from "../UI/FilterDropdown";

const OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Đang hoạt động", value: "approved" },
    { label: "Đăng ký", value: "pending" },
    { label: "Từ chối", value: "rejected" },
];

export default function SupplierFinanceFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc trạng thái NCC"
            options={OPTIONS}
        />
    );
}
