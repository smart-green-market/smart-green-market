import 'package:get/get.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class PreOrderController extends GetxController {
  PreOrderController(this._repository, this._storefront);

  final BuyerRepository _repository;
  final StorefrontController _storefront;

  final isLoading = false.obs;
  final actionLoading = false.obs;
  final requests = <PreOrderModel>[].obs;
  final selectedId = RxnInt();
  final detail = Rxn<PreOrderModel>();

  PreOrderModel? get selectedSummary {
    final id = selectedId.value;
    if (id == null) return detail.value;
    return requests.firstWhereOrNull((item) => item.id == id) ?? detail.value;
  }

  @override
  void onInit() {
    super.onInit();
    loadRequests();
  }

  Future<void> loadRequests() async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    isLoading.value = true;
    try {
      requests.assignAll(await _repository.getPreOrders(slug));
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> selectRequest(int id) async {
    selectedId.value = id;
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    try {
      detail.value = await _repository.getPreOrder(slug, id);
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> acceptSelected() async {
    final slug = _storefront.currentSlug;
    final id = selectedId.value;
    if (slug.isEmpty || id == null) return;

    actionLoading.value = true;
    try {
      await _repository.acceptPreOrder(slug, id);
      AppSnackbar.success('Đã xác nhận yêu cầu đặt trước');
      await loadRequests();
      await selectRequest(id);
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      actionLoading.value = false;
    }
  }

  Future<void> rejectSelected(String reason) async {
    final slug = _storefront.currentSlug;
    final id = selectedId.value;
    if (slug.isEmpty || id == null) return;

    actionLoading.value = true;
    try {
      await _repository.rejectPreOrder(slug, id, reason);
      AppSnackbar.success('Đã từ chối yêu cầu đặt trước');
      await loadRequests();
      await selectRequest(id);
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      actionLoading.value = false;
    }
  }
}
