import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/modules/product/controllers/product_list_controller.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/widgets/paginated_product_grid.dart';
import 'package:smart_green_market/shared/widgets/empty_state_widget.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class ProductListView extends StatefulWidget {
  const ProductListView({super.key});

  @override
  State<ProductListView> createState() => _ProductListViewState();
}

class _ProductListViewState extends State<ProductListView> {
  final _scrollController = ScrollController();
  late final ProductListController controller;

  @override
  void initState() {
    super.initState();
    if (!Get.isRegistered<ProductListController>()) {
      Get.put(ProductListController(Get.find(), Get.find()));
    }
    controller = Get.find<ProductListController>();
    ever<int?>(controller.selectedCategoryId, (_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(0);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slug = currentSlug();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppHeaderBar(
        title: 'Sản phẩm',
        showBack: false,
        actions: [
          HeaderActionButton(
            icon: Icons.search_rounded,
            iconSize: 20,
            onPressed: () => Get.toNamed(AppRoutes.search(slug)),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: Obx(
            () => HeaderFilterBar(
              children: [
                FilterChip(
                  label: const Text('Tất cả'),
                  selected: controller.selectedCategoryId.value == null,
                  showCheckmark: false,
                  labelStyle: TextStyle(
                    color: controller.selectedCategoryId.value == null
                        ? Colors.white
                        : AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                  onSelected: controller.isLoading.value
                      ? null
                      : (_) => controller.setCategory(null),
                ),
                ...controller.categories.map(
                  (c) => FilterChip(
                    label: Text(c.name),
                    selected: controller.selectedCategoryId.value == c.id,
                    showCheckmark: false,
                    labelStyle: TextStyle(
                      color: controller.selectedCategoryId.value == c.id
                          ? Colors.white
                          : AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                    onSelected: controller.isLoading.value
                        ? null
                        : (_) => controller.setCategory(c.id),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: Obx(
        () => CenterLoadingBody(
          isLoading: controller.isLoading.value,
          message: 'Đang tải sản phẩm...',
          child: controller.products.isEmpty
              ? const EmptyStateWidget(
                  title: 'Không có sản phẩm',
                  icon: Icons.inventory_2_outlined,
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: controller.loadData,
                  child: PaginatedProductGrid(
                    scrollController: _scrollController,
                    products: controller.products,
                    isLoadingMore: controller.isLoadingMore.value,
                    onScrollNearEnd: controller.loadMore,
                    onProductTap: (product) =>
                        Get.toNamed(AppRoutes.productDetail(slug, product.id)),
                  ),
                ),
        ),
      ),
    );
  }
}
