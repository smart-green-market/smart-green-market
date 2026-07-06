import 'package:get/get.dart';
import 'package:smart_green_market/modules/auth/controllers/auth_controller.dart';

class AuthBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<AuthPageController>(
      () => AuthPageController(Get.find(), Get.find(), Get.find()),
    );
  }
}
