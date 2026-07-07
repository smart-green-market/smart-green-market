import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/constants/app_constants.dart';
import 'package:smart_green_market/core/utils/preorder_utils.dart';
import 'package:smart_green_market/core/utils/voucher_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/modules/checkout/views/stock_shortfall_sheet.dart';
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
  final stockChecking = false.obs;
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

  Future<void> prepareCheckout() async {
    final slug = _storefront.currentSlug;
    if (checkoutItems.isEmpty) {
      AppSnackbar.error('Không có sản phẩm để đặt');
      return;
    }
    if (selectedAddressId.value == null) {
      AppSnackbar.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    if (selectedDate.value.isEmpty || selectedSlot.value.isEmpty) {
      AppSnackbar.error('Vui lòng chọn khung giờ giao hàng');
      return;
    }

    stockChecking.value = true;
    try {
      final stockResults = await _repository.checkStock(
        slug,
        checkoutItems
            .map((item) => {'dealer_product_id': item.id, 'quantity': item.quantity})
            .toList(),
      );
      final merged = PreorderUtils.mergeStockWithCheckoutItems(checkoutItems, stockResults);
      final hasShortfall = merged.any((row) => row.needsChoice);

      if (hasShortfall) {
        await Get.bottomSheet(
          StockShortfallSheet(
            mergedItems: merged,
            submitting: submitting.value,
            onConfirm: (choices) async {
              Get.back();
              await _submitCheckout(merged, choices);
            },
          ),
          isScrollControlled: true,
          backgroundColor: Colors.white,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
        );
        return;
      }

      await _submitCheckout(merged, null);
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      stockChecking.value = false;
    }
  }

  Future<void> _submitCheckout(
    List<MergedCheckoutStockItem> mergedItems,
    Map<int, String>? choices,
  ) async {
    final slug = _storefront.currentSlug;
    final addressId = selectedAddressId.value;
    if (addressId == null) return;

    final split = choices == null
        ? CheckoutSplitResult(
            orderItems: checkoutItems
                .map((item) => {'dealer_product_id': item.id, 'quantity': item.quantity})
                .toList(),
            preorderItems: const [],
            removedProductIds: const [],
          )
        : PreorderUtils.splitCheckoutByChoices(mergedItems, choices);

    if (split.isEmpty) {
      AppSnackbar.info('Không còn sản phẩm nào để đặt hàng');
      return;
    }

    submitting.value = true;
    try {
      final sharedPayload = {
        'customer_address_id': addressId,
        'delivery_date': selectedDate.value,
        'delivery_slot': selectedSlot.value,
        if (note.value.trim().isNotEmpty) 'note': note.value.trim(),
      };
      final voucher = appliedVoucher.value?.voucherCode;

      OrderModel? createdOrder;
      PreOrderModel? createdPreOrder;

      if (split.orderItems.isNotEmpty) {
        createdOrder = await _repository.createOrder(slug, {
          ...sharedPayload,
          'items': split.orderItems,
          if (voucher != null && voucher.isNotEmpty) 'voucher_code': voucher,
        });
      }

      if (split.preorderItems.isNotEmpty) {
        createdPreOrder = await _repository.createPreOrder(slug, {
          ...sharedPayload,
          'items': split.preorderItems,
        });
      }

      final purchasedIds = [
        ...split.orderItems.map((item) => item['dealer_product_id'] as int),
        ...split.preorderItems.map((item) => item['dealer_product_id'] as int),
        ...split.removedProductIds,
      ];
      await _cart.removeOrderedItems(purchasedIds);

      if (createdOrder != null && createdPreOrder != null) {
        AppSnackbar.success('Đã tạo đơn hàng và yêu cầu đặt trước');
      } else if (createdPreOrder != null) {
        AppSnackbar.success('Đã gửi yêu cầu đặt trước');
      } else {
        AppSnackbar.success('Đặt hàng thành công');
      }

      if (createdOrder != null) {
        Get.offAllNamed(
          AppRoutes.orderTracking(slug),
          arguments: {'newOrderId': createdOrder.id, 'orderCode': createdOrder.orderCode},
        );
      } else {
        Get.offAllNamed(AppRoutes.preorders(slug));
      }
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      submitting.value = false;
    }
  }

  Future<void> submitOrder() => prepareCheckout();

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
