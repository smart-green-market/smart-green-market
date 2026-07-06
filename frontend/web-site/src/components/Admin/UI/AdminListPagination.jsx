import Pagination from "../../common/Pagination";
import { ADMIN_LIST_PAGE_SIZE } from "../../../utils/adminPaginationUtils";

export default function AdminListPagination({
  currentPage,
  totalPages,
  totalCount,
  pageRange,
  onPageChange,
  noun = "mục",
}) {
  if (totalCount <= 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-neutral-500">
        Hiển thị {pageRange.from}–{pageRange.to} / {totalCount} {noun}
      </div>
      {totalPages > 1 ? (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}

export { ADMIN_LIST_PAGE_SIZE };
