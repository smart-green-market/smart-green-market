import 'package:get/get.dart';
import 'package:smart_green_market/modules/product/controllers/product_detail_controller.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/cart_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';

class ProductDetailBinding extends Bindings {
  @override
  void dependencies() {
    final id = Get.parameters['id'] ?? '';
    Get.lazyPut(
      () => ProductDetailController(
        Get.find<BuyerRepository>(),
        Get.find<StorefrontController>(),
        Get.find<AuthController>(),
        Get.find<CartController>(),
      ),
      tag: id,
    );
  }
}
