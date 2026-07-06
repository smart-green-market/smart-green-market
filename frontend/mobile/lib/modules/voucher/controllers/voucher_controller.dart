import 'package:get/get.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class VoucherController extends GetxController {
  VoucherController(this._repository, this._storefront);

  final BuyerRepository _repository;
  final StorefrontController _storefront;

  final isLoading = false.obs;
  final tabIndex = 0.obs;
  final available = <VoucherModel>[].obs;
  final saved = <VoucherModel>[].obs;
  final actionId = RxnInt();

  @override
  void onInit() {
    super.onInit();
    loadData();
  }

  Future<void> loadData() async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    isLoading.value = true;
    try {
      await Future.wait([
        _loadAvailable(slug),
        _loadSaved(slug),
      ]);
      _syncSavedFlags();
    } finally {
      isLoading.value = false;
    }
  }

  void _syncSavedFlags() {
    final savedIds = saved.map((v) => v.id).toSet();
    available.assignAll(
      available.map((v) => v.copyWith(isSaved: savedIds.contains(v.id) || v.isSaved)).toList(),
    );
  }

  Future<void> _loadAvailable(String slug) async {
    try {
      available.assignAll(await _repository.getAvailableVouchers(slug));
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> _loadSaved(String slug) async {
    try {
      saved.assignAll(await _repository.getSavedVouchers(slug));
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> saveVoucher(VoucherModel voucher) async {
    if (voucher.isSaved) return;
    actionId.value = voucher.id;
    try {
      await _repository.saveVoucher(voucher.id);
      final savedVoucher = voucher.copyWith(isSaved: true);
      _markAvailableSaved(voucher.id, true);
      if (!saved.any((v) => v.id == voucher.id)) {
        saved.insert(0, savedVoucher);
      }
      AppSnackbar.success('Đã lưu voucher');
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
      await loadData();
    } finally {
      actionId.value = null;
    }
  }

  Future<void> unsaveVoucher(VoucherModel voucher) async {
    actionId.value = voucher.id;
    try {
      await _repository.unsaveVoucher(voucher.id);
      _markAvailableSaved(voucher.id, false);
      saved.removeWhere((v) => v.id == voucher.id);
      AppSnackbar.success('Đã bỏ lưu voucher');
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
      await loadData();
    } finally {
      actionId.value = null;
    }
  }

  void _markAvailableSaved(int id, bool isSaved) {
    final index = available.indexWhere((v) => v.id == id);
    if (index >= 0) {
      available[index] = available[index].copyWith(isSaved: isSaved);
      available.refresh();
    }
  }
}
