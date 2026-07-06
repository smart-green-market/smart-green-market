import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/utils/buyer_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/cart_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class ProductDetailController extends GetxController {
  ProductDetailController(
    this._repository,
    this._storefront,
    this._auth,
    this._cart,
  );

  final BuyerRepository _repository;
  final StorefrontController _storefront;
  final AuthController _auth;
  final CartController _cart;

  final isLoading = false.obs;
  final quantity = 1.obs;
  final product = Rxn<ProductModel>();
  final related = <ProductModel>[].obs;
  final reviewSummary = Rxn<Map<String, dynamic>>();

  int get productId => int.tryParse('${Get.parameters['id']}') ?? 0;

  @override
  void onInit() {
    super.onInit();
    loadDetail();
  }

  Future<void> loadDetail() async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty || productId <= 0) return;

    isLoading.value = true;
    quantity.value = 1;
    try {
      final results = await Future.wait([
        _repository.getProduct(slug, productId),
        _repository.getRelated(slug, productId),
        _repository.getProductReviewSummary(slug, productId),
      ]);
      product.value = results[0] as ProductModel;
      related.assignAll(results[1] as List<ProductModel>);
      reviewSummary.value = results[2] as Map<String, dynamic>;

      if (_auth.isLoggedIn) {
        await _repository.recordView(slug, productId);
      }
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      isLoading.value = false;
    }
  }

  void increaseQty() {
    final p = product.value;
    if (p == null) return;
    final max = p.availableQuantity > 0 ? p.availableQuantity : null;
    quantity.value = CartUtils.normalizeQuantity(quantity.value + 1, max: max);
  }

  void decreaseQty() {
    quantity.value = quantity.value > 1 ? quantity.value - 1 : 1;
  }

  Future<void> addToCart() async {
    final p = product.value;
    if (p == null) return;

    final result = await _cart.addProduct(p, quantity: quantity.value);
    switch (result) {
      case CartAddResult.added:
        AppSnackbar.success('Đã thêm vào giỏ hàng');
      case CartAddResult.duplicate:
        AppSnackbar.info('Sản phẩm đã có trong giỏ hàng');
      case CartAddResult.authRequired:
        AppSnackbar.info('Vui lòng đăng nhập để thêm giỏ hàng');
        Get.toNamed(AppRoutes.login(_storefront.currentSlug));
    }
  }

  Future<void> buyNow() async {
    final p = product.value;
    if (p == null) return;

    if (!_auth.isLoggedIn) {
      Get.toNamed(AppRoutes.login(_storefront.currentSlug));
      return;
    }

    final item = CartItemModel.fromProduct(p, quantity: quantity.value);
    Get.toNamed(
      AppRoutes.checkout(_storefront.currentSlug),
      arguments: {'buyNow': item.toJson()},
    );
  }
}
