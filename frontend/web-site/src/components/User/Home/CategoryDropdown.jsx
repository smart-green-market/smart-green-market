import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { categoryService } from "../../../services/api/categoryService";

export default function CategoryDropdown() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await categoryService.getAll();
        if (mounted) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setError("Không thể tải danh mục lúc này.");
        console.error("Fetch categories failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((item) => String(item.id) === String(selectedId)),
    [categories, selectedId],
  );

  const label = selectedCategory?.name || "Danh mục";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 text-neutral-600 text-sm font-medium hover:text-green-600 transition-colors"
      >
        {loading ? "Đang tải..." : label}
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !loading && (
        <div className="absolute left-0 z-20 mt-3 w-64 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
          {error ? (
            <p className="px-4 py-3 text-sm text-red-600">{error}</p>
          ) : categories.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">Không có danh mục.</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(category.id);
                      setOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
