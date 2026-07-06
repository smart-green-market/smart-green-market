import 'package:get/get.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/realtime_controller.dart';

class MainController extends GetxController {
  static const tabHome = 0;
  static const tabProducts = 1;
  static const tabCart = 2;
  static const tabNotifications = 3;
  static const tabAccount = 4;

  final currentIndex = 0.obs;

  void changeTab(int index) {
    currentIndex.value = index;
    if (index == tabNotifications && Get.find<AuthController>().isLoggedIn) {
      Get.find<NotificationRealtimeController>().fetchAllNotifications();
    }
  }
}
