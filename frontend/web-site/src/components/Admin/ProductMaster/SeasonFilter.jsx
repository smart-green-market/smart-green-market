import { useEffect, useState } from "react";
import FilterDropdown from "../UI/FilterDropdown";
import { seasonService, handleApiError } from "../../../services/api/Admin/seasonService";

export default function SeasonFilter({ value, onChange }) {
    const [options, setOptions] = useState([{ label: "Tất cả mùa", value: "" }]);

    useEffect(() => {
        let cancelled = false;

        const fetchSeasons = async () => {
            try {
                const list = await seasonService.getAll();
                if (cancelled) return;

                const seasonOptions = (list ?? [])
                    .filter((item) => item.status !== "inactive")
                    .sort(
                        (a, b) =>
                            (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
                            String(a.name ?? "").localeCompare(String(b.name ?? ""), "vi"),
                    )
                    .map((item) => ({
                        label: item.name,
                        value: String(item.id),
                    }));

                setOptions([
                    { label: "Tất cả mùa", value: "" },
                    ...seasonOptions,
                ]);
            } catch (error) {
                if (!cancelled) {
                    console.error(handleApiError(error, "Không thể tải bộ lọc mùa."));
                }
            }
        };

        fetchSeasons();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <FilterDropdown
            value={value}
            onChange={onChange}
            label="Lọc theo mùa"
            options={options}
        />
    );
}
