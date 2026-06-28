"""API ViewSet quản lý danh mục sản phẩm nông sản."""

from django.db.models import Count, F, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.accounts.models import AccountRole
from apps.dealer_products.models import DealerProductStatus
from apps.supplier_products.models import SupplierProductStatus
from common.notification_messages import admin_new_category, category_reviewed
from common.notifications import notify_account, notify_admins
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from common.verify_openapi import (
    CATEGORY_VERIFY_APPROVE,
    CATEGORY_VERIFY_INACTIVE,
    CATEGORY_VERIFY_REJECT,
    VERIFY_REJECT_HELP,
)
from common.permission import IsActive, IsAdmin
from common.querysets import filter_categories_for_user, ORDER_CATEGORY
from common.pagination import LoadMorePagination
from common.status_counts import build_count_status, filter_by_status_param
from common.soft_delete import default_exclude_deleted
from .archive import soft_delete_category
from .models import Category, CategoryScope, CategoryStatus
from .utils import user_can_manage_category
from .serializers import (
    CategoryDetailSerializer,
    CategoryListSerializer,
    CategoryReorderSerializer,
    CategorySerializer,
    VerifyCategorySerializer,
)


def _dealer_product_count_filter(user):
    return Q(dealer_store_products__dealer_profile__account=user) & ~Q(
        dealer_store_products__status=DealerProductStatus.DELETED
    )


def _annotate_category_product_count(qs, user):
    """Đếm sản phẩm thuộc danh mục theo vai trò người dùng."""
    if user.role == AccountRole.DEALER:
        return qs.annotate(
            product_count=Count(
                "dealer_store_products",
                filter=_dealer_product_count_filter(user),
                distinct=True,
            )
        )

    if user.role == AccountRole.SUPPLIER:
        profile = getattr(user, "supplier_profile", None)
        if not profile:
            return qs.annotate(product_count=Count("id", filter=Q(pk__in=[])))
        return qs.annotate(
            product_count=Count(
                "supplier_products",
                filter=Q(supplier_products__supplier=profile)
                & ~Q(supplier_products__status=SupplierProductStatus.DELETED),
                distinct=True,
            )
        )

    return qs.annotate(
        _dealer_product_count=Count(
            "dealer_store_products",
            filter=~Q(dealer_store_products__status=DealerProductStatus.DELETED),
            distinct=True,
        ),
        _supplier_product_count=Count(
            "supplier_products",
            filter=~Q(supplier_products__status=SupplierProductStatus.DELETED),
            distinct=True,
        ),
    ).annotate(product_count=F("_dealer_product_count") + F("_supplier_product_count"))


