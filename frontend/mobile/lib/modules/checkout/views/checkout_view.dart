import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/core/constants/app_constants.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/formatters.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/modules/checkout/controllers/checkout_controller.dart';
import 'package:smart_green_market/modules/checkout/views/checkout_voucher_section.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/widgets/section_card.dart';

class CheckoutView extends StatefulWidget {
  const CheckoutView({super.key});

  @override
  State<CheckoutView> createState() => _CheckoutViewState();
}

class _CheckoutViewState extends State<CheckoutView> {
  late final CheckoutController controller;
  final _noteController = TextEditingController();
  final _voucherController = TextEditingController();

  @override
  void initState() {
    super.initState();
    controller = Get.put(CheckoutController(Get.find(), Get.find(), Get.find()));
  }

  @override
  void dispose() {
    _noteController.dispose();
    _voucherController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const AppHeaderBar(
        title: 'Đặt hàng',
        subtitle: 'Xác nhận thông tin giao hàng',
      ),
      body: Obx(
        () => CenterLoadingBody(
          isLoading: controller.isLoading.value,
          message: 'Đang tải thông tin đặt hàng...',
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  children: [
                    SectionCard(
                      title: 'Sản phẩm (${controller.checkoutItems.length})',
                      icon: Icons.shopping_bag_outlined,
                      child: Column(
                        children: [
                          for (var i = 0; i < controller.checkoutItems.length; i++) ...[
                            if (i > 0) const Divider(height: 20),
                            _CheckoutItemRow(item: controller.checkoutItems[i]),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    SectionCard(
                      title: 'Địa chỉ giao hàng',
                      icon: Icons.location_on_outlined,
                      child: Column(
                        children: [
                          ...controller.addresses.map(
                            (address) => SelectableOptionTile(
                              selected: controller.selectedAddressId.value == address.id,
                              title: address.receiverName,
                              subtitle: '${address.receiverPhone}\n${address.address}',
                              onTap: () => controller.selectedAddressId.value = address.id,
                            ),
                          ),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: TextButton.icon(
                              onPressed: _showAddAddressDialog,
                              icon: const Icon(Icons.add_rounded, size: 18),
                              label: const Text('Thêm địa chỉ mới'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    SectionCard(
                      title: 'Khung giờ giao',
                      icon: Icons.schedule_outlined,
                      child: Column(
                        children: controller.deliveryDates.expand((date) {
                          return date.slots.map((slot) {
                            final value = '${date.date}|${slot.id}';
                            final selected = controller.selectedDate.value.isNotEmpty &&
                                '${controller.selectedDate.value}|${controller.selectedSlot.value}' ==
                                    value;
                            return SelectableOptionTile(
                              selected: selected,
                              enabled: slot.available,
                              title:
                                  '${date.label.isNotEmpty ? date.label : date.date} · ${slot.name}',
                              subtitle: slot.timeLabel,
                              onTap: () {
                                controller.selectedDate.value = date.date;
                                controller.selectedSlot.value = slot.id;
                              },
                            );
                          });
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 14),
                    SectionCard(
                      title: 'Ghi chú & Voucher',
                      icon: Icons.local_offer_outlined,
                      child: Column(
                        children: [
                          TextField(
                            controller: _noteController,
                            decoration: const InputDecoration(
                              labelText: 'Ghi chú cho shop (tuỳ chọn)',
                              prefixIcon: Icon(Icons.edit_note_outlined, size: 20),
                            ),
                            onChanged: (v) => controller.note.value = v,
                          ),
                          const SizedBox(height: 12),
                          CheckoutVoucherSection(
                            controller: controller,
                            voucherTextController: _voucherController,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    SectionCard(
                      title: 'Chi tiết thanh toán',
                      icon: Icons.receipt_long_outlined,
                      child: Column(
                        children: [
                          _summaryRow('Tạm tính', Formatters.currency(controller.subtotal)),
                          _summaryRow(
                            'Phí giao hàng',
                            Formatters.currency(AppConstants.checkoutShippingFee),
                          ),
                          if (controller.discount > 0)
                            _summaryRow(
                              'Giảm giá',
                              '-${Formatters.currency(controller.discount)}',
                              valueColor: AppColors.primaryDark,
                            ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Divider(height: 1),
                          ),
                          _summaryRow(
                            'Tổng cộng',
                            Formatters.currency(controller.total),
                            bold: true,
                          ),
                          const SizedBox(height: 10),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceMuted,
                              borderRadius: BorderRadius.circular(AppRadius.sm),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.payments_outlined, size: 18, color: AppColors.primary),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Thanh toán COD khi nhận hàng',
                                    style: AppTextStyles.captionMuted.copyWith(fontWeight: FontWeight.w500),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              _CheckoutBottomBar(controller: controller),
            ],
          ),
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: bold
                ? AppTextStyles.subtitleBold
                : AppTextStyles.captionMuted.copyWith(fontWeight: FontWeight.w500),
          ),
          Text(
            value,
            style: (bold ? AppTextStyles.title : AppTextStyles.bodySemiBold).copyWith(
              fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
              color: valueColor ?? (bold ? AppColors.primaryDark : AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showAddAddressDialog() async {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final addressController = TextEditingController();

    await Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        title: const Text('Thêm địa chỉ'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Người nhận'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(labelText: 'SĐT'),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: addressController,
                decoration: const InputDecoration(labelText: 'Địa chỉ'),
                maxLines: 2,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: Get.back, child: const Text('Huỷ')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(minimumSize: const Size(0, 44)),
            onPressed: () async {
              await controller.createAddress(
                receiverName: nameController.text.trim(),
                receiverPhone: phoneController.text.trim(),
                address: addressController.text.trim(),
              );
              Get.back();
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }
}

class _CheckoutItemRow extends StatelessWidget {
  const _CheckoutItemRow({required this.item});

  final CartItemModel item;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.primarySoft,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            'x${item.quantity}',
            style: AppTextStyles.micro.copyWith(color: AppColors.primaryDark),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            item.name,
            style: AppTextStyles.bodySemiBold,
          ),
        ),
        const SizedBox(width: 12),
        Text(
          Formatters.currency(item.subtotal),
          style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primaryDark),
        ),
      ],
    );
  }
}

class _CheckoutBottomBar extends StatelessWidget {
  const _CheckoutBottomBar({required this.controller});

  final CheckoutController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 16),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
        boxShadow: [
          BoxShadow(color: AppColors.shadow, blurRadius: 20, offset: Offset(0, -6)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Tổng thanh toán',
                    style: AppTextStyles.captionMuted,
                  ),
                  const SizedBox(height: 2),
                  Obx(
                    () => Text(
                      Formatters.currency(controller.total),
                      style: AppTextStyles.price.copyWith(color: AppColors.primaryDark),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Obx(
              () => SizedBox(
                width: 168,
                child: ElevatedButton(
                  onPressed: (controller.submitting.value || controller.stockChecking.value)
                      ? null
                      : controller.prepareCheckout,
                  child: controller.submitting.value || controller.stockChecking.value
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Xác nhận'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
