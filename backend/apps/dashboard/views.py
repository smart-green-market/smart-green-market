from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, F, Q, ExpressionWrapper, DurationField
from django.db.models.functions import TruncDate, TruncMonth
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiResponse

from apps.orders.models import Order, OrderStatus, OrderItem
from apps.dealer_products.inventory_expiry import mark_expired_inventory_batches
from apps.dealer_products.models import DealerInventoryBatch, DealerInventoryBatchStatus
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus
from apps.accounts.models import Account, AccountRole, AccountStatus

class DealerDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet cung cấp các API cho Dashboard của Đại lý (Dealer).
    Yêu cầu người dùng phải đăng nhập (IsAuthenticated).
    """
    permission_classes = [IsAuthenticated]

    def _get_dealer(self, request):
        """
        Hàm trợ giúp để lấy thông tin DealerProfile của người dùng hiện tại.
        """
        return getattr(request.user, 'dealer_profile', None)

    @extend_schema(
        summary="Tổng quan Dashboard Đại lý",
        tags=["Dashboard"],
        description="Lấy thông tin tổng quan của đại lý bao gồm: Doanh thu hôm nay (và % tăng trưởng so với hôm qua), số đơn hàng mới/đang chờ, tổng tồn kho và số lượng cảnh báo (hết hạn/sắp hết hàng).",
        responses={
            200: inline_serializer(
                name='DealerDashboardSummaryResponse',
                fields={
                    'revenue': inline_serializer(
                        name='DealerRevenueSummary',
                        fields={
                            'today': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Doanh thu ngày hôm nay"),
                            'change_percent': serializers.DecimalField(max_digits=5, decimal_places=2, help_text="% thay đổi so với hôm qua")
                        }
                    ),
                    'orders': inline_serializer(
                        name='DealerOrdersSummary',
                        fields={
                            'new_today': serializers.IntegerField(help_text="Đơn hàng mới tạo hôm nay"),
                            'pending': serializers.IntegerField(help_text="Đơn hàng đang chờ xử lý")
                        }
                    ),
                    'inventory': inline_serializer(
                        name='DealerInventorySummary',
                        fields={
                            'total_quantity': serializers.IntegerField(help_text="Tổng số lượng sản phẩm tồn kho"),
                            'new_types_today': serializers.IntegerField(help_text="Số loại sản phẩm nhập mới hôm nay")
                        }
                    ),
                    'alerts': inline_serializer(
                        name='DealerAlertsSummary',
                        fields={
                            'count': serializers.IntegerField(help_text="Số cảnh báo tồn kho thấp hoặc sắp hết hạn")
                        }
                    )
                }
            ),
            403: OpenApiResponse(description="User is not a dealer.")
        }
    )
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        API: GET /api/dashboard/summary/
        Lấy thông tin tổng quan của đại lý bao gồm: Doanh thu hôm nay (và % tăng trưởng),
        số đơn hàng mới/đang chờ, tổng tồn kho và số lượng cảnh báo (hết hạn/sắp hết hàng).
        """
        dealer = self._get_dealer(request)
        if not dealer:
            return Response({"detail": "User is not a dealer."}, status=403)

        mark_expired_inventory_batches(dealer_profile_id=dealer.id)

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)

        # 1. Doanh thu (Revenue)
        completed_orders = Order.objects.filter(
            dealer=dealer,
            status__in=[OrderStatus.COMPLETED, OrderStatus.DELIVERED]
        )
        
        # Doanh thu ngày hôm nay
        today_revenue = completed_orders.filter(
            updated_at__gte=today_start
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Doanh thu ngày hôm qua
        yesterday_revenue = completed_orders.filter(
            updated_at__gte=yesterday_start,
            updated_at__lt=today_start
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Tính tỷ lệ phần trăm thay đổi doanh thu
        if yesterday_revenue > 0:
            revenue_change_percent = ((today_revenue - yesterday_revenue) / yesterday_revenue) * 100
        else:
            revenue_change_percent = 100 if today_revenue > 0 else 0

        # 2. Đơn hàng mới (New Orders)
        # Số đơn hàng được tạo hôm nay
        new_orders_count = Order.objects.filter(
            dealer=dealer,
            created_at__gte=today_start
        ).count()

        # Số đơn hàng đang ở trạng thái Chờ xử lý (PENDING)
        pending_orders_count = Order.objects.filter(
            dealer=dealer,
            status=OrderStatus.PENDING
        ).count()

        # 3. Tồn kho (Inventory)
        # Lấy danh sách các lô hàng đang hoạt động (ACTIVE)
        active_batches = DealerInventoryBatch.objects.filter(
            dealer_product__dealer_profile=dealer,
            status=DealerInventoryBatchStatus.ACTIVE
        )
        # Tổng số lượng sản phẩm còn lại trong kho
        total_inventory = active_batches.aggregate(total=Sum('remaining_quantity'))['total'] or 0
        # Số lượng sản phẩm mới có lô hàng hoạt động được tạo ngày hôm nay
        new_batches_today = active_batches.filter(created_at__gte=today_start).values('dealer_product').distinct().count()

        # 4. Cảnh báo (Alerts - Tồn kho thấp < 10 hoặc sắp hết hạn)
        # Sắp hết hạn: số ngày còn lại đến hạn <= 20% tổng số ngày từ import_date đến expiry_date
        expiring_or_low_stock = active_batches.annotate(
            duration_20pct=ExpressionWrapper(
                (F('expiry_date') - F('import_date')) / 5, 
                output_field=DurationField()
            )
        ).filter(
            Q(remaining_quantity__lt=10) | 
            (Q(expiry_date__isnull=False) & Q(expiry_date__lte=now.date() + F('duration_20pct')))
        )
        alerts_count = expiring_or_low_stock.values('dealer_product').distinct().count()

        return Response({
            "revenue": {
                "today": today_revenue,
                "change_percent": round(revenue_change_percent, 2)
            },
            "orders": {
                "new_today": new_orders_count,
                "pending": pending_orders_count
            },
            "inventory": {
                "total_quantity": total_inventory,
                "new_types_today": new_batches_today
            },
            "alerts": {
                "count": alerts_count
            }
        })

    @extend_schema(
        summary="Biểu đồ doanh thu Đại lý (7 ngày)",
        tags=["Dashboard"],
        description="Lấy thống kê doanh thu theo từng ngày trong vòng 7 ngày qua để vẽ biểu đồ.",
        responses={
            200: inline_serializer(
                name='DealerRevenueChartItem',
                fields={
                    'date': serializers.CharField(help_text="Ngày (YYYY-MM-DD)"),
                    'revenue': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Tổng doanh thu trong ngày")
                },
                many=True
            ),
            403: OpenApiResponse(description="User is not a dealer.")
        }
    )
    @action(detail=False, methods=['get'], url_path='revenue-chart')
    def revenue_chart(self, request):
        """
        API: GET /api/dashboard/revenue-chart/
        Lấy thống kê doanh thu theo từng ngày trong vòng 7 ngày qua để phục vụ vẽ biểu đồ.
        """
        dealer = self._get_dealer(request)
        if not dealer:
            return Response({"detail": "User is not a dealer."}, status=403)

        now = timezone.now()
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=6)
        
        # Nhóm doanh thu theo từng ngày từ start_date
        daily_revenue = Order.objects.filter(
            dealer=dealer,
            status__in=[OrderStatus.COMPLETED, OrderStatus.DELIVERED],
            updated_at__gte=start_date
        ).annotate(
            date=TruncDate('updated_at')
        ).values('date').annotate(
            total=Sum('total_amount')
        ).order_by('date')

        # Khởi tạo dữ liệu doanh thu mặc định bằng 0 cho tất cả 7 ngày qua
        revenue_dict = {str((start_date + timedelta(days=i)).date()): 0 for i in range(7)}
        for item in daily_revenue:
            if item['date']:
                date_str = str(item['date'])
                if date_str in revenue_dict:
                    revenue_dict[date_str] = float(item['total'] or 0)
            
        result = [{"date": k, "revenue": v} for k, v in revenue_dict.items()]
        
        return Response(result)

    @extend_schema(
        summary="Sản phẩm bán chạy nhất (Đại lý)",
        tags=["Dashboard"],
        description="Lấy danh sách 10 sản phẩm bán chạy nhất của Đại lý dựa trên tổng doanh thu từ trước đến nay.\n\nsales: Tổng số lượng sản phẩm đã bán",
        responses={
            200: inline_serializer(
                name='DealerTopProductItem',
                fields={
                    'id': serializers.IntegerField(help_text="ID sản phẩm đại lý"),
                    'name': serializers.CharField(help_text="Tên sản phẩm"),
                    'category': serializers.CharField(help_text="Tên danh mục"),
                    'sales': serializers.IntegerField(help_text="Tổng số lượng đã bán"),
                    'revenue': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Tổng doanh thu"),
                    'current_stock': serializers.IntegerField(help_text="Tồn kho hiện tại")
                },
                many=True
            ),
            403: OpenApiResponse(description="User is not a dealer.")
        }
    )
    @action(detail=False, methods=['get'], url_path='top-products')
    def top_products(self, request):
        """
        API: GET /api/dashboard/top-products/
        Lấy danh sách 10 sản phẩm bán chạy nhất của Đại lý dựa trên tổng doanh thu từ trước đến nay.
        """
        dealer = self._get_dealer(request)
        if not dealer:
            return Response({"detail": "User is not a dealer."}, status=403)

        # Truy vấn các sản phẩm hàng đầu dựa trên doanh thu
        top_items = OrderItem.objects.filter(
            order__dealer=dealer,
            order__status__in=[OrderStatus.COMPLETED, OrderStatus.DELIVERED]
        ).values(
            'dealer_product__id',
            'dealer_product__title',
            'dealer_product__category__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_revenue')[:10]
        
        results = []
        for item in top_items:
            product_id = item['dealer_product__id']
            # Lấy tổng lượng tồn kho còn lại của sản phẩm này (từ các lô hàng ACTIVE)
            stock = DealerInventoryBatch.objects.filter(
                dealer_product_id=product_id,
                status=DealerInventoryBatchStatus.ACTIVE
            ).aggregate(total=Sum('remaining_quantity'))['total'] or 0
            
            results.append({
                "id": product_id,
                "name": item['dealer_product__title'],
                "category": item['dealer_product__category__name'] or "Chưa phân loại",
                "sales": item['total_quantity'],
                "revenue": item['total_revenue'],
                "current_stock": stock
            })

        return Response(results)

    @extend_schema(
        summary="Thống kê phiếu nhập hàng đầu Dashboard Đại lý",
        tags=["Dashboard"],
        description="Lấy thông tin thống kê phiếu nhập hàng đầu Dashboard của đại lý bao gồm: Tổng số phiếu nhập, tổng giá trị nhập, tổng số lượng hàng nhập, số lượng nhà cung cấp, và số lượng phiếu theo các trạng thái (chờ xác nhận, hoàn thành, đã hủy).",
        responses={
            200: inline_serializer(
                name='DealerPurchaseDashboardSummaryResponse',
                fields={
                    'total_orders': serializers.IntegerField(help_text="Tổng số phiếu nhập"),
                    'total_amount': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Tổng giá trị nhập hàng (các đơn đã hoàn tất/đã giao)"),
                    'total_quantity': serializers.DecimalField(max_digits=12, decimal_places=2, help_text="Tổng số lượng hàng đã nhập (kg hoặc đơn vị khác)"),
                    'total_suppliers': serializers.IntegerField(help_text="Số nhà cung cấp đã nhập hàng"),
                    'pending_orders': serializers.IntegerField(help_text="Phiếu nhập đang chờ xác nhận (NCC hoặc đại lý)"),
                    'completed_orders': serializers.IntegerField(help_text="Phiếu nhập đã hoàn thành"),
                    'cancelled_orders': serializers.IntegerField(help_text="Phiếu nhập đã hủy")
                }
            ),
            403: OpenApiResponse(description="User is not a dealer.")
        }
    )
    @action(detail=False, methods=['get'], url_path='purchase-summary')
    def purchase_summary(self, request):
        """
        API: GET /api/dashboard/dealer/purchase-summary/
        Lấy thông tin thống kê phiếu nhập hàng đầu Dashboard của đại lý.
        """
        dealer = self._get_dealer(request)
        if not dealer:
            return Response({"detail": "User is not a dealer."}, status=403)

        # Tất cả phiếu nhập của đại lý này
        purchase_orders = PurchaseOrder.objects.filter(dealer=dealer)

        # 1. Tổng số phiếu nhập
        total_orders = purchase_orders.count()

        # 2. Tổng giá trị nhập hàng (chỉ tính các đơn đã hoàn tất/đã giao thành công)
        total_amount = purchase_orders.filter(
            status__in=[PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.DELIVERED]
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # 3. Tổng số lượng hàng đã nhập (chỉ tính từ các phiếu nhập đã hoàn tất/giao hàng)
        total_quantity = PurchaseOrderItem.objects.filter(
            purchase_order__dealer=dealer,
            purchase_order__status__in=[PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.DELIVERED]
        ).aggregate(total=Sum('quantity'))['total'] or 0

        # 4. Số nhà cung cấp đã nhập hàng (NCC có ít nhất 1 đơn đã hoàn tất/giao hàng)
        total_suppliers = purchase_orders.filter(
            status__in=[PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.DELIVERED]
        ).values('supplier').distinct().count()

        # 5. Phiếu nhập đang chờ xác nhận (Chờ NCC xác nhận hoặc Chờ đại lý xác nhận điều chỉnh)
        pending_orders = purchase_orders.filter(
            status__in=[
                PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION,
                PurchaseOrderStatus.PENDING_DEALER_CONFIRMATION
            ]
        ).count()

        # 6. Phiếu nhập đã hoàn thành
        completed_orders = purchase_orders.filter(status=PurchaseOrderStatus.COMPLETED).count()

        # 7. Phiếu nhập đã hủy
        cancelled_orders = purchase_orders.filter(status=PurchaseOrderStatus.CANCELLED).count()

        return Response({
            "total_orders": total_orders,
            "total_amount": total_amount,
            "total_quantity": total_quantity,
            "total_suppliers": total_suppliers,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "cancelled_orders": cancelled_orders
        })

class SupplierDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet cung cấp các API cho Dashboard của Nhà cung cấp (Supplier).
    """
    permission_classes = [IsAuthenticated]

    def _get_supplier(self, request):
        return getattr(request.user, 'supplier_profile', None)

    @extend_schema(
        summary="Tổng quan Dashboard Nhà cung cấp",
        tags=["Dashboard"],
        description="Lấy dữ liệu thống kê tổng quan của Nhà cung cấp:  \n\n this_month: doanh thu tháng này \n\n  orders.new_this_month: số đơn hàng mới \n\n orders.pending: số đơn đang chờ xử lý \n\n products.active_count: số sản phẩm đang bán.",
        responses={
            200: inline_serializer(
                name='SupplierDashboardSummaryResponse',
                fields={
                    'revenue': inline_serializer(
                        name='SupplierRevenueSummary',
                        fields={
                            'this_month': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Doanh thu tháng này")
                        }
                    ),
                    'orders': inline_serializer(
                        name='SupplierOrdersSummary',
                        fields={
                            'new_this_month': serializers.IntegerField(help_text="Đơn hàng mới tạo tháng này"),
                            'pending': serializers.IntegerField(help_text="Đơn hàng đang chờ xử lý")
                        }
                    ),
                    'products': inline_serializer(
                        name='SupplierProductsSummary',
                        fields={
                            'active_count': serializers.IntegerField(help_text="Số lượng sản phẩm đang bán (ACTIVE)")
                        }
                    )
                }
            ),
            403: OpenApiResponse(description="User is not a supplier.")
        }
    )
    @action(detail=False, methods=['get'])
    def summary(self, request):
        supplier = self._get_supplier(request)
        if not supplier:
            return Response({"detail": "User is not a supplier."}, status=403)

        now = timezone.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # 1. Doanh thu (Revenue)
        completed_orders = PurchaseOrder.objects.filter(
            supplier=supplier,
            status__in=[PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.DELIVERED]
        )
        
        # Doanh thu tháng này
        this_month_revenue = completed_orders.filter(
            updated_at__gte=this_month_start
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # 2. Đơn hàng mới (New Orders)
        new_orders_count = PurchaseOrder.objects.filter(
            supplier=supplier,
            created_at__gte=this_month_start
        ).count()

        # Số đơn hàng đang chờ xử lý
        pending_orders_count = PurchaseOrder.objects.filter(
            supplier=supplier,
            status__in=[
                PurchaseOrderStatus.PENDING_SUPPLIER_CONFIRMATION
            ]
        ).count()

        # 3. Sản phẩm đang bán (Active Products)
        active_products_count = SupplierProduct.objects.filter(
            supplier=supplier,
            status=SupplierProductStatus.ACTIVE
        ).count()

        return Response({
            "revenue": {
                "this_month": this_month_revenue
            },
            "orders": {
                "new_this_month": new_orders_count,
                "pending": pending_orders_count
            },
            "products": {
                "active_count": active_products_count
            }
        })

    @extend_schema(
        summary="Biểu đồ doanh thu Nhà cung cấp (6 tháng)",
        tags=["Dashboard"],
        description="Lấy thống kê doanh thu theo tháng trong vòng 6 tháng gần nhất để vẽ biểu đồ.",
        responses={
            200: inline_serializer(
                name='SupplierRevenueChartItem',
                fields={
                    'month': serializers.CharField(help_text="Tháng (YYYY-MM)"),
                    'revenue': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Doanh thu trong tháng")
                },
                many=True
            ),
            403: OpenApiResponse(description="User is not a supplier.")
        }
    )
    @action(detail=False, methods=['get'], url_path='revenue-chart')
    def revenue_chart(self, request):
        supplier = self._get_supplier(request)
        if not supplier:
            return Response({"detail": "User is not a supplier."}, status=403)

        now = timezone.now()
        # Lấy ngày mùng 1 của 5 tháng trước (tổng 6 tháng bao gồm tháng hiện tại)
        start_date = now
        for _ in range(5):
            start_date = (start_date.replace(day=1) - timedelta(days=1)).replace(day=1)
        start_date = start_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0) #về ngày mùng 1 đầu tháng của 5 tháng trước (đặt thời gian về 00:00:00). 

        monthly_revenue = PurchaseOrder.objects.filter(
            supplier=supplier,
            status__in=[PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.DELIVERED],
            updated_at__gte=start_date
        ).annotate(
            month=TruncMonth('updated_at') # làm tròn về đầu tháng cho nó cung dữ liệu để gom nhóm.
        ).values('month').annotate(
            total=Sum('total_amount')
        ).order_by('month')

        # Generate 6 months
        revenue_dict = {}
        curr_date = start_date
        for _ in range(6):
            month_key = curr_date.strftime('%Y-%m') # e.g. "2026-01"
            revenue_dict[month_key] = 0
            # Move to next month
            next_month = curr_date.replace(day=28) + timedelta(days=4)
            curr_date = next_month.replace(day=1)
        # Điền doanh thu thực tế từ cơ sở dữ liệu
        for item in monthly_revenue:
            if item['month']:
                month_key = item['month'].strftime('%Y-%m')
                if month_key in revenue_dict:
                    revenue_dict[month_key] = float(item['total'] or 0)
        
        result = [{"month": k, "revenue": v} for k, v in revenue_dict.items()]
        return Response(result)

    @extend_schema(
        summary="Sản phẩm bán chạy nhất (Nhà cung cấp)",
        tags=["Dashboard"],
        description="Lấy danh sách 10 sản phẩm bán chạy nhất của Nhà cung cấp.\n\nsales: Tổng số lượng sản phẩm đã bán",
        responses={
            200: inline_serializer(
                name='SupplierTopProductItem',
                fields={
                    'id': serializers.IntegerField(help_text="ID sản phẩm NCC"),
                    'name': serializers.CharField(help_text="Tên sản phẩm"),
                    'category': serializers.CharField(help_text="Tên danh mục"),
                    'sales': serializers.IntegerField(help_text="Tổng số lượng đã bán"),
                    'revenue': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Tổng doanh thu")
                },
                many=True
            ),
            403: OpenApiResponse(description="User is not a supplier.")
        }
    )
    @action(detail=False, methods=['get'], url_path='top-products')
    def top_products(self, request):
        supplier = self._get_supplier(request)
        if not supplier:
            return Response({"detail": "User is not a supplier."}, status=403)

        top_items = PurchaseOrderItem.objects.filter(
            purchase_order__supplier=supplier,
            purchase_order__status__in=[PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.DELIVERED]
        ).values(
            'supplier_product__id',
            'supplier_product__name',
            'supplier_product__category__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_revenue')[:10]

        results = []
        for item in top_items:
            results.append({
                "id": item['supplier_product__id'],
                "name": item['supplier_product__name'],
                "category": item['supplier_product__category__name'] or "Chưa phân loại",
                "sales": item['total_quantity'],
                "revenue": item['total_revenue']
            })

        return Response(results)


class AdminDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet cung cấp các API cho Dashboard của Admin.
    """
    permission_classes = [IsAuthenticated]

    def _is_admin(self, request):
        return request.user.role == AccountRole.ADMIN

    @extend_schema(
        summary="Tổng quan Dashboard Admin",
        tags=["Dashboard"],
        description="Lấy dữ liệu thống kê tổng quan của toàn nền tảng cho Admin: doanh thu tháng hiện tại, số đại lý và nhà cung cấp đang hoạt động, và số lượng khách hàng đăng ký mới trong tháng.",
        responses={
            200: inline_serializer(
                name='AdminDashboardSummaryResponse',
                fields={
                    'revenue': inline_serializer(
                        name='AdminRevenueSummary',
                        fields={
                            'this_month': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Tổng doanh thu tháng hiện tại")
                        }
                    ),
                    'active_dealers': serializers.IntegerField(help_text="Số lượng dealer đang hoạt động"),
                    'active_suppliers': serializers.IntegerField(help_text="Số lượng supplier đang hoạt động"),
                    'new_customers_this_month': serializers.IntegerField(help_text="Số khách hàng mới trong tháng"),
                }
            ),
            403: OpenApiResponse(description="User is not an admin (Lỗi phân quyền).")
        }
    )
    @action(detail=False, methods=['get'])
    def summary(self, request):
        if not self._is_admin(request):
            return Response({"detail": "User is not an admin."}, status=403)

        now = timezone.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 1. Tổng doanh thu nền tảng/tháng
        completed_orders = Order.objects.filter(
            status__in=[OrderStatus.COMPLETED, OrderStatus.DELIVERED],
            updated_at__gte=this_month_start
        )
        total_revenue = completed_orders.aggregate(total=Sum('total_amount'))['total'] or 0

        # 2. Số dealer đang hoạt động
        active_dealers = Account.objects.filter(
            role=AccountRole.DEALER,
            status=AccountStatus.ACTIVE
        ).count()

        # 3. Số supplier đang hoạt động
        active_suppliers = Account.objects.filter(
            role=AccountRole.SUPPLIER,
            status=AccountStatus.ACTIVE
        ).count()

        # 4. Số khách hàng mới (trong tháng)
        new_customers = Account.objects.filter(
            role=AccountRole.BUYER,
            created_at__gte=this_month_start
        ).count()

        return Response({
            "revenue": {
                "this_month": total_revenue
            },
            "active_dealers": active_dealers,
            "active_suppliers": active_suppliers,
            "new_customers_this_month": new_customers
        })

    @extend_schema(
        summary="Biểu đồ doanh thu toàn hệ thống (6 tháng)",
        tags=["Dashboard"],
        description="Lấy thống kê doanh thu toàn nền tảng theo tháng trong vòng 6 tháng gần nhất để vẽ biểu đồ.",
        responses={
            200: inline_serializer(
                name='AdminRevenueChartItem',
                fields={
                    'month': serializers.CharField(help_text="Tháng (YYYY-MM)"),
                    'revenue': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Tổng doanh thu trong tháng")
                },
                many=True
            ),
            403: OpenApiResponse(description="User is not an admin (Lỗi phân quyền).")
        }
    )
    @action(detail=False, methods=['get'], url_path='revenue-chart')
    def revenue_chart(self, request):
        if not self._is_admin(request):
            return Response({"detail": "User is not an admin."}, status=403)

        now = timezone.now()
        # Lấy ngày mùng 1 của 5 tháng trước (tổng 6 tháng bao gồm tháng hiện tại)
        start_date = now
        for _ in range(5):
            start_date = (start_date.replace(day=1) - timedelta(days=1)).replace(day=1)
        start_date = start_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        monthly_revenue = Order.objects.filter(
            status__in=[OrderStatus.COMPLETED, OrderStatus.DELIVERED],
            updated_at__gte=start_date
        ).annotate(
            month=TruncMonth('updated_at')
        ).values('month').annotate(
            total=Sum('total_amount')
        ).order_by('month')

        # Generate 6 months default 0
        revenue_dict = {}
        curr_date = start_date
        for _ in range(6):
            month_key = curr_date.strftime('%Y-%m')
            revenue_dict[month_key] = 0
            # Move to next month
            next_month = curr_date.replace(day=28) + timedelta(days=4)
            curr_date = next_month.replace(day=1)
            
        # Điền doanh thu thực tế từ CSDL
        for item in monthly_revenue:
            if item['month']:
                month_key = item['month'].strftime('%Y-%m')
                if month_key in revenue_dict:
                    revenue_dict[month_key] = float(item['total'] or 0)
        
        result = [{"month": k, "revenue": v} for k, v in revenue_dict.items()]
        return Response(result)

    @extend_schema(
        summary="Top Đại lý có doanh thu cao nhất",
        tags=["Dashboard"],
        description="Danh sách 10 Đại lý có tổng doanh thu (các đơn hàng đã hoàn tất) cao nhất toàn hệ thống.",
        responses={
            200: inline_serializer(
                name='AdminTopDealerItem',
                fields={
                    'id': serializers.IntegerField(help_text="ID của DealerProfile"),
                    'store_name': serializers.CharField(help_text="Tên cửa hàng đại lý"),
                    'total_revenue': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Tổng doanh thu"),
                    'total_orders': serializers.IntegerField(help_text="Tổng số đơn hàng hoàn tất"),
                },
                many=True
            ),
            403: OpenApiResponse(description="User is not an admin (Lỗi phân quyền).")
        }
    )
    @action(detail=False, methods=['get'], url_path='top-dealers')
    def top_dealers(self, request):
        if not self._is_admin(request):
            return Response({"detail": "User is not an admin."}, status=403)
        
        top_items = Order.objects.filter(
            status__in=[OrderStatus.COMPLETED, OrderStatus.DELIVERED]
        ).values(
            'dealer__id',
            'dealer__store_name',
        ).annotate(
            total_revenue=Sum('total_amount'),
            total_orders=Count('id')
        ).order_by('-total_revenue')[:10]
        
        results = [
            {
                "id": item['dealer__id'],
                "store_name": item['dealer__store_name'],
                "total_revenue": item['total_revenue'] or 0,
                "total_orders": item['total_orders']
            } for item in top_items
        ]
        return Response(results)

    @extend_schema(
        summary="Top Nhà cung cấp có doanh thu cao nhất",
        tags=["Dashboard"],
        description="Danh sách 10 Nhà cung cấp có tổng doanh thu (từ các phiếu nhập hàng đã giao/hoàn tất) cao nhất.",
        responses={
            200: inline_serializer(
                name='AdminTopSupplierItem',
                fields={
                    'id': serializers.IntegerField(help_text="ID của Supplier"),
                    'company_name': serializers.CharField(help_text="Tên công ty NCC"),
                    'total_revenue': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Tổng doanh thu"),
                    'total_orders': serializers.IntegerField(help_text="Tổng số phiếu nhập hoàn tất"),
                },
                many=True
            ),
            403: OpenApiResponse(description="User is not an admin (Lỗi phân quyền).")
        }
    )
    @action(detail=False, methods=['get'], url_path='top-suppliers')
    def top_suppliers(self, request):
        if not self._is_admin(request):
            return Response({"detail": "User is not an admin."}, status=403)
        
        top_items = PurchaseOrder.objects.filter(
            status__in=[PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.DELIVERED]
        ).values(
            'supplier__id',
            'supplier__company_name',
        ).annotate(
            total_revenue=Sum('total_amount'),
            total_orders=Count('id')
        ).order_by('-total_revenue')[:10]
        
        results = [
            {
                "id": item['supplier__id'],
                "company_name": item['supplier__company_name'],
                "total_revenue": item['total_revenue'] or 0,
                "total_orders": item['total_orders']
            } for item in top_items
        ]
        return Response(results)

    @extend_schema(
        summary="Sản phẩm bán chạy nhất toàn nền tảng",
        tags=["Dashboard"],
        description="Lấy danh sách 10 sản phẩm có tổng doanh thu cao nhất, so sánh cả sản phẩm của Đại lý (B2C) và Nhà cung cấp (B2B).\n\nsales: Tổng số lượng sản phẩm đã bán",
        responses={
            200: inline_serializer(
                name='AdminTopProductItem',
                fields={
                    'id': serializers.IntegerField(help_text="ID của sản phẩm"),
                    'name': serializers.CharField(help_text="Tên sản phẩm"),
                    'category': serializers.CharField(help_text="Danh mục"),
                    'type': serializers.CharField(help_text="'dealer_product' hoặc 'supplier_product'"),
                    'sales': serializers.IntegerField(help_text="Tổng số lượng đã bán"),
                    'revenue': serializers.DecimalField(max_digits=14, decimal_places=2, help_text="Tổng doanh thu")
                },
                many=True
            ),
            403: OpenApiResponse(description="User is not an admin (Lỗi phân quyền).")
        }
    )
    @action(detail=False, methods=['get'], url_path='top-products')
    def top_products(self, request):
        if not self._is_admin(request):
            return Response({"detail": "User is not an admin."}, status=403)

        # 1. Top 10 Sản phẩm của Đại lý (B2C)
        dealer_items = OrderItem.objects.filter(
            order__status__in=[OrderStatus.COMPLETED, OrderStatus.DELIVERED]
        ).values(
            'dealer_product__id',
            'dealer_product__title',
            'dealer_product__category__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_revenue')[:10]

        # 2. Top 10 Sản phẩm của Nhà cung cấp (B2B)
        supplier_items = PurchaseOrderItem.objects.filter(
            purchase_order__status__in=[PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.DELIVERED]
        ).values(
            'supplier_product__id',
            'supplier_product__name',
            'supplier_product__category__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_revenue')[:10]

        combined = []
        for item in dealer_items:
            combined.append({
                "id": item['dealer_product__id'],
                "name": item['dealer_product__title'],
                "category": item['dealer_product__category__name'] or "Chưa phân loại",
                "type": "dealer_product",
                "sales": item['total_quantity'],
                "revenue": float(item['total_revenue'] or 0)
            })
            
        for item in supplier_items:
            combined.append({
                "id": item['supplier_product__id'],
                "name": item['supplier_product__name'],
                "category": item['supplier_product__category__name'] or "Chưa phân loại",
                "type": "supplier_product",
                "sales": item['total_quantity'],
                "revenue": float(item['total_revenue'] or 0)
            })
            
        # Sắp xếp lại danh sách kết hợp dựa trên doanh thu giảm dần và lấy Top 10
        combined.sort(key=lambda x: x['revenue'], reverse=True)
        return Response(combined[:10])




