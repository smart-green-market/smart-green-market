"""Hạng thành viên và điểm tích lũy theo từng đại lý."""

from django.conf import settings
from django.db import models
from django.db.models import Q


class LoyaltyPointTransactionType(models.TextChoices):
    ORDER_REWARD = "ORDER_REWARD", "Cộng điểm từ đơn hàng"
    RETURN_DEDUCTION = "RETURN_DEDUCTION", "Trừ điểm do hoàn hàng"
    MANUAL_ADD = "MANUAL_ADD", "Cộng điểm thủ công"
    MANUAL_DEDUCT = "MANUAL_DEDUCT", "Trừ điểm thủ công"


class DealerLoyaltySettings(models.Model):
    """Cấu hình tích điểm của một cửa hàng đại lý."""

    dealer = models.OneToOneField(
        "dealers.DealerProfile",
        on_delete=models.CASCADE,
        related_name="loyalty_config",
    )
    points_per_unit = models.PositiveIntegerField(
        default=10_000,
        help_text="Số tiền (VND) quy đổi thành 1 điểm, vd. 10000 = 1 điểm.",
    )
    include_shipping_in_points = models.BooleanField(
        default=False,
        help_text="Nếu bật, tính điểm trên total_amount (gồm phí ship).",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "loyalty_configs"
        verbose_name = "Loyalty Config"
        verbose_name_plural = "Loyalty Configs"

    def __str__(self):
        return f"DealerLoyaltySettings(dealer={self.dealer_id})"


class LoyaltyTier(models.Model):
    """Hạng thành viên công khai theo từng đại lý."""

    dealer = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.CASCADE,
        related_name="loyalty_tiers",
    )
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=100)
    level = models.PositiveSmallIntegerField()
    min_points = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    benefits = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    is_system = models.BooleanField(
        default=False,
        help_text="Hạng mặc định do hệ thống tạo",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "loyalty_tiers"
        ordering = ["level", "min_points", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["dealer", "code"],
                name="unique_loyalty_tier_code_per_dealer",
            ),
            models.UniqueConstraint(
                fields=["dealer", "level"],
                name="unique_loyalty_tier_level_per_dealer",
            ),
        ]

    def __str__(self):
        return f"{self.dealer_id}:{self.code}"


class LoyaltyPointTransaction(models.Model):
    """Sổ cái cộng/trừ điểm — mỗi đơn chỉ cộng điểm một lần."""

    customer_profile = models.ForeignKey(
        "customers.CustomerProfile",
        on_delete=models.CASCADE,
        related_name="loyalty_point_transactions",
    )
    dealer = models.ForeignKey(
        "dealers.DealerProfile",
        on_delete=models.CASCADE,
        related_name="loyalty_point_transactions",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loyalty_point_transactions",
    )
    transaction_type = models.CharField(
        max_length=32,
        choices=LoyaltyPointTransactionType.choices,
    )
    points = models.PositiveIntegerField(
        help_text="Số điểm thay đổi (luôn dương, loại giao dịch quyết định cộng/trừ).",
    )
    balance_before = models.PositiveIntegerField()
    balance_after = models.PositiveIntegerField()
    reason = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loyalty_point_transactions_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "loyalty_point_transactions"
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["order"],
                condition=Q(transaction_type=LoyaltyPointTransactionType.ORDER_REWARD),
                name="unique_order_reward_loyalty_transaction",
            ),
        ]

    def __str__(self):
        return f"{self.transaction_type}:{self.points}@{self.customer_profile_id}"


class CustomerTierHistory(models.Model):
    """Lịch sử thay đổi hạng thành viên."""

    customer_profile = models.ForeignKey(
        "customers.CustomerProfile",
        on_delete=models.CASCADE,
        related_name="tier_histories",
    )
    old_tier = models.ForeignKey(
        LoyaltyTier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tier_history_from",
    )
    new_tier = models.ForeignKey(
        LoyaltyTier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tier_history_to",
    )
    reason = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "customer_tier_histories"
        ordering = ["-changed_at", "-id"]

    def __str__(self):
        return f"{self.customer_profile_id}:{self.old_tier_id}->{self.new_tier_id}"