@extend_schema_view(
    list=extend_schema(
        tags=["Categories"],
        summary="Danh sách danh mục",
        description=(
            "Admin xem tất cả (mặc định không lọc status). "
            "Supplier/Dealer: danh mục hệ thống `active` + danh mục riêng do mình tạo; "
            "**mặc định chỉ trả `active`** — dùng `?status=pending|rejected|inactive` "
            "để xem danh mục chờ duyệt / từ chối / khóa. "
            "Buyer chỉ thấy danh mục hệ thống `active`. "
            "Mỗi danh mục kèm `product_count`."
            + PAGINATION_QUERY_HELP
        ),
        parameters=[
            OpenApiParameter("search", str, description="Tìm kiếm theo tên hoặc mô tả", required=False),
            OpenApiParameter("status", str, description="Lọc theo trạng thái", required=False),
        ],
        responses={
            200: paginated_response_schema(CategoryListSerializer, "PaginatedCategory")
        },
    ),
    retrieve=extend_schema(
        tags=["Categories"],
        summary="Chi tiết danh mục",
        description=(
            "Trả thêm `product_count` và `products[]` — sản phẩm thuộc danh mục "
            "của đại lý/NCC đang đăng nhập."
        ),
        responses={200: CategoryDetailSerializer},
    ),
    create=extend_schema(
        tags=["Categories"],
        summary="Tạo danh mục",
        description=(
            "Admin tạo `scope=system` (active ngay) hoặc `custom`. "
            "Supplier/Dealer tạo danh mục riêng (`custom`) → `status=pending`, chờ Admin duyệt. "
            f"Tối đa danh mục riêng theo /api/system-config/."
        ),
    ),
    update=extend_schema(
        tags=["Categories"],
        summary="Cập nhật danh mục",
        description="Sửa danh mục đã duyệt → quay lại `pending`, chờ Admin duyệt lại.",
    ),
    partial_update=extend_schema(tags=["Categories"], summary="Cập nhật một phần danh mục"),
    destroy=extend_schema(
        tags=["Categories"],
        summary="Xóa mềm danh mục",
        description=(
            "Đặt `status=deleted`. Chặn khi còn sản phẩm NCC/đại lý hoặc product master gắn. "
            "Admin hoặc người tạo danh mục riêng."
        ),
    ),
)
class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD và duyệt danh mục sản phẩm."""

    permission_classes = [IsActive]
    queryset = Category.objects.select_related(
        "created_by",
        "created_by__supplier_profile",
        "verified_by",
    )
    serializer_class = CategorySerializer

    def get_serializer_class(self):
        """Trả về serializer phù hợp theo action hiện tại."""
        if self.action == "retrieve":
            return CategoryDetailSerializer
        if self.action in ("list", "verify", "lock", "unlock"):
            return CategoryListSerializer
        return CategorySerializer

    def get_permissions(self):
        """Chỉ Admin được duyệt, khóa/mở khóa và sắp xếp danh mục."""
        if self.action in ("verify", "reorder", "lock", "unlock"):
            return [IsAdmin()]
        return [IsActive()]

    def get_queryset(self):
        """Lọc danh mục: hệ thống + riêng theo quyền."""
        qs = filter_categories_for_user(
            self.queryset,
            self.request.user,
            ordering=ORDER_CATEGORY,
            pending_field="status",
        )
        if self.action in ("list", "retrieve", "verify", "lock", "unlock"):
            qs = _annotate_category_product_count(qs, self.request.user)
        return qs

    def _apply_category_list_filters(self, qs, request, *, apply_status=True):
        search = request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        if apply_status:
            qs = filter_by_status_param(
                qs, request.query_params.get("status"), field="status"
            )
        return qs

    def list(self, request, *args, **kwargs):
        base_qs = self._apply_category_list_filters(
            self.filter_queryset(self.get_queryset()),
            request,
            apply_status=False,
        )
        base_qs = default_exclude_deleted(
            base_qs,
            request,
            status_field="status",
            deleted_value=CategoryStatus.DELETED,
        )
        count_status = build_count_status(base_qs, field="status", choices=CategoryStatus)
        status_param = (request.query_params.get("status") or "").strip()
        if status_param:
            qs = filter_by_status_param(base_qs, status_param, field="status")
        elif request.user.role in (AccountRole.DEALER, AccountRole.SUPPLIER):
            qs = base_qs.filter(status=CategoryStatus.ACTIVE)
        else:
            qs = base_qs
        paginator = LoadMorePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = self.get_serializer(page, many=True)
        return paginator.get_paginated_response(serializer.data, count_status=count_status)

    def _ensure_can_edit(self, category):
        """Kiểm tra quyền sửa danh mục — admin hoặc người tạo danh mục riêng."""
        if not user_can_manage_category(self.request.user, category):
            if category.scope == CategoryScope.SYSTEM:
                raise PermissionDenied("Chỉ admin được sửa danh mục hệ thống.")
            raise PermissionDenied("Bạn chỉ được sửa danh mục do mình tạo.")

    def perform_create(self, serializer):
        """Lưu danh mục mới; danh mục riêng chờ duyệt thì thông báo admin."""
        category = serializer.save()
        if (
            category.scope == CategoryScope.CUSTOM
            and category.status == CategoryStatus.PENDING
        ):
            title, content = admin_new_category(category, self.request.user.username)
            notify_admins(
                title=title,
                content=content,
                reference_type="category",
                reference_id=category.id,
                created_by=self.request.user,
            )

    def perform_update(self, serializer):
        """Cập nhật danh mục; sửa danh mục đã duyệt sẽ chuyển về chờ duyệt."""
        category = serializer.instance
        self._ensure_can_edit(category)
        was_active = category.status == CategoryStatus.ACTIVE
        category = serializer.save()

        if was_active and self.request.user.role != "admin":
            category.status = CategoryStatus.PENDING
            category.verified_by = None
            category.verified_at = None
            category.rejection_reason = ""
            category.save(
                update_fields=[
                    "status",
                    "verified_by",
                    "verified_at",
                    "rejection_reason",
                    "updated_at",
                ]
            )
            if category.scope == CategoryScope.CUSTOM:
                title, content = admin_new_category(
                    category, self.request.user.username
                )
                notify_admins(
                    title=f"[Danh mục] Yêu cầu chỉnh sửa chờ duyệt",
                    content=(
                        f"{content} Đây là yêu cầu chỉnh sửa danh mục đã được duyệt trước đó."
                    ),
                    reference_type="category",
                    reference_id=category.id,
                    created_by=self.request.user,
                )

    def perform_destroy(self, instance):
        """Soft-delete danh mục sau khi kiểm quyền và ràng buộc sản phẩm."""
        self._ensure_can_edit(instance)
        soft_delete_category(instance, self.request.user)

    @extend_schema(
        tags=["Categories"],
        summary="Admin duyệt / từ chối / khóa danh mục",
        description=(
            "- `active`: duyệt danh mục\n"
            "- `rejected` / `inactive`: từ chối hoặc khóa "
            "(bắt buộc `rejection_reason`)"
            + VERIFY_REJECT_HELP
        ),
        request=VerifyCategorySerializer,
        responses={200: CategoryListSerializer},
        examples=[
            CATEGORY_VERIFY_APPROVE,
            CATEGORY_VERIFY_REJECT,
            CATEGORY_VERIFY_INACTIVE,
        ],
    )
    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """Admin duyệt, từ chối hoặc khóa danh mục và thông báo người tạo."""
        category = self.get_object()
        serializer = VerifyCategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category.status = serializer.validated_data["status"]
        category.rejection_reason = serializer.validated_data.get(
            "rejection_reason", ""
        )
        category.verified_by = request.user
        category.verified_at = timezone.now()
        category.save()

        title, content, notif_type = category_reviewed(category)
        if category.created_by_id:
            notify_account(
                account=category.created_by,
                title=title,
                content=content,
                reference_type="category",
                reference_id=category.id,
                created_by=request.user,
                notif_type=notif_type,
            )
        return Response(
            CategoryListSerializer(category, context={"request": request}).data
        )

    @extend_schema(
        tags=["Categories"],
        summary="Admin khóa danh mục (vi phạm)",
        responses={200: CategoryListSerializer},
    )
    @action(detail=True, methods=["post"])
    def lock(self, request, pk=None):
        """Admin khóa danh mục vi phạm quy định."""
        category = self.get_object()
        category.status = CategoryStatus.INACTIVE
        category.verified_by = request.user
        category.verified_at = timezone.now()
        category.save()
        if category.created_by_id:
            notify_account(
                account=category.created_by,
                title=f"[Danh mục] \"{category.name}\" — Đã khóa",
                content=f"Danh mục {category.name} đã bị khóa do vi phạm quy định.",
                reference_type="category",
                reference_id=category.id,
                created_by=request.user,
                notif_type="warning",
            )
        return Response(
            CategoryListSerializer(category, context={"request": request}).data
        )

    @extend_schema(
        tags=["Categories"],
        summary="Admin mở khóa danh mục",
        responses={200: CategoryListSerializer},
    )
    @action(detail=True, methods=["post"])
    def unlock(self, request, pk=None):
        """Admin mở khóa danh mục đang ở trạng thái inactive."""
        category = self.get_object()
        if category.status != CategoryStatus.INACTIVE:
            raise ValidationError({"detail": "Danh mục không ở trạng thái khóa."})
        category.status = CategoryStatus.ACTIVE
        category.verified_by = request.user
        category.verified_at = timezone.now()
        category.save()
        if category.created_by_id:
            notify_account(
                account=category.created_by,
                title=f"[Danh mục] \"{category.name}\" — Đã mở khóa",
                content=f"Danh mục {category.name} đã được mở khóa và kích hoạt lại.",
                reference_type="category",
                reference_id=category.id,
                created_by=request.user,
                notif_type="success",
            )
        return Response(
            CategoryListSerializer(category, context={"request": request}).data
        )

    @extend_schema(
        tags=["Categories"],
        summary="Admin sắp xếp thứ tự hiển thị danh mục",
        request=CategoryReorderSerializer,
        responses={200: CategorySerializer(many=True)},
    )
    @action(detail=False, methods=["post"])
    def reorder(self, request):
        """Admin cập nhật thứ tự hiển thị nhiều danh mục cùng lúc."""
        serializer = CategoryReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for item in serializer.validated_data["items"]:
            Category.objects.filter(pk=item["id"]).update(sort_order=item["sort_order"])
        categories = Category.objects.order_by("sort_order", "name")
        return Response(CategorySerializer(categories, many=True).data)
