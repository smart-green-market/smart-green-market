import 'package:get/get.dart';
import 'package:smart_green_market/core/network/api_client.dart';
import 'package:smart_green_market/data/providers/buyer_api_provider.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/cart_controller.dart';
import 'package:smart_green_market/shared/controllers/realtime_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/services/notification_websocket_service.dart';
import 'package:smart_green_market/shared/services/storage_service.dart';

Future<void> initServices() async {
  final storage = StorageService();
  await storage.init();
  Get.put(storage, permanent: true);

  final apiClient = Get.put(ApiClient(storage), permanent: true);
  final provider = Get.put(BuyerApiProvider(apiClient), permanent: true);
  final repository = Get.put(BuyerRepository(provider), permanent: true);
  Get.put(StorefrontController(storage, repository), permanent: true);
  Get.put(AuthController(storage, repository), permanent: true);
  Get.put(CartController(storage, Get.find(), Get.find(), repository), permanent: true);

  Get.put(NotificationWebSocketService(), permanent: true);
  Get.put(
    NotificationRealtimeController(
      repository,
      Get.find<AuthController>(),
      storage,
      Get.find<NotificationWebSocketService>(),
    ),
    permanent: true,
  );
  Get.put(
    OrderStatusRealtimeController(
      repository,
      Get.find<AuthController>(),
      Get.find<StorefrontController>(),
      storage,
    ),
    permanent: true,
  );
}
