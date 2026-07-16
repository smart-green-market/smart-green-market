"""Phân trang load-more và helper cho custom @action."""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class LoadMorePagination(PageNumberPagination):
    """Phân trang kiểu load-more: ?page=1&page_size=20"""

    page_size = 20
    page_query_param = "page"
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(
        self,
        data,
        count_status=None,
        count_loyalty=None,
        count_segment=None,
    ):
        """Trả response JSON gồm metadata phân trang và danh sách kết quả."""
        payload = {
            "count": self.page.paginator.count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "page": self.page.number,
            "page_size": self.get_page_size(self.request),
            "has_more": self.page.has_next(),
            "results": data,
        }
        if count_status is not None:
            payload["count_status"] = count_status
        if count_loyalty is not None:
            payload["count_loyalty"] = count_loyalty
        if count_segment is not None:
            payload["count_segment"] = count_segment
        return Response(payload)


def paginate_queryset(view, request, queryset, serialize, count_status=None):
    """
    Phân trang queryset cho custom @action trả về danh sách.
    `serialize(page_items)` nhận list object trên trang hiện tại, trả về data list.
    """
    paginator = LoadMorePagination()
    page = paginator.paginate_queryset(queryset, request, view=view)
    return paginator.get_paginated_response(serialize(page), count_status=count_status)
