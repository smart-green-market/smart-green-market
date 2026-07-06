import 'package:get/get.dart';
import 'package:smart_green_market/core/constants/app_constants.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class ProfilePageController extends GetxController {
  ProfilePageController(this._repository, this._storefront);

  final BuyerRepository _repository;
  final StorefrontController _storefront;

  final isLoading = false.obs;
  final profile = Rxn<Map<String, dynamic>>();
  final addresses = <AddressModel>[].obs;

  @override
  void onInit() {
    super.onInit();
    loadProfile();
  }

  Future<void> loadProfile() async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    isLoading.value = true;
    try {
      final results = await Future.wait([
        _repository.getProfile(slug),
        _repository.getAddresses(slug),
      ]);
      profile.value = results[0] as Map<String, dynamic>;
      addresses.assignAll(results[1] as List<AddressModel>);
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> updateProfile({String? fullName, String? phone}) async {
    try {
      final data = await _repository.updateProfile(_storefront.currentSlug, {
        if (fullName != null) 'full_name': fullName,
        if (phone != null) 'phone': phone,
      });
      profile.value = data;
      AppSnackbar.success('Cập nhật hồ sơ thành công');
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> saveAddress({
    required String receiverName,
    required String receiverPhone,
    required String address,
    bool isDefault = false,
  }) async {
    if (addresses.length >= AppConstants.maxBuyerAddresses) {
      AppSnackbar.error('Tối đa ${AppConstants.maxBuyerAddresses} địa chỉ');
      return;
    }
    try {
      final created = await _repository.createAddress(_storefront.currentSlug, {
        'receiver_name': receiverName,
        'receiver_phone': receiverPhone,
        'address': address,
        'is_default': isDefault,
      });
      addresses.add(created);
      AppSnackbar.success('Đã thêm địa chỉ');
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> deleteAddress(int id) async {
    try {
      await _repository.deleteAddress(_storefront.currentSlug, id);
      addresses.removeWhere((a) => a.id == id);
      AppSnackbar.success('Đã xóa địa chỉ');
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }
}
