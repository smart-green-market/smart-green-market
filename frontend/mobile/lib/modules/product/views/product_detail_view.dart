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
import 'package:smart_green_market/modules/product/controllers/product_detail_controller.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/widgets/product_card.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class ProductDetailView extends GetView<ProductDetailController> {
  const ProductDetailView({super.key});

  @override
  String? get tag => Get.parameters['id'];

  @override
  Widget build(BuildContext context) {
    final slug = currentSlug();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const AppHeaderBar(title: 'Chi tiết sản phẩm'),
      body: Obx(() {
        final product = controller.product.value;
        return CenterLoadingBody(
          isLoading: controller.isLoading.value && product == null,
          message: 'Đang tải sản phẩm...',
          child: product == null
              ? const Center(child: Text('Không tìm thấy sản phẩm'))
              : _ProductDetailContent(
                  controller: controller,
                  product: product,
                  slug: slug,
                ),
        );
      }),
    );
  }
}

class _ProductDetailContent extends StatelessWidget {
  const _ProductDetailContent({
    required this.controller,
    required this.product,
    required this.slug,
  });

  final ProductDetailController controller;
  final ProductModel product;
  final String slug;

  @override
  Widget build(BuildContext context) {
    final summary = controller.reviewSummary.value;
    final avgRating = summary?['average_rating'];

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            children: [
              AspectRatio(
                aspectRatio: 1.2,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  child: CachedNetworkImage(
                    imageUrl: product.thumbnail.isNotEmpty
                        ? product.thumbnail
                        : AppConstants.placeholderImage,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => Container(color: AppColors.surfaceMuted),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      product.title,
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ),
                  if (avgRating != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.accentSoft,
                        borderRadius: BorderRadius.circular(AppRadius.pill),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded, size: 16, color: AppColors.star),
                          const SizedBox(width: 3),
                          Text(
                            double.tryParse('$avgRating')?.toStringAsFixed(1) ?? '$avgRating',
                            style: AppTextStyles.captionMuted.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    Formatters.currency(product.displayPrice),
                    style: AppTextStyles.price.copyWith(color: AppColors.primaryDark),
                  ),
                  if (product.hasDiscount) ...[
                    const SizedBox(width: 10),
                    Text(
                      Formatters.currency(product.retailPrice),
                      style: AppTextStyles.body.copyWith(
                        decoration: TextDecoration.lineThrough,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 16),
              Text(
                product.description.isNotEmpty ? product.description : 'Không có mô tả',
                style: AppTextStyles.captionMuted.copyWith(height: 1.5),
              ),
              const SizedBox(height: 18),
              Obx(
                () => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceMuted,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Row(
                    children: [
                      _QtyButton(
                        icon: Icons.remove_rounded,
                        onTap: controller.decreaseQty,
                      ),
                      Container(
                        constraints: const BoxConstraints(minWidth: 40),
                        alignment: Alignment.center,
                        child: Text(
                          '${controller.quantity.value}',
                          style: AppTextStyles.title,
                        ),
                      ),
                      _QtyButton(
                        icon: Icons.add_rounded,
                        onTap: controller.increaseQty,
                      ),
                      const Spacer(),
                      Text(
                        'Còn: ${product.availableQuantity} ${product.unit}',
                        style: AppTextStyles.captionMuted,
                      ),
                    ],
                  ),
                ),
              ),
              Obx(() {
                if (controller.related.isEmpty) return const SizedBox.shrink();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 26),
                    Text(
                      'Sản phẩm liên quan',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 226,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: controller.related.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final item = controller.related[index];
                          return SizedBox(
                            width: 150,
                            child: ProductCard(
                              product: item,
                              onTap: () => Get.toNamed(AppRoutes.productDetail(slug, item.id)),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                );
              }),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            boxShadow: [
              BoxShadow(color: AppColors.shadow, blurRadius: 18, offset: Offset(0, -4)),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: controller.addToCart,
                    icon: const Icon(Icons.add_shopping_cart_rounded, size: 18),
                    label: const Text('Thêm giỏ hàng'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: product.inStock ? controller.buyNow : null,
                    child: const Text('Mua ngay'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.xs),
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.xs),
          border: Border.all(color: AppColors.border),
        ),
        child: Icon(icon, size: 16, color: AppColors.textPrimary),
      ),
    );
  }
}
