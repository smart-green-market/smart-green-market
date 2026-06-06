from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class LoadMorePagination(PageNumberPagination):
    """Phân trang kiểu load-more: ?page=1&page_size=20"""

    page_size = 20
    page_query_param = "page"
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "page": self.page.number,
                "page_size": self.get_page_size(self.request),
                "has_more": self.page.has_next(),
                "results": data,
            }
        )


def paginate_queryset(view, request, queryset, serialize):
    """
    Phân trang queryset cho custom @action trả về danh sách.
    `serialize(page_items)` nhận list object trên trang hiện tại, trả về data list.
    """
    paginator = LoadMorePagination()
    page = paginator.paginate_queryset(queryset, request, view=view)
    return paginator.get_paginated_response(serialize(page))
