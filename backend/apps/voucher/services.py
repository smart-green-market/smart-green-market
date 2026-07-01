from decimal import Decimal
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.promotions.models import Promotion, PromotionStatus
from apps.dealer_products.models import DealerProduct

class CartVoucherService:
    """
    Service xử lý nghiệp vụ áp dụng voucher cho giỏ hàng.
    Chỉ nhận đầu vào đã được validate thô từ Serializer.
    """

    @staticmethod
    def apply_voucher(customer, voucher_code, items_data):
        now = timezone.now()

        # 1. Tìm voucher theo mã code
        try:
            voucher = Promotion.objects.prefetch_related("targets").get(code=voucher_code)
        except Promotion.DoesNotExist:
            raise ValidationError("Voucher không tồn tại.")

        # 2. Kiểm tra trạng thái của voucher (chỉ cho phép active)
        if voucher.status == PromotionStatus.INACTIVE:
            raise ValidationError("Voucher đã bị xóa hoặc tạm dừng.")
        elif voucher.status == PromotionStatus.PENDING:
            raise ValidationError("Voucher chưa được duyệt.")
        elif voucher.status == PromotionStatus.REJECTED:
            raise ValidationError("Voucher đã bị từ chối duyệt.")
        elif voucher.status != PromotionStatus.ACTIVE:
            raise ValidationError("Voucher không hoạt động.")

        # 3. Kiểm tra thời gian hiệu lực
        if voucher.start_date > now:
            raise ValidationError("Voucher chưa đến thời gian bắt đầu.")
        if voucher.end_date < now:
            raise ValidationError("Voucher đã hết hạn.")

        # 4. Kiểm tra giới hạn tổng số lần sử dụng trên toàn sàn
        if voucher.usage_limit is not None:
            global_usage = voucher.usages.count()
            if global_usage >= voucher.usage_limit:
                raise ValidationError("Voucher đã đạt giới hạn sử dụng.")

        # 5. Kiểm tra giới hạn số lần sử dụng của khách hàng này
        if voucher.usage_limit_per_customer is not None:
            customer_usage = voucher.usages.filter(order__customer=customer).count()
            if customer_usage >= voucher.usage_limit_per_customer:
                raise ValidationError("Customer đã sử dụng voucher.")

        # 6. Kiểm tra đối tượng khách hàng (all, segment, customer cụ thể)
        targets = voucher.targets.all()
        if targets.exists():
            has_customer_targets = False
            has_customer_match = False
            for target in targets:
                if target.target_type in ["all", "segment", "customer"]:
                    has_customer_targets = True
                    if target.target_type == "all":
                        has_customer_match = True
                    elif target.target_type == "segment":
                        if customer.segment_memberships.filter(segment_id=target.segment_id).exists():
                            has_customer_match = True
                    elif target.target_type == "customer":
                        if target.customer == customer:
                            has_customer_match = True
            if has_customer_targets and not has_customer_match:
                raise ValidationError("Voucher không áp dụng cho tài khoản của bạn.")

        # 7. Truy vấn giá sản phẩm từ database (Không tin tưởng giá FE gửi lên)
        product_ids = [item["dealer_product_id"] for item in items_data]
        products = DealerProduct.objects.filter(id__in=product_ids).select_related(
            "dealer_profile", "supplier_product", "category"
        )
        product_map = {p.id: p for p in products}

        # Đảm bảo toàn bộ sản phẩm trong request đều tồn tại trong DB
        for item in items_data:
            if item["dealer_product_id"] not in product_map:
                raise ValidationError(f"Sản phẩm ID {item['dealer_product_id']} không tồn tại.")

        # Tính tổng giá trị đơn hàng thực tế
        order_total = Decimal("0.00")
        for item in items_data:
            product = product_map[item["dealer_product_id"]]
            order_total += product.retail_price * item["quantity"]

        # 8. Xác định danh sách các sản phẩm thỏa mãn điều kiện voucher (eligible_items)
        has_product_or_category_targets = targets.filter(target_type__in=["product", "category"]).exists()
        eligible_total = Decimal("0.00")
        has_eligible_item = False

        for item in items_data:
            product = product_map[item["dealer_product_id"]]

            # Điều kiện giới hạn theo Dealer của Voucher (nếu có)
            if voucher.dealer and product.dealer_profile != voucher.dealer:
                continue

            # Điều kiện giới hạn theo Sản phẩm hoặc Danh mục cụ thể của Voucher
            if has_product_or_category_targets:
                matched = False
                for target in targets:
                    if target.target_type == "product" and target.dealer_product_id == product.id:
                        matched = True
                        break
                    elif target.target_type == "category" and target.category_id == product.category_id:
                        matched = True
                        break
                if not matched:
                    continue

            # Nếu thỏa mãn toàn bộ các điều kiện trên
            has_eligible_item = True
            eligible_total += product.retail_price * item["quantity"]

        # Báo lỗi nếu giỏ hàng không có sản phẩm nào thuộc phạm vi áp dụng của voucher
        if not has_eligible_item:
            raise ValidationError("Voucher không áp dụng cho sản phẩm trong giỏ hàng.")

        # 9. Kiểm tra giá trị tối thiểu của đơn hàng để kích hoạt voucher
        if order_total < voucher.min_order_amount:
            raise ValidationError("Chưa đạt giá trị đơn hàng tối thiểu.")

        # 10. Tính toán số tiền được giảm giá
        if voucher.discount_type == "percent":
            discount_amount = (eligible_total * voucher.discount_value) / Decimal("100")
            if voucher.max_discount_amount is not None:
                discount_amount = min(discount_amount, voucher.max_discount_amount)
        else:
            discount_amount = voucher.discount_value

        # Số tiền giảm giá không được vượt quá tổng giá trị các sản phẩm được áp dụng
        discount_amount = min(discount_amount, eligible_total)

        final_total = order_total - discount_amount

        return {
            "voucher": {
                "id": voucher.id,
                "code": voucher.code,
                "title": voucher.title,
                "discount_type": voucher.discount_type,
                "discount_value": "{:.2f}".format(voucher.discount_value),
                "min_order_amount": "{:.2f}".format(voucher.min_order_amount)
            },
            "order_total": "{:.2f}".format(order_total),
            "discount_amount": "{:.2f}".format(discount_amount),
            "final_total": "{:.2f}".format(final_total)
        }
