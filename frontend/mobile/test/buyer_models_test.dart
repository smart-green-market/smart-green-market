import 'package:flutter_test/flutter_test.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';

void main() {
  test('AuthSession parses login response', () {
    final session = AuthSession.fromResponse(
      {
        'access': 'token-a',
        'refresh': 'token-r',
        'auth_scope': 'storefront',
        'store_dealer_id': 9,
        'account': {
          'id': 1,
          'email': 'buyer@test.com',
          'full_name': 'Buyer Test',
          'role': 'buyer',
        },
      },
      'k7m-x9p-q2n',
    );

    expect(session.access, 'token-a');
    expect(session.user.email, 'buyer@test.com');
    expect(session.user.storeDealerSlug, 'k7m-x9p-q2n');
    expect(session.user.isBuyer, isTrue);
  });

  test('ProductModel uses effective price when available', () {
    final product = ProductModel.fromJson({
      'id': 10,
      'title': 'Rau muống',
      'retail_price': '30000',
      'effective_price': '25000',
      'available_quantity': 5,
      'in_stock': true,
    });

    expect(product.displayPrice, 25000);
    expect(product.hasDiscount, isTrue);
  });

  test('VoucherModel parses saved flag and voucher rules', () {
    final voucher = VoucherModel.fromJson({
      'id': 3,
      'code': '100KPASSIVE',
      'title': 'Giảm 100K',
      'description': 'Áp dụng cho đơn lớn',
      'discount_type': 'fixed',
      'discount_value': 15000,
      'min_order_amount': 100000,
      'max_discount_amount': null,
      'usage_limit': 50,
      'usage_limit_per_customer': 1,
      'start_date': '2026-01-01T00:00:00Z',
      'end_date': '2026-12-31T23:59:59Z',
      'is_saved': true,
    });

    expect(voucher.isSaved, isTrue);
    expect(voucher.minOrderAmount, 100000);
    expect(voucher.usageLimitPerCustomer, 1);
    expect(voucher.isPercent, isFalse);
  });

  test('ReviewModel parses images from API response', () {
    final review = ReviewModel.fromJson({
      'id': 9,
      'product_title': 'Rau muống',
      'rating': 5,
      'comment': 'Tươi ngon',
      'order_code': 'ORD-001',
      'images': [
        {'id': 1, 'image_url': 'https://cdn.example/review-1.jpg'},
        {'id': 2, 'image_url': 'https://cdn.example/review-2.jpg'},
      ],
    });

    expect(review.imageUrls.length, 2);
    expect(review.imageUrls.first, contains('review-1.jpg'));
  });

  test('CartItemModel serializes and deserializes', () {
    final item = CartItemModel(
      id: 1,
      name: 'Test',
      price: 10000,
      unit: 'kg',
      quantity: 2,
    );

    final restored = CartItemModel.fromJson(item.toJson());
    expect(restored.id, 1);
    expect(restored.quantity, 2);
    expect(restored.subtotal, 20000);
  });
}
