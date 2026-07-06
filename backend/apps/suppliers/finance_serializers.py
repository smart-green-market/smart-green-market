"""Serializer schema cho API tài chính NCC (admin)."""

from rest_framework import serializers


class SupplierFinanceCashFlowItemSerializer(serializers.Serializer):
    month = serializers.CharField(help_text="Tháng (YYYY-MM)")
    inflow = serializers.FloatField(source="in", help_text="Tiền vào trong tháng")
    outflow = serializers.FloatField(source="out", help_text="Tiền ra trong tháng")


class SupplierFinanceItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    company_name = serializers.CharField()
    tax_code = serializers.CharField()
    phone = serializers.CharField()
    address = serializers.CharField()
    verification_status = serializers.CharField()
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    cash_in = serializers.DecimalField(max_digits=14, decimal_places=2)
    cash_out = serializers.DecimalField(max_digits=14, decimal_places=2)
    order_count = serializers.IntegerField()
    cash_flow = SupplierFinanceCashFlowItemSerializer(many=True)
    updated_at = serializers.DateTimeField()


class SupplierFinanceOverviewSerializer(serializers.Serializer):
    total_system_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_cash_in = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_cash_out = serializers.DecimalField(max_digits=14, decimal_places=2)
    supplier_count = serializers.IntegerField()
