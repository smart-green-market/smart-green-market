import 'package:flutter_test/flutter_test.dart';
import 'package:smart_green_market/core/utils/buyer_utils.dart';
import 'package:smart_green_market/core/utils/dealer_slug_utils.dart';

void main() {
  group('DealerSlugUtils', () {
    test('validates store code pattern', () {
      expect(DealerSlugUtils.isValidStoreCode('k7m-x9p-q2n'), isTrue);
      expect(DealerSlugUtils.isValidStoreCode('ab-cd-efg'), isFalse);
      expect(DealerSlugUtils.isValidStoreCode('invalid'), isFalse);
    });

    test('normalizes storefront URL', () {
      expect(
        DealerSlugUtils.normalizeInput('https://shop.com/cua-hang/k7m-x9p-q2n/trang-chu'),
        'k7m-x9p-q2n',
      );
      expect(DealerSlugUtils.normalizeInput('k7m-x9p-q2n'), 'k7m-x9p-q2n');
    });
  });

  group('CartUtils', () {
    test('builds stable cart session key', () {
      expect(CartUtils.sessionKey('k7m-x9p-q2n', '12'), 'gm_cart_k7m-x9p-q2n_12');
      expect(CartUtils.sessionKey('k7m-x9p-q2n', null), 'gm_cart_k7m-x9p-q2n_guest');
    });

    test('normalizes quantity with max', () {
      expect(CartUtils.normalizeQuantity(0), 1);
      expect(CartUtils.normalizeQuantity(5, max: 3), 3);
    });
  });

  group('OrderStatusUtils', () {
    test('detects active tracking orders', () {
      expect(OrderStatusUtils.isActiveTracking('pending'), isTrue);
      expect(OrderStatusUtils.isActiveTracking('shipping'), isTrue);
      expect(OrderStatusUtils.isActiveTracking('completed'), isFalse);
      expect(OrderStatusUtils.isActiveTracking('cancelled'), isFalse);
    });

    test('buyer action permissions', () {
      expect(OrderStatusUtils.canCancel('pending'), isTrue);
      expect(OrderStatusUtils.canCancel('confirmed'), isFalse);
      expect(OrderStatusUtils.canConfirmReceived('shipping'), isTrue);
      expect(OrderStatusUtils.canReturn('completed'), isTrue);
    });
  });
}
