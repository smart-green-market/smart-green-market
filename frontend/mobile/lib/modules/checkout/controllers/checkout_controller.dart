import 'package:get/get.dart';
import 'package:smart_green_market/core/constants/app_constants.dart';
import 'package:smart_green_market/core/utils/voucher_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/cart_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class CheckoutController extends GetxController {
  CheckoutController(this._repository, this._storefront, this._cart);

  final BuyerRepository _repository;
  final StorefrontController _storefront;
  final CartController _cart;

  final isLoading = false.obs;
  final submitting = false.obs;
  final applyingVoucher = false.obs;
  final addresses = <AddressModel>[].obs;
  final deliveryDates = <DeliveryDateModel>[].obs;
  final savedVouchers = <VoucherModel>[].obs;

  final selectedAddressId = RxnInt();
  final selectedDate = ''.obs;
  final selectedSlot = ''.obs;
  final note = ''.obs;
  final voucherCode = ''.obs;
  final appliedVoucher = Rxn<VoucherApplyResult>();
  final appliedVoucherMeta = Rxn<VoucherModel>();
  final voucherError = ''.obs;

  List<VoucherModel> get filteredSavedVouchers =>
      VoucherUtils.filterByQuery(savedVouchers, voucherCode.value);

  List<CartItemModel> get checkoutItems {
    final buyNow = Get.arguments?['buyNow'];
    if (buyNow is Map) {
      return [CartItemModel.fromJson(Map<String, dynamic>.from(buyNow))];
    }
    return _cart.selectedItems;
  }

  double get subtotal =>
      checkoutItems.fold(0, (sum, item) => sum + item.subtotal);

  double get discount => appliedVoucher.value?.discountAmount ?? 0;

  double get total =>
      subtotal + AppConstants.checkoutShippingFee - discount;

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
        _loadAddresses(slug),
        _loadDeliverySlots(slug),
        _loadSavedVouchers(slug),
      ]);
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> _loadAddresses(String slug) async {
    try {
      addresses.assignAll(await _repository.getAddresses(slug));
      final defaultAddress = addresses.firstWhereOrNull((a) => a.isDefault) ??
          addresses.firstOrNull;
      selectedAddressId.value = defaultAddress?.id;
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> _loadDeliverySlots(String slug) async {
    try {
      deliveryDates.assignAll(await _repository.getDeliverySlots(slug));
      for (final date in deliveryDates) {
        final slot = date.slots.firstWhereOrNull((s) => s.available);
        if (slot != null) {
          selectedDate.value = date.date;
          selectedSlot.value = slot.id;
          break;
        }
      }
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> _loadSavedVouchers(String slug) async {
    try {
      savedVouchers.assignAll(await _repository.getSavedVouchers(slug));
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> applyVoucher({String? code}) async {
    voucherError.value = '';
    final trimmedCode = (code ?? voucherCode.value).trim();
    if (trimmedCode.isEmpty) {
      voucherError.value = 'Nhập hoặc chọn mã voucher';
      return;
    }

    voucherCode.value = trimmedCode;
    final matched = VoucherUtils.findByCode(savedVouchers, trimmedCode);
    if (matched != null) {
      final eligibility = VoucherUtils.eligibility(matched, subtotal);
      if (!eligibility.eligible) {
        voucherError.value = eligibility.reason;
        return;
      }
    }

    applyingVoucher.value = true;
    try {
      final result = await _repository.applyVoucher({
        'voucher_code': trimmedCode,
        'items': checkoutItems
            .map((item) => {'dealer_product_id': item.id, 'quantity': item.quantity})
            .toList(),
      });
      appliedVoucher.value = result;
      appliedVoucherMeta.value = matched;
      AppSnackbar.success('Áp dụng voucher thành công');
    } catch (e) {
      appliedVoucher.value = null;
      appliedVoucherMeta.value = null;
      voucherError.value = _repository.readError(e);
    } finally {
      applyingVoucher.value = false;
    }
  }

  Future<void> selectSavedVoucher(VoucherModel voucher) async {
    if (appliedVoucher.value != null) return;
    await applyVoucher(code: voucher.code);
  }

  void removeVoucher() {
    appliedVoucher.value = null;
    appliedVoucherMeta.value = null;
    voucherCode.value = '';
    voucherError.value = '';
  }

  void onVoucherCodeChanged(String value) {
    voucherCode.value = value;
    if (appliedVoucher.value != null &&
        value.trim().toLowerCase() != appliedVoucher.value!.voucherCode.toLowerCase()) {
      appliedVoucher.value = null;
      appliedVoucherMeta.value = null;
    }
    if (voucherError.value.isNotEmpty) {
      voucherError.value = '';
    }
  }

  Future<void> submitOrder() async {
    final slug = _storefront.currentSlug;
    final addressId = selectedAddressId.value;
    if (checkoutItems.isEmpty) {
      AppSnackbar.error('Không có sản phẩm để đặt');
      return;
    }
    if (addressId == null) {
      AppSnackbar.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    if (selectedDate.value.isEmpty || selectedSlot.value.isEmpty) {
      AppSnackbar.error('Vui lòng chọn khung giờ giao hàng');
      return;
    }

    submitting.value = true;
    try {
      final order = await _repository.createOrder(slug, {
        'items': checkoutItems
            .map((item) => {'dealer_product_id': item.id, 'quantity': item.quantity})
            .toList(),
        'customer_address_id': addressId,
        'delivery_date': selectedDate.value,
        'delivery_slot': selectedSlot.value,
        if (note.value.trim().isNotEmpty) 'note': note.value.trim(),
        if (appliedVoucher.value?.voucherCode.isNotEmpty == true)
          'voucher_code': appliedVoucher.value!.voucherCode,
      });

      await _cart.removeOrderedItems(checkoutItems.map((e) => e.id).toList());
      AppSnackbar.success('Đặt hàng thành công');
      Get.offAllNamed(
        '/store/$slug/orders/tracking',
        arguments: {'newOrderId': order.id, 'orderCode': order.orderCode},
      );
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      submitting.value = false;
    }
  }

  Future<AddressModel?> createAddress({
    required String receiverName,
    required String receiverPhone,
    required String address,
    bool isDefault = false,
  }) async {
    if (addresses.length >= AppConstants.maxBuyerAddresses) {
      AppSnackbar.error('Tối đa ${AppConstants.maxBuyerAddresses} địa chỉ');
      return null;
    }
    try {
      final created = await _repository.createAddress(_storefront.currentSlug, {
        'receiver_name': receiverName,
        'receiver_phone': receiverPhone,
        'address': address,
        'is_default': isDefault,
      });
      addresses.add(created);
      selectedAddressId.value = created.id;
      return created;
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
      return null;
    }
  }
}
