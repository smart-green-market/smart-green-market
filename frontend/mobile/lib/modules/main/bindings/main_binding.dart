import 'package:get/get.dart';
import 'package:smart_green_market/modules/home/controllers/home_controller.dart';
import 'package:smart_green_market/modules/main/controllers/main_controller.dart';
import 'package:smart_green_market/modules/product/controllers/product_list_controller.dart';

class MainBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<MainController>(() => MainController());
    Get.lazyPut<HomeController>(() => HomeController(Get.find(), Get.find()));
    Get.lazyPut<ProductListController>(() => ProductListController(Get.find(), Get.find()));
  }
}
