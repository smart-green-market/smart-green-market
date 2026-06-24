import FilterDropdown from "../UI/FilterDropdown";

export const PRODUCT_MASTER_FILTER_OPTIONS = [
    { label: "Tất cả", value: "" },
];

export default function ProductMasterFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc trạng thái"
            options={PRODUCT_MASTER_FILTER_OPTIONS}
        />
    );
}
