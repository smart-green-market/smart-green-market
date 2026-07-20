from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum, Count, F, Q, ExpressionWrapper, DecimalField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, inline_serializer

from apps.orders.models import Order, OrderStatus, OrderItem
from apps.purchase_orders.models import (
    PurchaseOrder,
    PurchaseOrderStatus,
    PurchaseOrderItem,
    PurchaseOrderReturn,
    PurchaseOrderReturnStatus,
)
from apps.dealer_products.models import DealerInventoryBatch, DealerInventoryWastage


class DealerStatisticalViewSet(viewsets.ViewSet):
    """
    ViewSet cung cấp các API thống kê chi tiết cho Đại lý (Dealer).
    Yêu cầu đăng nhập tài khoản Đại lý.
    """
    permission_classes = [IsAuthenticated]

    def _get_dealer(self, request):
        return getattr(request.user, "dealer_profile", None)

    @extend_schema(
        summary="Thống kê chi tiết Đại lý theo khoảng thời gian",
        tags=["Statistical"],
        description="Lấy dữ liệu thống kê tài chính, biểu đồ doanh thu vs chi phí nhập, cơ cấu mặt hàng, hao hụt tồn kho và bảng chi tiết phân tích theo mốc thời gian lọc.",
        responses={
            200: inline_serializer(
                name="DealerStatisticalResponse",
                fields={
                    "metrics": inline_serializer(
                        name="DealerStatsMetrics",
                        fields={
                            "total_revenue": serializers.FloatField(),
                            "total_purchase_cost": serializers.FloatField(),
                            "gross_profit": serializers.FloatField(),
                            "profit_margin": serializers.FloatField(),
                            "completed_sales_count": serializers.IntegerField(),
                            "completed_purchases_count": serializers.IntegerField(),
                        }
                    ),
                    "chart_data": inline_serializer(
                        name="DealerStatsChartItem",
                        fields={
                            "label": serializers.CharField(),
                            "sales": serializers.FloatField(),
                            "purchases": serializers.FloatField(),
                        },
                        many=True
                    ),
                    "category_distribution": inline_serializer(
                        name="DealerStatsCategoryItem",
                        fields={
                            "category": serializers.CharField(),
                            "sales": serializers.FloatField(),
                            "purchases": serializers.FloatField(),
                        },
                        many=True
                    ),
                    "wastage_stats": inline_serializer(
                        name="DealerStatsWastage",
                        fields={
                            "total_wastage_quantity": serializers.IntegerField(),
                            "total_wastage_cost": serializers.FloatField(),
                            "total_returned_quantity": serializers.IntegerField(),
                            "total_returned_cost": serializers.FloatField(),
                        }
                    ),
                    "detailed_breakdown": inline_serializer(
                        name="DealerStatsBreakdownItem",
                        fields={
                            "period": serializers.CharField(),
                            "sales_count": serializers.IntegerField(),
                            "revenue": serializers.FloatField(),
                            "purchase_count": serializers.IntegerField(),
                            "purchase_cost": serializers.FloatField(),
                            "profit": serializers.FloatField(),
                        },
                        many=True
                    )
                }
            ),
            403: inline_serializer(
                name="DealerStatsForbidden",
                fields={"detail": serializers.CharField()}
            )
        }
    )
    @action(detail=False, methods=["get"], url_path="statistics")
    def statistics(self, request):
        dealer = self._get_dealer(request)
        if not dealer:
            return Response({"detail": "User is not a dealer."}, status=403)

        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")
        group_by = request.query_params.get("group_by", "day")  # day, week, month

        # 1. Parse dates (Default to first day of current month -> today)
        try:
            today = timezone.now().date()
            if start_date_str:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            else:
                start_date = today.replace(day=1)

            if end_date_str:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            else:
                end_date = today
        except ValueError:
            return Response({"detail": "Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD."}, status=400)

        # Tránh lỗi đầu vào sai lệch khoảng thời gian
        if start_date > end_date:
            start_date, end_date = end_date, start_date

        # 2. Query Orders (Bán lẻ) & PurchaseOrders (Nhập sỉ) trong khoảng thời gian
        orders_in_range = Order.objects.filter(
            dealer=dealer,
            status__in=[OrderStatus.COMPLETED, OrderStatus.DELIVERED],
            created_at__date__range=[start_date, end_date]
        )

        purchases_in_range = PurchaseOrder.objects.filter(
            dealer=dealer,
            status__in=[PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.DELIVERED],
            created_at__date__range=[start_date, end_date]
        )

        # 3. Calculate Overview Metrics
        total_revenue = orders_in_range.aggregate(total=Sum("total_amount"))["total"] or 0
        total_purchase_cost = purchases_in_range.aggregate(total=Sum("total_amount"))["total"] or 0

        # Calculate actual Cost of Goods Sold (COGS) from completed retail order items
        total_cogs = OrderItem.objects.filter(
            order__in=orders_in_range
        ).annotate(
            item_cogs=ExpressionWrapper(
                F("import_price") * F("quantity"),
                output_field=DecimalField(max_digits=14, decimal_places=2)
            )
        ).aggregate(total=Sum("item_cogs"))["total"] or 0

        gross_profit = total_revenue - total_cogs
        profit_margin = round((float(gross_profit) / float(total_revenue)) * 100, 2) if total_revenue > 0 else 0.0

        metrics = {
            "total_revenue": float(total_revenue),
            "total_purchase_cost": float(total_purchase_cost),
            "gross_profit": float(gross_profit),
            "profit_margin": profit_margin,
            "completed_sales_count": orders_in_range.count(),
            "completed_purchases_count": purchases_in_range.count(),
        }

        # 4. Group data by day/week/month for Chart & Table
        if group_by == "month":
            trunc_func = TruncMonth
        elif group_by == "week":
            trunc_func = TruncWeek
        else:
            trunc_func = TruncDate

        sales_grouped = orders_in_range.annotate(
            period=trunc_func("created_at")
        ).values("period").annotate(
            total=Sum("total_amount"),
            count=Count("id")
        ).order_by("period")

        purchases_grouped = purchases_in_range.annotate(
            period=trunc_func("created_at")
        ).values("period").annotate(
            total=Sum("total_amount"),
            count=Count("id")
        ).order_by("period")

        # Group COGS by period for detailed breakdown
        cogs_grouped = OrderItem.objects.filter(
            order__in=orders_in_range
        ).annotate(
            period=trunc_func("order__created_at"),
            item_cogs=ExpressionWrapper(
                F("import_price") * F("quantity"),
                output_field=DecimalField(max_digits=14, decimal_places=2)
            )
        ).values("period").annotate(
            total=Sum("item_cogs")
        ).order_by("period")

        # Initialize chart keys depending on group_by to fill missing periods with 0
        chart_dict = {}
        if group_by == "month":
            curr = start_date.replace(day=1)
            while curr <= end_date:
                key = curr.strftime("%Y-%m")
                chart_dict[key] = {"sales": 0.0, "purchases": 0.0, "sales_count": 0, "purchase_count": 0, "cogs": 0.0}
                # Move to next month
                next_month = curr.replace(day=28) + timedelta(days=4)
                curr = next_month.replace(day=1)
        elif group_by == "week":
            # Align start_date to Monday of its week
            start_monday = start_date - timedelta(days=start_date.weekday())
            curr = start_monday
            while curr <= end_date:
                key = str(curr)
                chart_dict[key] = {"sales": 0.0, "purchases": 0.0, "sales_count": 0, "purchase_count": 0, "cogs": 0.0}
                curr += timedelta(days=7)
        else:  # day
            curr = start_date
            while curr <= end_date:
                key = str(curr)
                chart_dict[key] = {"sales": 0.0, "purchases": 0.0, "sales_count": 0, "purchase_count": 0, "cogs": 0.0}
                curr += timedelta(days=1)

        # Helper to match group format
        def get_period_key(period_val, mode):
            if not period_val:
                return None
            if isinstance(period_val, datetime):
                period_val = period_val.date()
            if mode == "month":
                return period_val.strftime("%Y-%m")
            elif mode == "week":
                monday = period_val - timedelta(days=period_val.weekday())
                return str(monday)
            else:
                return str(period_val)

        # Fill values into dict
        for item in sales_grouped:
            k = get_period_key(item["period"], group_by)
            if k in chart_dict:
                chart_dict[k]["sales"] = float(item["total"] or 0)
                chart_dict[k]["sales_count"] = item["count"]

        for item in purchases_grouped:
            k = get_period_key(item["period"], group_by)
            if k in chart_dict:
                chart_dict[k]["purchases"] = float(item["total"] or 0)
                chart_dict[k]["purchase_count"] = item["count"]

        for item in cogs_grouped:
            k = get_period_key(item["period"], group_by)
            if k in chart_dict:
                chart_dict[k]["cogs"] = float(item["total"] or 0)

        # Convert to chart_data list (chronological) & detailed_breakdown (reverse chronological)
        chart_data = []
        detailed_breakdown = []
        for k, v in chart_dict.items():
            chart_data.append({
                "label": k,
                "sales": v["sales"],
                "purchases": v["purchases"]
            })
            detailed_breakdown.append({
                "period": k,
                "sales_count": v["sales_count"],
                "revenue": v["sales"],
                "purchase_count": v["purchase_count"],
                "purchase_cost": v["purchases"],
                "profit": v["sales"] - v["cogs"]
            })

        detailed_breakdown.sort(key=lambda x: x["period"], reverse=True)

        # 5. Product Category Distribution
        sales_categories = OrderItem.objects.filter(
            order__in=orders_in_range
        ).values(
            "dealer_product__category__name"
        ).annotate(
            total=Sum("subtotal")
        ).order_by("-total")

        purchase_categories = PurchaseOrderItem.objects.filter(
            purchase_order__in=purchases_in_range
        ).values(
            "supplier_product__category__name"
        ).annotate(
            total=Sum("subtotal")
        ).order_by("-total")

        cat_dict = {}
        for item in sales_categories:
            cat = item["dealer_product__category__name"] or "Chưa phân loại"
            if cat not in cat_dict:
                cat_dict[cat] = {"sales": 0.0, "purchases": 0.0}
            cat_dict[cat]["sales"] = float(item["total"] or 0)

        for item in purchase_categories:
            cat = item["supplier_product__category__name"] or "Chưa phân loại"
            if cat not in cat_dict:
                cat_dict[cat] = {"sales": 0.0, "purchases": 0.0}
            cat_dict[cat]["purchases"] = float(item["total"] or 0)

        category_distribution = [
            {
                "category": k,
                "sales": v["sales"],
                "purchases": v["purchases"]
            }
            for k, v in cat_dict.items()
        ]

        # 6. Wastage & Returns Stats
        wastages_in_range = DealerInventoryWastage.objects.filter(
            batch__dealer_product__dealer_profile=dealer,
            created_at__date__range=[start_date, end_date]
        )
        total_wastage_quantity = wastages_in_range.aggregate(total=Sum("quantity"))["total"] or 0
        total_wastage_cost = wastages_in_range.annotate(
            cost=ExpressionWrapper(F("quantity") * F("batch__import_price"), output_field=DecimalField())
        ).aggregate(total=Sum("cost"))["total"] or 0

        returns_in_range = PurchaseOrderReturn.objects.filter(
            purchase_order__dealer=dealer,
            status=PurchaseOrderReturnStatus.APPROVED,
            created_at__date__range=[start_date, end_date]
        )
        total_returned_refund = returns_in_range.aggregate(total=Sum("refund_amount"))["total"] or 0

        # We can also compute total quantity of returned items if needed
        # (Assuming returns in range count is simple, let's also query PurchaseOrderReturnItem to count returned products)
        # But quantity can be aggregated from items or returns:
        # Let's count resolved returns count or just use returned items count. We'll return count of returned requests:
        total_returned_qty = 0
        from apps.purchase_orders.models import PurchaseOrderReturnItem
        returned_items = PurchaseOrderReturnItem.objects.filter(
            purchase_order_return__in=returns_in_range
        )
        total_returned_qty = returned_items.aggregate(total=Sum("quantity"))["total"] or 0

        wastage_stats = {
            "total_wastage_quantity": total_wastage_quantity,
            "total_wastage_cost": float(total_wastage_cost),
            "total_returned_quantity": total_returned_qty,
            "total_returned_cost": float(total_returned_refund),
        }

        # 7. Package Response
        return Response({
            "metrics": metrics,
            "chart_data": chart_data,
            "category_distribution": category_distribution,
            "wastage_stats": wastage_stats,
            "detailed_breakdown": detailed_breakdown,
        })
