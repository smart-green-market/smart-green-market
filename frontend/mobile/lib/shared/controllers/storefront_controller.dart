import 'package:get/get.dart';
import 'package:smart_green_market/core/constants/storage_keys.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/services/storage_service.dart';

class StorefrontController extends GetxController {
  StorefrontController(this._storage, this._repository);

  final StorageService _storage;
  final BuyerRepository _repository;

  final slug = ''.obs;
  final dealer = Rxn<DealerModel>();
  final isValidating = false.obs;
  final errorMessage = ''.obs;

  String get currentSlug => slug.value;

  @override
  void onInit() {
    super.onInit();
    final stored = _storage.read<String>(StorageKeys.dealerSlug);
    if (stored != null && stored.isNotEmpty) {
      slug.value = stored;
    }
  }

  Future<bool> setSlug(String value) async {
    final normalized = value.trim().toLowerCase();
    if (normalized.isEmpty) {
      errorMessage.value = 'Vui lòng nhập mã cửa hàng.';
      return false;
    }

    isValidating.value = true;
    errorMessage.value = '';
    try {
      final model = await _repository.validateDealer(normalized);
      slug.value = normalized;
      dealer.value = model;
      await _storage.write(StorageKeys.dealerSlug, normalized);
      return true;
    } catch (e) {
      errorMessage.value = _repository.readError(e);
      dealer.value = null;
      return false;
    } finally {
      isValidating.value = false;
    }
  }

  void clearError() => errorMessage.value = '';
}
