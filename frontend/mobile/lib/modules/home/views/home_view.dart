import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/modules/home/controllers/home_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/widgets/product_card.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final slug = currentSlug();
    final storefront = Get.find<StorefrontController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: controller.loadData,
        child: Obx(
          () => CenterLoadingBody(
            isLoading: controller.isLoading.value,
            message: 'Đang tải...',
            child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: _Header(
                  slug: slug,
                  storeName: () {
                    final dealer = storefront.dealer.value;
                    return dealer?.storeName.isNotEmpty == true ? dealer!.storeName : slug;
                  }(),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    if (controller.categories.isNotEmpty) ...[
                      SizedBox(
                        height: 40,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: controller.categories.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 8),
                          itemBuilder: (context, index) {
                            final category = controller.categories[index];
                            return ActionChip(
                              label: Text(category.name),
                              backgroundColor: AppColors.surfaceMuted,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(AppRadius.pill),
                                side: BorderSide.none,
                              ),
                              onPressed: () => Get.toNamed(AppRoutes.products(slug)),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    if (controller.bestSellers.isNotEmpty) ...[
                      _sectionTitle(context, 'Bán chạy', Icons.local_fire_department_rounded),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 232,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: controller.bestSellers.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 12),
                          itemBuilder: (context, index) {
                            final product = controller.bestSellers[index];
                            return SizedBox(
                              width: 152,
                              child: ProductCard(
                                product: product,
                                onTap: () => Get.toNamed(
                                  AppRoutes.productDetail(slug, product.id),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _sectionTitle(context, 'Sản phẩm nổi bật', Icons.grass_rounded),
                        TextButton(
                          onPressed: () => Get.toNamed(AppRoutes.products(slug)),
                          child: const Text('Xem tất cả'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.66,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: controller.products.length,
                      itemBuilder: (context, index) {
                        final product = controller.products[index];
                        return ProductCard(
                          product: product,
                          onTap: () => Get.toNamed(AppRoutes.productDetail(slug, product.id)),
                        );
                      },
                    ),
                  ]),
                ),
              ),
            ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(BuildContext context, String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
      ],
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.slug, required this.storeName});

  final String slug;
  final String storeName;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      decoration: const BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(AppRadius.xl),
          bottomRight: Radius.circular(AppRadius.xl),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Xin chào 👋',
                        style: AppTextStyles.captionMuted.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        storeName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.headline.copyWith(color: Colors.white),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: const Icon(Icons.eco_rounded, color: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 18),
            InkWell(
              borderRadius: BorderRadius.circular(AppRadius.pill),
              onTap: () => Get.toNamed(AppRoutes.search(slug)),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                  boxShadow: const [
                    BoxShadow(color: Color(0x1A000000), blurRadius: 12, offset: Offset(0, 4)),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                    const SizedBox(width: 10),
                    Text(
                      'Tìm sản phẩm tươi ngon...',
                      style: AppTextStyles.hint,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
