import 'package:get/get.dart';
import 'package:smart_green_market/core/constants/storage_keys.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/services/notification_websocket_service.dart';
import 'package:smart_green_market/shared/services/storage_service.dart';

class AuthController extends GetxController {
  AuthController(this._storage, this._repository);

  final StorageService _storage;
  final BuyerRepository _repository;

  final Rxn<BuyerUser> user = Rxn<BuyerUser>();
  final isLoading = false.obs;

  bool get isLoggedIn => user.value?.isBuyer == true;

  String? get buyerId => user.value?.id?.toString();

  @override
  void onInit() {
    super.onInit();
    _loadFromStorage();
  }

  void _loadFromStorage() {
    final raw = _storage.read(StorageKeys.user);
    user.value = BuyerUser.fromStored(raw);
  }

  Future<bool> login(String slug, String email, String password) async {
    isLoading.value = true;
    try {
      final session = await _repository.login(slug, email, password);
      await _persistSession(session, slug);
      return true;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> register(
    String slug, {
    required String email,
    required String password,
    required String repassword,
    required String fullName,
    required String phone,
  }) async {
    isLoading.value = true;
    try {
      final session = await _repository.register(
        slug,
        email: email,
        password: password,
        repassword: repassword,
        fullName: fullName,
        phone: phone,
      );
      await _persistSession(session, slug);
      return true;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> _persistSession(AuthSession session, String slug) async {
    await _storage.write(StorageKeys.accessToken, session.access);
    await _storage.write(StorageKeys.refreshToken, session.refresh);
    await _storage.write(StorageKeys.dealerSlug, slug);
    await _storage.write(StorageKeys.user, session.user.toJson());
    user.value = session.user;
    Get.find<NotificationWebSocketService>().connectWithToken(session.access);
  }

  Future<void> logout() async {
    try {
      await _repository.logout();
    } catch (_) {
      // ignore network errors on logout
    } finally {
      await _storage.remove(StorageKeys.accessToken);
      await _storage.remove(StorageKeys.refreshToken);
      await _storage.remove(StorageKeys.user);
      user.value = null;
    }
  }

  bool matchesDealer(String slug) {
    if (!isLoggedIn) return true;
    final userSlug = user.value?.storeDealerSlug ?? '';
    return userSlug.isEmpty || userSlug == slug;
  }
}
