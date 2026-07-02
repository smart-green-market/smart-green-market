import FilterDropdown from "../UI/FilterDropdown";

const OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Đang hoạt động", value: "active" },
    { label: "Đăng ký", value: "pending" },
    { label: "Từ chối", value: "rejected" },
];

export default function VoucherFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc Voucher"
            options={OPTIONS}
        />
    );
}
