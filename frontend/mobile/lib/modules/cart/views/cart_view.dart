import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/constants/app_constants.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/formatters.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/modules/main/controllers/main_controller.dart';
import 'package:smart_green_market/shared/controllers/cart_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/widgets/empty_state_widget.dart';

class CartView extends StatefulWidget {
  const CartView({super.key, this.embedded = false});

  /// When true, used inside [MainView] bottom nav (no back button).
  final bool embedded;

  @override
  State<CartView> createState() => _CartViewState();
}

class _CartViewState extends State<CartView> {
  final _cart = Get.find<CartController>();
  final _storefront = Get.find<StorefrontController>();
  final _repository = Get.find<BuyerRepository>();
  var _syncing = false;

  @override
  void initState() {
    super.initState();
    _syncStock();
  }

  Future<void> _syncStock() async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty || _cart.items.isEmpty) return;
    setState(() => _syncing = true);
    try {
      final ids = _cart.items.map((item) => item.id).toList();
      final products = await _repository.getProductsByIds(slug, ids);
      await _cart.syncWithCatalog(products);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final slug = currentSlug();

    return Obx(() {
      final count = _cart.items.length;
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppHeaderBar(
          title: 'Giỏ hàng',
          subtitle: count > 0 ? '$count sản phẩm' : null,
          showBack: !widget.embedded,
        ),
        body: _cart.items.isEmpty
            ? EmptyStateWidget(
                title: 'Giỏ hàng trống',
                subtitle: 'Thêm sản phẩm để bắt đầu mua sắm',
                icon: Icons.shopping_cart_outlined,
                action: ElevatedButton(
                  onPressed: () {
                    if (widget.embedded) {
                      Get.find<MainController>().changeTab(MainController.tabProducts);
                      return;
                    }
                    Get.offAllNamed(AppRoutes.main(slug));
                  },
                  child: const Text('Mua sắm ngay'),
                ),
              )
            : CenterLoadingBody(
                isLoading: _syncing,
                message: 'Đang cập nhật giỏ hàng...',
                child: Column(
                  children: [
                    _SelectAllBar(cart: _cart),
                    Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                        itemCount: _cart.items.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final item = _cart.items[index];
                          return _CartItemCard(
                            item: item,
                            onToggle: () => _cart.toggleSelect(item.id),
                            onRemove: () => _cart.removeItem(item.id),
                            onDecrease: item.isOutOfStock
                                ? null
                                : () => _cart.setQuantity(item.id, item.quantity - 1),
                            onIncrease: item.isOutOfStock
                                ? null
                                : () => _cart.setQuantity(item.id, item.quantity + 1),
                          );
                        },
                      ),
                    ),
                    _CartSummaryBar(
                      subtotal: _cart.selectedSubtotal,
                      selectedCount: _cart.selectedItems.length,
                      hasOutOfStockSelected:
                          _cart.selectedItems.any((item) => item.isOutOfStock),
                      onCheckout: _cart.selectedItems.isEmpty ||
                              _cart.selectedItems.any((item) => item.isOutOfStock)
                          ? null
                          : () => Get.toNamed(AppRoutes.checkout(slug)),
                    ),
                  ],
                ),
              ),
      );
    });
  }
}

class _SelectAllBar extends StatelessWidget {
  const _SelectAllBar({required this.cart});

  final CartController cart;

