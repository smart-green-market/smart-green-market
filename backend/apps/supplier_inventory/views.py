from django.shortcuts import render
from django.db import transaction

# Create your views here.
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, extend_schema_view
from common.openapi import PAGINATION_QUERY_HELP, paginated_response_schema
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from common.permission import IsActive, IsSupplierOrDealer
from .models import (
    InventoryBatch,
    InventoryWastage,
)
from .services import deduct_batch_stock

from .serializers import (
    InventoryBatchSerializer,
    InventoryWastageSerializer,
)

class InventoryBatchViewSet(ModelViewSet):

    queryset = InventoryBatch.objects.all()
    serializer_class = InventoryBatchSerializer
    permission_classes = [IsActive, IsSupplierOrDealer]
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_queryset(self):
        from common.querysets import filter_admin_or_supplier_account
        return filter_admin_or_supplier_account(
            self.queryset,
            self.request.user,
            account_lookup="supplier_product__supplier__account"
        )

    @action(detail=False, methods=["get"])
    def expiring(self, request):
        today = timezone.now().date()

        batches = self.get_queryset().filter(
            expiry_date__gte=today,
            remaining_quantity__gt=0,
        ).select_related("supplier_product")

        result = []
        for b in batches:
            storage_days = b.supplier_product.storage_duration_days
            if storage_days is not None:
                if b.expiry_date <= today + timedelta(days=storage_days * 0.2):
                    result.append(b)

        serializer = self.get_serializer(result, many=True)
        return Response(serializer.data)

    

class InventoryWastageViewSet(ModelViewSet):

    queryset = InventoryWastage.objects.all()
    serializer_class = InventoryWastageSerializer
    permission_classes = [IsActive, IsSupplierOrDealer]
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_queryset(self):
        from common.querysets import filter_admin_or_supplier_account
        return filter_admin_or_supplier_account(
            self.queryset,
            self.request.user,
            account_lookup="batch__supplier_product__supplier__account"
        )
    
    @transaction.atomic
    def perform_create(self, serializer):
        try:
            wastage = serializer.save(
                created_by=self.request.user
            )

            deduct_batch_stock(
                wastage.batch,
                wastage.quantity
            )
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
