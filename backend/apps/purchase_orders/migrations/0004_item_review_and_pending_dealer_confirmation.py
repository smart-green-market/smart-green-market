# Generated manually for item review + pending_dealer_confirmation

from django.db import migrations, models


def backfill_original_quantity(apps, schema_editor):
    PurchaseOrderItem = apps.get_model("purchase_orders", "PurchaseOrderItem")
    for item in PurchaseOrderItem.objects.all().iterator():
        if item.original_quantity is None:
            item.original_quantity = item.quantity
            item.save(update_fields=["original_quantity"])


def backfill_review_status(apps, schema_editor):
    PurchaseOrderItem = apps.get_model("purchase_orders", "PurchaseOrderItem")
    PurchaseOrder = apps.get_model("purchase_orders", "PurchaseOrder")
    past_confirm = PurchaseOrder.objects.exclude(
        status="pending_supplier_confirmation",
    ).values_list("id", flat=True)
    PurchaseOrderItem.objects.filter(
        purchase_order_id__in=past_confirm,
        review_status="pending",
    ).update(review_status="approved")


class Migration(migrations.Migration):

    dependencies = [
        ("purchase_orders", "0003_purchaseorder_cancel_reason_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="purchaseorderitem",
            name="original_quantity",
            field=models.DecimalField(
                decimal_places=2,
                help_text="Số lượng dealer đặt ban đầu — dùng so sánh khi NCC điều chỉnh.",
                max_digits=12,
                null=True,
            ),
        ),
        migrations.RunPython(backfill_original_quantity, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="purchaseorderitem",
            name="original_quantity",
            field=models.DecimalField(
                decimal_places=2,
                help_text="Số lượng dealer đặt ban đầu — dùng so sánh khi NCC điều chỉnh.",
                max_digits=12,
            ),
        ),
        migrations.AddField(
            model_name="purchaseorderitem",
            name="rejection_reason",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="purchaseorderitem",
            name="review_status",
            field=models.CharField(
                choices=[
                    ("pending", "Chờ duyệt"),
                    ("approved", "Đã duyệt"),
                    ("rejected", "Từ chối"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.RunPython(backfill_review_status, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="purchaseorder",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending_supplier_confirmation", "Chờ NCC xác nhận"),
                    ("rejected", "NCC từ chối"),
                    ("pending_dealer_confirmation", "Chờ đại lý xác nhận điều chỉnh"),
                    ("confirmed", "NCC đã xác nhận"),
                    ("deposit_pending_verification", "Chờ xác nhận tiền cọc"),
                    ("deposit_paid", "Đã thanh toán cọc"),
                    ("processing", "Đang chuẩn bị hàng"),
                    ("shipping", "Đang giao hàng"),
                    ("delivered", "Đã giao hàng"),
                    (
                        "final_payment_pending_verification",
                        "Chờ xác nhận thanh toán cuối",
                    ),
                    ("return_requested", "Yêu cầu trả hàng"),
                    ("return_approved", "Đã duyệt trả hàng"),
                    ("return_rejected", "Từ chối trả hàng"),
                    ("returned", "Đã trả hàng"),
                    ("completed", "Hoàn tất"),
                    ("cancelled", "Đã hủy"),
                ],
                default="pending_supplier_confirmation",
                max_length=40,
            ),
        ),
    ]
