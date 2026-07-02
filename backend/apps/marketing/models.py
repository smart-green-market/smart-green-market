"""Phân nhóm khách hàng và tương tác trên gian hàng đại lý."""

from django.db import models


class CustomerSegment(models.Model):
    """Nhóm khách hàng — gán member qua CustomerProfile."""

    code = models.CharField(
        max_length=50,
        help_text="Mã nội bộ: vip, loyal, new, organic_lover...",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_system = models.BooleanField(
        default=False,
        help_text="true nếu là segment mẫu do hệ thống tạo",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customer_segments"
        ordering = ["name", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["code"],
                name="unique_customer_segment_code",
            ),
        ]

    def __str__(self):
        return self.name


class CustomerSegmentMember(models.Model):
    """Khách hàng thuộc một segment."""

    customer_profile = models.ForeignKey(
        "customers.CustomerProfile",
        on_delete=models.CASCADE,
        related_name="segment_memberships",
    )
    segment = models.ForeignKey(
        CustomerSegment,
        on_delete=models.CASCADE,
        related_name="members",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "customer_segment_members"
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["customer_profile", "segment"],
                name="unique_customer_segment_membership",
            ),
        ]

    def __str__(self):
        return f"{self.customer_profile} → {self.segment.name}"


class CustomerInteraction(models.Model):
    """Tổng hợp tương tác buyer với sản phẩm trên gian hàng (aggregate + timestamp)."""

    customer = models.ForeignKey(
        "customers.CustomerProfile",
        on_delete=models.CASCADE,
        related_name="product_interactions",
    )
    dealer = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.CASCADE,
        related_name="customer_interactions",
    )
    dealer_product = models.ForeignKey(
        "dealer_products.DealerProduct",
        on_delete=models.CASCADE,
        related_name="customer_interactions",
    )

    view_count = models.PositiveIntegerField(default=0)
    add_cart_count = models.PositiveIntegerField(default=0)
    purchase_count = models.PositiveIntegerField(default=0)

    last_viewed_at = models.DateTimeField(null=True, blank=True)
    last_added_at = models.DateTimeField(null=True, blank=True)
    last_purchased_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customer_interactions"
        ordering = ["-updated_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "dealer_product"],
                name="unique_customer_product_interaction",
            ),
        ]
        indexes = [
            models.Index(fields=["dealer", "-updated_at"]),
        ]

    def __str__(self):
        return f"{self.customer} × {self.dealer_product.title}"


class DealerSupplierProductInteraction(models.Model):
    """Tổng hợp tương tác đại lý với sản phẩm NCC trên catalog B2B."""

    dealer = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.CASCADE,
        related_name="supplier_product_interactions",
    )
    supplier = models.ForeignKey(
        "suppliers.Supplier",
        on_delete=models.CASCADE,
        related_name="dealer_product_interactions",
    )
    supplier_product = models.ForeignKey(
        "supplier_products.SupplierProduct",
        on_delete=models.CASCADE,
        related_name="dealer_interactions",
    )

    view_count = models.PositiveIntegerField(default=0)
    add_cart_count = models.PositiveIntegerField(default=0)
    purchase_count = models.PositiveIntegerField(default=0)

    last_viewed_at = models.DateTimeField(null=True, blank=True)
    last_added_at = models.DateTimeField(null=True, blank=True)
    last_purchased_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dealer_supplier_product_interactions"
        ordering = ["-updated_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["dealer", "supplier_product"],
                name="unique_dealer_supplier_product_interaction",
            ),
        ]
        indexes = [
            models.Index(fields=["supplier", "-updated_at"]),
            models.Index(fields=["dealer", "-updated_at"]),
        ]

    def __str__(self):
        return f"{self.dealer.store_name} × {self.supplier_product.name}"
