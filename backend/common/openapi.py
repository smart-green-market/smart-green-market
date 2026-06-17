"""Schema helpers dùng chung cho Swagger (drf-spectacular)."""

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

from .openapi_enums import schema_choice_field
from .validators import require_rejection_reason

PAGINATION_QUERY_HELP = (
    "\n\n**Phân trang (load more):** `?page=1&page_size=20` "
    "(mặc định page=1, page_size=20, tối đa 100)."
)


def paginated_response_schema(item_serializer, name="PaginatedList"):
    """Tạo inline serializer mô tả response phân trang load-more cho Swagger."""
    return inline_serializer(
        name=name,
        fields={
            "count": serializers.IntegerField(help_text="Tổng số bản ghi"),
            "next": serializers.URLField(
                allow_null=True,
                help_text="URL trang tiếp theo (dùng cho load more)",
            ),
            "previous": serializers.URLField(
                allow_null=True,
                help_text="URL trang trước",
            ),
            "page": serializers.IntegerField(help_text="Trang hiện tại (bắt đầu từ 1)"),
            "page_size": serializers.IntegerField(help_text="Số bản ghi mỗi trang"),
            "has_more": serializers.BooleanField(
                help_text="true nếu còn dữ liệu để tải thêm",
            ),
            "results": item_serializer(many=True),
        },
    )


class MessageResponseSerializer(serializers.Serializer):
    message = serializers.CharField(help_text="Thông báo kết quả")
    detail = serializers.CharField(required=False, help_text="Chi tiết (nếu có)")


class RegisterResponseSerializer(serializers.Serializer):
    message = serializers.CharField(help_text="Thông báo đăng ký thành công")
    account_id = serializers.IntegerField(help_text="ID tài khoản vừa tạo")
    access = serializers.CharField(help_text="JWT access token — dùng cho bước 2 onboarding (Bearer)")
    refresh = serializers.CharField(help_text="JWT refresh token — dùng gia hạn access token")


class TokenPairResponseSerializer(serializers.Serializer):
    access = serializers.CharField(help_text="JWT access token (thời hạn 2 giờ)")
    refresh = serializers.CharField(help_text="JWT refresh token (thời hạn 7 ngày)")


class TokenRefreshRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text="Refresh token nhận được khi đăng ký/đăng nhập")


class TokenVerifyRequestSerializer(serializers.Serializer):
    token = serializers.CharField(help_text="Access hoặc refresh token cần kiểm tra")


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="Tên đăng nhập")
    password = serializers.CharField(help_text="Mật khẩu", style={"input_type": "password"})


class VerifyDealerSerializer(serializers.Serializer):
    status = schema_choice_field(
        choices=["active", "rejected"],
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Bắt buộc khi status=rejected",
    )

    def validate(self, attrs):
        return require_rejection_reason(attrs, "status", "rejection_reason", {"rejected"})


class VerifySupplierSerializer(serializers.Serializer):
    verification_status = schema_choice_field(
        choices=["pending", "approved", "rejected"],
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Bắt buộc khi verification_status=rejected",
    )

    def validate(self, attrs):
        return require_rejection_reason(
            attrs,
            "verification_status",
            "rejection_reason",
            {"rejected"},
        )


class SupplierAccountStatusSerializer(serializers.Serializer):
    status = schema_choice_field(
        choices=["active", "inactive", "banned"],
    )
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Ghi chú lý do thay đổi trạng thái",
    )


_REFERENCE_TYPE_CHOICES = [
    "account_document",
    "purchase_order",
    "supplier_document",
    "supplier",
    "dealer",
    "category",
    "certification",
    "supplier_product",
    "dealer_product",
]


class MyNotificationItemSerializer(serializers.Serializer):
    receipt_id = serializers.IntegerField(help_text="ID bản ghi nhận thông báo (NotificationReceipt)")
    id = serializers.IntegerField(help_text="ID thông báo (Notification)")
    title = serializers.CharField(help_text="Tiêu đề thông báo")
    content = serializers.CharField(help_text="Nội dung chi tiết")
    type = schema_choice_field(
        choices=["info", "warning", "success", "error"],
    )
    type_label = serializers.CharField(help_text="Tên loại thông báo (tiếng Việt)")
    reference_type = schema_choice_field(
        choices=_REFERENCE_TYPE_CHOICES,
        allow_null=True,
        required=False,
    )
    reference_type_label = serializers.CharField(
        help_text="Tên nhóm đối tượng (tiếng Việt)",
    )
    reference_id = serializers.IntegerField(
        allow_null=True,
        help_text="ID đối tượng liên quan (vd. purchase_order id)",
    )
    reference_status = serializers.CharField(
        allow_null=True,
        required=False,
        help_text=(
            "Trạng thái phiếu nhập hiện tại — chỉ có khi reference_type=purchase_order "
            "(vd. confirmed, shipping, completed)"
        ),
    )
    reference_order_code = serializers.CharField(
        allow_null=True,
        required=False,
        help_text="Mã phiếu nhập — chỉ có khi reference_type=purchase_order",
    )
    read_at = serializers.DateTimeField(
        allow_null=True,
        help_text="Thời điểm đọc (null = chưa đọc)",
    )
    created_at = serializers.DateTimeField(help_text="Thời gian tạo thông báo")


