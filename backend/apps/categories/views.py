"""API ViewSet quản lý danh mục sản phẩm nông sản."""

from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
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
from common.querysets import filter_admin_or_created_by, ORDER_CATEGORY
from .models import Category, CategoryStatus
from .serializers import (
    CategoryDetailSerializer,
    CategoryListSerializer,
    CategoryReorderSerializer,
    CategorySerializer,
    VerifyCategorySerializer,
)


def _annotate_category_product_count(qs, user):
    """Đếm sản phẩm thuộc danh mục theo vai trò người dùng."""
    if user.role == AccountRole.DEALER:
        return qs.annotate(
            product_count=Count(
                "supplier_products__dealer_products",
                filter=Q(
                    supplier_products__dealer_products__dealer_profile__account=user,
                )
                & ~Q(
                    supplier_products__dealer_products__status=DealerProductStatus.DELETED
                ),
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
        product_count=Count(
            "supplier_products",
            filter=~Q(supplier_products__status=SupplierProductStatus.DELETED),
            distinct=True,
        )
    )


@extend_schema_view(
    list=extend_schema(
        tags=["Categories"],
        summary="Danh sách danh mục",
        description=(
            "Admin xem tất cả. Supplier/Dealer chỉ thấy danh mục do mình tạo. "
            "Mỗi danh mục kèm `product_count` — số sản phẩm thuộc danh mục của tài khoản hiện tại."
            + PAGINATION_QUERY_HELP
        ),
        responses={200: paginated_response_schema(CategoryListSerializer, "PaginatedCategory")},
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
            "Supplier tạo danh mục → `status=pending`, chờ Admin duyệt. "
            f"Tối đa theo cấu hình hệ thống (xem /api/system-config/)."
        ),
    ),
    update=extend_schema(
        tags=["Categories"],
        summary="Cập nhật danh mục",
        description="Sửa danh mục đã duyệt → quay lại `pending`, chờ Admin duyệt lại.",
    ),
    partial_update=extend_schema(tags=["Categories"], summary="Cập nhật một phần danh mục"),
    destroy=extend_schema(tags=["Categories"], summary="Xóa danh mục"),
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
        """Lọc danh mục theo quyền Admin hoặc người tạo."""
        qs = filter_admin_or_created_by(
            self.queryset,
            self.request.user,
            ordering=ORDER_CATEGORY,
            pending_field="status",
        )
        if self.action in ("list", "retrieve", "verify", "lock", "unlock"):
            qs = _annotate_category_product_count(qs, self.request.user)
        return qs

    def _ensure_can_edit(self, category):
        """Kiểm tra quyền sửa danh mục — chỉ Admin hoặc người tạo."""
        user = self.request.user
        if user.role == "admin":
            return
        if category.created_by_id != user.id:
            raise PermissionDenied("Bạn chỉ được sửa danh mục do mình tạo.")

    def perform_create(self, serializer):
        """Lưu danh mục mới và gửi thông báo cho Admin."""
        category = serializer.save()
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
        category = self.instance
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
            title, content = admin_new_category(category, self.request.user.username)
            notify_admins(
                title=f"[Danh mục] Yêu cầu chỉnh sửa chờ duyệt",
                content=(
                    f"{content} Đây là yêu cầu chỉnh sửa danh mục đã được duyệt trước đó."
                ),
                reference_type="category",
                reference_id=category.id,
                created_by=self.request.user,
            )

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
        notify_account(
            account=category.created_by,
            title=title,
            content=content,
            reference_type="category",
            reference_id=category.id,
            created_by=request.user,
            notif_type=notif_type,
        )
        return Response(CategoryListSerializer(category).data)

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
        notify_account(
            account=category.created_by,
            title=f"[Danh mục] \"{category.name}\" — Đã khóa",
            content=f"Danh mục {category.name} đã bị khóa do vi phạm quy định.",
            reference_type="category",
            reference_id=category.id,
            created_by=request.user,
            notif_type="warning",
        )
        return Response(CategoryListSerializer(category).data)

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
        notify_account(
            account=category.created_by,
            title=f"[Danh mục] \"{category.name}\" — Đã mở khóa",
            content=f"Danh mục {category.name} đã được mở khóa và kích hoạt lại.",
            reference_type="category",
            reference_id=category.id,
            created_by=request.user,
            notif_type="success",
        )
        return Response(CategoryListSerializer(category).data)

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
