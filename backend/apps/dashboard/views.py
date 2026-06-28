from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncDate, TruncMonth
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from apps.orders.models import Order, OrderStatus, OrderItem
from apps.dealer_products.inventory_expiry import mark_expired_inventory_batches
from apps.dealer_products.models import DealerInventoryBatch, DealerInventoryBatchStatus
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem
from apps.supplier_products.models import SupplierProduct, SupplierProductStatus

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

        # 4. Cảnh báo (Alerts - Tồn kho thấp < 10 hoặc hết hạn trong vòng 7 ngày)
        seven_days_later = now.date() + timedelta(days=7)
        expiring_or_low_stock = active_batches.filter(
            Q(remaining_quantity__lt=10) | Q(expiry_date__lte=seven_days_later)
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

class SupplierDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet cung cấp các API cho Dashboard của Nhà cung cấp (Supplier).
    """
    permission_classes = [IsAuthenticated]

    def _get_supplier(self, request):
        return getattr(request.user, 'supplier_profile', None)

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