def my_notification_list_response_schema():
    """Tạo schema response danh sách thông báo cá nhân (có unread_count và phân trang)."""
    return inline_serializer(
        name="MyNotificationListResponse",
        fields={
            "unread_count": serializers.IntegerField(
                help_text="Tổng số thông báo chưa đọc",
            ),
            "unread": MyNotificationItemSerializer(
                many=True,
                help_text="Danh sách thông báo chưa đọc (mới nhất trước)",
            ),
            "count": serializers.IntegerField(help_text="Tổng số bản ghi (cả đã đọc)"),
            "next": serializers.URLField(
                allow_null=True,
                help_text="URL trang tiếp theo (dùng cho load more)",
            ),
            "previous": serializers.URLField(
                allow_null=True,
                help_text="URL trang trước",
            ),
            "page": serializers.IntegerField(help_text="Trang hiện tại (bắt đầu từ 1)"),
            "page_size": serializers.IntegerField(help_text="Số bản ghi mỗi trang"),
            "has_more": serializers.BooleanField(
                help_text="true nếu còn dữ liệu để tải thêm",
            ),
            "results": MyNotificationItemSerializer(many=True),
        },
    )


class MarkReadResponseSerializer(serializers.Serializer):
    message = serializers.CharField(help_text="Thông báo kết quả")
    notification_id = serializers.IntegerField(
        help_text="ID thông báo vừa đánh dấu đọc (null khi mark_all_read)",
        allow_null=True,
        required=False,
    )
    updated = serializers.IntegerField(help_text="Số bản ghi được cập nhật")


SystemConfigResponseSerializer = inline_serializer(
    name="SystemConfigResponse",
    fields={
        "max_upload_image_size_mb": serializers.IntegerField(
            help_text="Dung lượng ảnh tối đa (MB)",
        ),
        "allowed_image_types": serializers.ListField(
            child=serializers.CharField(),
            help_text="Phần mở rộng ảnh cho phép (vd. .jpg, .png)",
        ),
        "max_categories_per_supplier": serializers.IntegerField(
            help_text="Số danh mục tối đa mỗi supplier/dealer",
        ),
        "max_products_per_supplier": serializers.IntegerField(
            help_text="Số sản phẩm tối đa mỗi NCC",
        ),
        "max_images_per_product": serializers.IntegerField(
            help_text="Số ảnh tối đa mỗi sản phẩm",
        ),
        "max_images_per_certification": serializers.IntegerField(
            help_text="Số ảnh tối đa mỗi chứng nhận",
        ),
        "max_login_attempts": serializers.IntegerField(
            help_text="Số lần đăng nhập sai tối đa trước khi khóa",
        ),
        "login_lockout_minutes": serializers.IntegerField(
            help_text="Thời gian khóa tài khoản (phút) sau khi vượt max_login_attempts",
        ),
        "min_order_amount": serializers.IntegerField(
            help_text="Tổng tiền đơn tối thiểu (VND)",
        ),
        "max_order_amount": serializers.IntegerField(
            help_text="Tổng tiền đơn tối đa (VND)",
        ),
        "min_deposit_percent": serializers.IntegerField(
            help_text="Tỷ lệ cọc tối thiểu (%)",
        ),
        "max_deposit_percent": serializers.IntegerField(
            help_text="Tỷ lệ cọc tối đa (%)",
        ),
        "min_delivery_lead_days": serializers.IntegerField(
            help_text="Số ngày tối thiểu trước thời gian giao mong muốn",
        ),
        "default_deposit_percent": serializers.IntegerField(
            help_text="Tỷ lệ cọc mặc định (%) khi NCC xác nhận phiếu nhập",
        ),
    },
)



from common.openapi_files import AvatarUploadForm  # noqa: F401 — re-export