  @override
  Widget build(BuildContext context) {
    final allSelected = cart.items.isNotEmpty && cart.items.every((item) => item.selected);
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 24,
            height: 24,
            child: Checkbox(
              value: allSelected,
              tristate: true,
              onChanged: (_) => cart.toggleAll(!allSelected),
            ),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text('Chọn tất cả', style: AppTextStyles.bodyBold),
          ),
          Text(
            '${cart.selectedItems.length}/${cart.items.length} đã chọn',
            style: AppTextStyles.hint,
          ),
        ],
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  const _CartItemCard({
    required this.item,
    required this.onToggle,
    required this.onRemove,
    required this.onDecrease,
    required this.onIncrease,
  });

  final CartItemModel item;
  final VoidCallback onToggle;
  final VoidCallback onRemove;
  final VoidCallback? onDecrease;
  final VoidCallback? onIncrease;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: item.isOutOfStock ? AppColors.error.withValues(alpha: 0.04) : AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: item.selected ? AppColors.primary.withValues(alpha: 0.35) : AppColors.border),
        boxShadow: const [
          BoxShadow(color: AppColors.shadow, blurRadius: 10, offset: Offset(0, 3)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 18),
            child: SizedBox(
              width: 22,
              height: 22,
              child: Checkbox(
                value: item.selected,
                onChanged: item.isOutOfStock ? null : (_) => onToggle(),
              ),
            ),
          ),
          const SizedBox(width: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.sm),
            child: CachedNetworkImage(
              imageUrl: item.image.isNotEmpty ? item.image : AppConstants.placeholderImage,
              width: 72,
              height: 72,
              fit: BoxFit.cover,
              placeholder: (_, _) => Container(color: AppColors.surfaceMuted),
              errorWidget: (_, _, _) => Container(
                color: AppColors.surfaceMuted,
                child: const Icon(Icons.image_not_supported_outlined, color: AppColors.textMuted),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodyBold.copyWith(height: 1.3),
                ),
                const SizedBox(height: 6),
                Text(
                  Formatters.currency(item.price),
                  style: AppTextStyles.priceLine.copyWith(color: AppColors.primaryDark),
                ),
                Text(
                  '/ ${item.unit}',
                  style: AppTextStyles.caption.copyWith(color: AppColors.textMuted),
                ),
                if (item.availableQuantity != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    item.isOutOfStock
                        ? 'Hết hàng — vui lòng xóa'
                        : 'Tồn kho: ${item.availableQuantity} ${item.unit}',
                    style: AppTextStyles.caption.copyWith(
                      color: item.isOutOfStock ? AppColors.error : AppColors.textMuted,
                    ),
                  ),
                ],
                if (item.exceedsStock) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Vượt tồn — xử lý ở bước thanh toán',
                    style: AppTextStyles.caption.copyWith(color: AppColors.warning),
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    _QtyStepper(
                      quantity: item.quantity,
                      onDecrease: onDecrease,
                      onIncrease: onIncrease,
                    ),
                    const Spacer(),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error, size: 20),
                      onPressed: onRemove,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QtyStepper extends StatelessWidget {
  const _QtyStepper({
    required this.quantity,
    this.onDecrease,
    this.onIncrease,
  });

  final int quantity;
  final VoidCallback? onDecrease;
  final VoidCallback? onIncrease;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(icon: Icons.remove_rounded, onTap: onDecrease),
          Container(
            constraints: const BoxConstraints(minWidth: 32),
            alignment: Alignment.center,
            child: Text(
              '$quantity',
              style: AppTextStyles.bodyBold,
            ),
          ),
          _StepButton(icon: Icons.add_rounded, onTap: onIncrease),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.pill),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(
          icon,
          size: 16,
          color: onTap == null ? AppColors.textMuted : AppColors.textPrimary,
        ),
      ),
    );
  }
}

class _CartSummaryBar extends StatelessWidget {
  const _CartSummaryBar({
    required this.subtotal,
    required this.selectedCount,
    required this.hasOutOfStockSelected,
    required this.onCheckout,
  });

  final double subtotal;
  final int selectedCount;
  final bool hasOutOfStockSelected;
  final VoidCallback? onCheckout;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
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
                    selectedCount > 0 ? 'Tạm tính ($selectedCount SP)' : 'Tạm tính',
                    style: AppTextStyles.captionMuted,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    Formatters.currency(subtotal),
                    style: AppTextStyles.price.copyWith(color: AppColors.primaryDark),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            SizedBox(
              width: 148,
              child: ElevatedButton(
                onPressed: onCheckout,
                child: const Text('Đặt hàng'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
