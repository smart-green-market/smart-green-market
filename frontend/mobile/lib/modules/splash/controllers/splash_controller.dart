import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/constants/storage_keys.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/services/storage_service.dart';

class SplashController extends GetxController {
  final StorageService _storage = Get.find<StorageService>();

  @override
  void onReady() {
    super.onReady();
    _navigateNext();
  }

  Future<void> _navigateNext() async {
    await Future<void>.delayed(const Duration(milliseconds: 800));

    final slug = _storage.read<String>(StorageKeys.dealerSlug) ?? '';
    final auth = Get.find<AuthController>();

    if (slug.isNotEmpty) {
      final storefront = Get.find<StorefrontController>();
      await storefront.setSlug(slug);
      if (auth.isLoggedIn) {
        Get.offAllNamed(AppRoutes.main(slug));
        return;
      }
      Get.offAllNamed(AppRoutes.main(slug));
      return;
    }

    Get.offAllNamed(AppRoutes.entry);
  }
}
