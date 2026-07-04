import FilterDropdown from "../UI/FilterDropdown";

export const SEASON_FILTER_OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Hoạt động", value: "active" },
    { label: "Khóa", value: "inactive" },
];

export default function SeasonFilter(props) {
    return (
        <FilterDropdown
            {...props}
            label="Lọc trạng thái"
            options={SEASON_FILTER_OPTIONS}
        />
    );
}
