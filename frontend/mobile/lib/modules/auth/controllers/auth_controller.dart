import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class AuthPageController extends GetxController {
  AuthPageController(this._auth, this._repository, this._storefront);

  final AuthController _auth;
  final BuyerRepository _repository;
  final StorefrontController _storefront;

  final obscurePassword = true.obs;

  void togglePassword() => obscurePassword.value = !obscurePassword.value;

  Future<void> login(String email, String password) async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) {
      AppSnackbar.error('Chưa chọn cửa hàng');
      return;
    }
    try {
      await _auth.login(slug, email, password);
      AppSnackbar.success('Đăng nhập thành công');
      final redirect = Get.arguments?['redirect'] as String?;
      if (redirect != null && redirect.isNotEmpty) {
        Get.offAllNamed(redirect);
      } else {
        Get.offAllNamed(AppRoutes.main(slug));
      }
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
    required String repassword,
  }) async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) {
      AppSnackbar.error('Chưa chọn cửa hàng');
      return;
    }
    try {
      await _auth.register(
        slug,
        email: email,
        password: password,
        repassword: repassword,
        fullName: fullName,
        phone: phone,
      );
      AppSnackbar.success('Đăng ký thành công');
      Get.offAllNamed(AppRoutes.main(slug));
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }
}
