from decimal import Decimal
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.promotions.models import (
    CustomerSavedVoucher,
    Promotion,
    PromotionStatus,
    PromotionUsage,
    PRODUCT_TARGET_TYPES,
    PromotionTargetType,
)
from apps.dealer_products.models import DealerProduct
from .audience_service import validate_voucher_audience_for_customer


def normalize_decimal(val):
    if val is None:
        return None
    if not isinstance(val, Decimal):
        try:
            val = Decimal(str(val))
        except Exception:
            return val
    normalized = val.normalize()
    if normalized == normalized.to_integral_value():
        return int(normalized)
    return float(normalized)


class CartVoucherService:
    """
    Service xử lý nghiệp vụ áp dụng voucher cho giỏ hàng.
    Chỉ nhận đầu vào đã được validate thô từ Serializer.
    """

    @staticmethod
    def _get_voucher(voucher_code):
        try:
            return Promotion.objects.prefetch_related(
                "targets",
                "loyalty_tiers",
            ).get(code=voucher_code)
        except Promotion.DoesNotExist:
            raise ValidationError({"voucher_code": ["Voucher không tồn tại."]})

    @staticmethod
    def _validate_voucher_state(voucher):
        now = timezone.now()
        if voucher.status == PromotionStatus.INACTIVE:
            raise ValidationError({"voucher_code": ["Voucher đã bị xóa hoặc tạm dừng."]})
        if voucher.status == PromotionStatus.PENDING:
            raise ValidationError({"voucher_code": ["Voucher chưa được duyệt."]})
        if voucher.status == PromotionStatus.REJECTED:
            raise ValidationError({"voucher_code": ["Voucher đã bị từ chối duyệt."]})
        if voucher.status != PromotionStatus.ACTIVE:
            raise ValidationError({"voucher_code": ["Voucher không hoạt động."]})

        if voucher.start_date > now:
            raise ValidationError({"voucher_code": ["Voucher chưa đến thời gian bắt đầu."]})
        if voucher.end_date < now:
            raise ValidationError({"voucher_code": ["Voucher đã hết hạn."]})
        if not voucher.is_within_daily_time(now):
            raise ValidationError({"voucher_code": ["Voucher chưa đến khung giờ áp dụng trong ngày."]})

    @staticmethod
    def _validate_saved(customer, voucher):
        if not CustomerSavedVoucher.objects.filter(
            customer=customer,
            promotion=voucher,
        ).exists():
            raise ValidationError({"voucher_code": ["Bạn cần lưu voucher trước khi áp dụng."]})

    @staticmethod
    def _validate_usage_limits(customer, voucher):
        if voucher.usage_limit is not None:
            global_usage = voucher.usages.count()
            if global_usage >= voucher.usage_limit:
                raise ValidationError({"voucher_code": ["Voucher đã đạt giới hạn sử dụng."]})

        if voucher.usage_limit_per_customer is not None:
            customer_usage = voucher.usages.filter(order__customer=customer).count()
            if customer_usage >= voucher.usage_limit_per_customer:
                raise ValidationError({"voucher_code": ["Customer đã sử dụng voucher."]})

    @staticmethod
    def _validate_common(customer, voucher, *, require_saved=True):
        CartVoucherService._validate_voucher_state(voucher)
        if require_saved:
            CartVoucherService._validate_saved(customer, voucher)
        CartVoucherService._validate_usage_limits(customer, voucher)
        validate_voucher_audience_for_customer(
            voucher,
            customer,
            error_field="voucher_code",
        )
        return voucher.targets.all()

    @staticmethod
    def _product_matches_voucher(voucher, targets, product):
        if voucher.dealer and product.dealer_profile != voucher.dealer:
            return False

        has_product_or_category_targets = targets.filter(
            target_type__in=PRODUCT_TARGET_TYPES,
        ).exists()
        if not has_product_or_category_targets:
            return True

        for target in targets:
            if (
                target.target_type == PromotionTargetType.PRODUCT
                and target.dealer_product_id == product.id
            ):
                return True
            if (
                target.target_type == PromotionTargetType.CATEGORY
                and target.category_id == product.category_id
            ):
                return True
        return False

    @staticmethod
    def _calculate_discount(voucher, eligible_total):
        if voucher.discount_type == "percent":
            discount_amount = (eligible_total * voucher.discount_value) / Decimal("100")
            if voucher.max_discount_amount is not None:
                discount_amount = min(discount_amount, voucher.max_discount_amount)
        else:
            discount_amount = voucher.discount_value
        return min(discount_amount, eligible_total)

    @staticmethod
    def apply_voucher(customer, voucher_code, items_data, *, require_saved=True):
        voucher = CartVoucherService._get_voucher(voucher_code)
        targets = CartVoucherService._validate_common(
            customer,
            voucher,
            require_saved=require_saved,
        )

        product_ids = [item["dealer_product_id"] for item in items_data]
        products = DealerProduct.objects.filter(id__in=product_ids).select_related(
            "dealer_profile", "supplier_product", "category"
        )
        product_map = {p.id: p for p in products}

        # Đảm bảo toàn bộ sản phẩm trong request đều tồn tại trong DB
        for item in items_data:
            if item["dealer_product_id"] not in product_map:
                raise ValidationError(
                    {
                        "voucher_code": [
                            f"Sản phẩm ID {item['dealer_product_id']} không tồn tại."
                        ]
                    }
                )

        # Tính tổng giá trị đơn hàng thực tế
        order_total = Decimal("0.00")
        for item in items_data:
            product = product_map[item["dealer_product_id"]]
            order_total += product.retail_price * item["quantity"]

        eligible_total = Decimal("0.00")
        has_eligible_item = False

        for item in items_data:
            product = product_map[item["dealer_product_id"]]

            if not CartVoucherService._product_matches_voucher(voucher, targets, product):
                continue

            # Nếu thỏa mãn toàn bộ các điều kiện trên
            has_eligible_item = True
            eligible_total += product.retail_price * item["quantity"]

        # Báo lỗi nếu giỏ hàng không có sản phẩm nào thuộc phạm vi áp dụng của voucher
        if not has_eligible_item:
            raise ValidationError(
                {"voucher_code": ["Voucher không áp dụng cho sản phẩm trong giỏ hàng."]}
            )

        if order_total < voucher.min_order_amount:
            raise ValidationError(
                {"voucher_code": ["Chưa đạt giá trị đơn hàng tối thiểu."]}
            )

        discount_amount = CartVoucherService._calculate_discount(voucher, eligible_total)
        final_total = order_total - discount_amount

        return {
            "voucher": {
                "id": voucher.id,
                "code": voucher.code,
                "title": voucher.title,
                "discount_type": voucher.discount_type,
                "discount_value": normalize_decimal(voucher.discount_value),
                "min_order_amount": normalize_decimal(voucher.min_order_amount)
            },
            "order_total": normalize_decimal(order_total),
            "discount_amount": normalize_decimal(discount_amount),
            "final_total": normalize_decimal(final_total)
        }

    @staticmethod
    def apply_voucher_to_order(order, voucher_code, *, require_saved=True):
        voucher = CartVoucherService._get_voucher(voucher_code)
        customer = order.customer
        targets = CartVoucherService._validate_common(
            customer,
            voucher,
            require_saved=require_saved,
        )

        eligible_total = Decimal("0.00")
        for item in order.items.select_related("dealer_product__dealer_profile", "dealer_product__category"):
            product = item.dealer_product
            if CartVoucherService._product_matches_voucher(voucher, targets, product):
                eligible_total += item.subtotal

        if eligible_total <= 0:
            raise ValidationError(
                {"voucher_code": ["Voucher không áp dụng cho sản phẩm trong đơn hàng."]}
            )
        if order.subtotal_amount < voucher.min_order_amount:
            raise ValidationError(
                {"voucher_code": ["Chưa đạt giá trị đơn hàng tối thiểu."]}
            )

        discount_amount = CartVoucherService._calculate_discount(voucher, eligible_total)
        PromotionUsage.objects.create(
            promotion=voucher,
            order=order,
            discount_amount=discount_amount,
        )
        return voucher, discount_amount
