import 'package:smart_green_market/core/utils/formatters.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';

class VoucherEligibility {
  const VoucherEligibility({
    required this.eligible,
    required this.minOrderAmount,
    this.reason = '',
  });

  final bool eligible;
  final double minOrderAmount;
  final String reason;
}

class VoucherUtils {
  VoucherUtils._();

  static VoucherEligibility eligibility(VoucherModel voucher, double subtotal) {
    final minOrder = voucher.minOrderAmount;
    if (minOrder <= 0 || subtotal >= minOrder) {
      return VoucherEligibility(eligible: true, minOrderAmount: minOrder);
    }
    return VoucherEligibility(
      eligible: false,
      minOrderAmount: minOrder,
      reason: 'Chưa đạt đơn tối thiểu ${Formatters.currency(minOrder)}',
    );
  }

  static List<VoucherModel> filterByQuery(List<VoucherModel> vouchers, String query) {
    final normalized = query.trim().toLowerCase();
    if (normalized.isEmpty) return vouchers;

    return vouchers.where((voucher) {
      return voucher.code.toLowerCase().contains(normalized) ||
          voucher.title.toLowerCase().contains(normalized) ||
          voucher.description.toLowerCase().contains(normalized);
    }).toList();
  }

  static String discountLabel(VoucherModel voucher) {
    if (voucher.isPercent && voucher.discountValue > 0) {
      return 'Giảm ${voucher.discountValue.toStringAsFixed(0)}%';
    }
    if (voucher.discountValue > 0) {
      return 'Giảm ${Formatters.currency(voucher.discountValue)}';
    }
    return voucher.title.isNotEmpty ? voucher.title : voucher.code;
  }

  static VoucherModel? findByCode(List<VoucherModel> vouchers, String code) {
    final normalized = code.trim().toLowerCase();
    if (normalized.isEmpty) return null;
    for (final voucher in vouchers) {
      if (voucher.code.trim().toLowerCase() == normalized) return voucher;
    }
    return null;
  }
}
