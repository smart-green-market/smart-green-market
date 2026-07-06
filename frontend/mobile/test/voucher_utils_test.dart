import 'package:flutter_test/flutter_test.dart';
import 'package:smart_green_market/core/utils/voucher_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';

void main() {
  test('VoucherUtils checks minimum order eligibility', () {
    final voucher = VoucherModel(
      id: 1,
      code: 'SALE50K',
      title: 'Giảm 50K',
      minOrderAmount: 100000,
    );

    expect(VoucherUtils.eligibility(voucher, 120000).eligible, isTrue);
    expect(VoucherUtils.eligibility(voucher, 50000).eligible, isFalse);
  });

  test('VoucherUtils filters saved vouchers by query', () {
    final vouchers = [
      VoucherModel(id: 1, code: 'ABC', title: 'Alpha'),
      VoucherModel(id: 2, code: 'XYZ', title: 'Beta'),
    ];

    expect(VoucherUtils.filterByQuery(vouchers, 'abc').length, 1);
    expect(VoucherUtils.filterByQuery(vouchers, 'beta').length, 1);
  });
}
