import 'package:get/get.dart';
import 'package:smart_green_market/core/utils/buyer_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/services/storage_service.dart';

enum CartAddResult { added, duplicate, authRequired, outOfStock }

class CartController extends GetxController {
  CartController(this._storage, this._auth, this._storefront, this._repository);

  final StorageService _storage;
  final AuthController _auth;
  final StorefrontController _storefront;
  final BuyerRepository _repository;

  final items = <CartItemModel>[].obs;

  int get itemCount => items.length;
  int get totalQuantity => items.fold(0, (sum, item) => sum + item.quantity);

  double get selectedSubtotal =>
      items.where((item) => item.selected).fold(0, (sum, item) => sum + item.subtotal);

  List<CartItemModel> get selectedItems => items.where((item) => item.selected).toList();

  @override
  void onInit() {
    super.onInit();
    ever(_storefront.slug, (_) => _loadCart());
    ever(_auth.user, (_) => _loadCart());
    _loadCart();
  }

  String get _cartKey {
    final slug = _storefront.currentSlug.isNotEmpty ? _storefront.currentSlug : 'default';
    return CartUtils.sessionKey(slug, _auth.buyerId);
  }

  void _loadCart() {
    final raw = _storage.read(_cartKey);
    if (raw is! List) {
      items.clear();
      return;
    }
    items.assignAll(
      raw
          .whereType<Map>()
          .map((e) => CartItemModel.fromJson(Map<String, dynamic>.from(e)))
          .where((item) => item.id > 0),
    );
  }

  Future<void> _saveCart() async {
    await _storage.write(_cartKey, items.map((e) => e.toJson()).toList());
  }

  bool isInCart(int productId) => items.any((item) => item.id == productId);

  Future<CartAddResult> addProduct(ProductModel product, {int quantity = 1}) async {
    if (!_auth.isLoggedIn) return CartAddResult.authRequired;
    if (!product.inStock) return CartAddResult.outOfStock;
    if (isInCart(product.id)) return CartAddResult.duplicate;

    items.add(CartItemModel.fromProduct(product, quantity: quantity));
    await _saveCart();

    final slug = _storefront.currentSlug;
    if (slug.isNotEmpty) {
      try {
        await _repository.recordAddToCart(slug, product.id);
      } catch (_) {}
    }
    return CartAddResult.added;
  }

  Future<void> removeItem(int id) async {
    items.removeWhere((item) => item.id == id);
    await _saveCart();
  }

  Future<void> setQuantity(int id, int quantity) async {
    final index = items.indexWhere((item) => item.id == id);
    if (index < 0) return;
    final item = items[index];
    if (item.isOutOfStock) return;
    items[index].quantity = CartUtils.normalizeQuantity(quantity);
    items.refresh();
    await _saveCart();
  }

  Future<void> toggleSelect(int id) async {
    final index = items.indexWhere((item) => item.id == id);
    if (index < 0) return;
    if (items[index].isOutOfStock) return;
    items[index].selected = !items[index].selected;
    items.refresh();
    await _saveCart();
  }

  Future<void> toggleAll(bool selected) async {
    for (final item in items) {
      item.selected = selected;
    }
    items.refresh();
    await _saveCart();
  }

  Future<void> removeOrderedItems(List<int> productIds) async {
    items.removeWhere((item) => productIds.contains(item.id));
    await _saveCart();
  }

  Future<void> syncWithCatalog(List<ProductModel> products) async {
    if (products.isEmpty) return;
    final stockMap = {for (final p in products) p.id: p.availableQuantity};
    for (final item in items) {
      final stock = stockMap[item.id];
      if (stock != null) {
        item.availableQuantity = stock;
        if (item.isOutOfStock) {
          item.selected = false;
        }
      }
    }
    items.refresh();
    await _saveCart();
  }
}
