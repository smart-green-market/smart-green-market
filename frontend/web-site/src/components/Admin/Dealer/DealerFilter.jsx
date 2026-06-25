import FilterDropdown from "../UI/FilterDropdown";

export const DEALER_FILTER_OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Đang hoạt động", value: "active" },
    { label: "Tạm khóa", value: "inactive" },
    { label: "Từ chối", value: "rejected" },
    { label: "Chờ duyệt", value: "pending" },
];

export default function DealerFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc đại lý"
            options={DEALER_FILTER_OPTIONS}
        />
    );
}

export function getDealerDisplayStatus(dealer) {
    if (!dealer) return "pending";

    if (dealer.status === "pending" || dealer.status === "rejected") {
        return dealer.status;
    }

    if (dealer.status === "active") {
        return dealer.account_status || dealer.account?.status || "active";
    }

    return dealer.status;
}
