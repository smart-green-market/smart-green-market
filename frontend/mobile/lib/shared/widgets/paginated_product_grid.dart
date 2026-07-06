import 'package:flutter/material.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/shared/widgets/product_card.dart';

/// Product grid with a full-width centered load-more footer (avoids left-aligned spinner in 2-col grid).
class PaginatedProductGrid extends StatelessWidget {
  const PaginatedProductGrid({
    super.key,
    required this.products,
    required this.onProductTap,
    this.isLoadingMore = false,
    this.padding = const EdgeInsets.fromLTRB(12, 0, 12, 12),
    this.onScrollNearEnd,
    this.scrollController,
  });

  final List<ProductModel> products;
  final void Function(ProductModel product) onProductTap;
  final bool isLoadingMore;
  final EdgeInsets padding;
  final VoidCallback? onScrollNearEnd;
  final ScrollController? scrollController;

  static const _gridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    childAspectRatio: 0.66,
    crossAxisSpacing: 12,
    mainAxisSpacing: 12,
  );

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (scroll) {
        if (onScrollNearEnd != null &&
            scroll.metrics.pixels >= scroll.metrics.maxScrollExtent - 240) {
          onScrollNearEnd!();
        }
        return false;
      },
      child: CustomScrollView(
        controller: scrollController,
        slivers: [
          SliverPadding(
            padding: padding,
            sliver: SliverGrid(
              gridDelegate: _gridDelegate,
              delegate: SliverChildBuilderDelegate(
                (context, index) => ProductCard(
                  product: products[index],
                  onTap: () => onProductTap(products[index]),
                ),
                childCount: products.length,
              ),
            ),
          ),
          if (isLoadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.only(bottom: 24),
                child: Center(
                  child: SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
