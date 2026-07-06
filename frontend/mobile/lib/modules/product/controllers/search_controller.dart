import 'package:get/get.dart';
import 'package:smart_green_market/core/constants/api_constants.dart';
import 'package:smart_green_market/core/utils/buyer_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class ProductSearchController extends GetxController {
  ProductSearchController(this._repository, this._storefront);

  final BuyerRepository _repository;
  final StorefrontController _storefront;

  final isLoading = false.obs;
  final isLoadingMore = false.obs;
  final hasMore = false.obs;
  final query = ''.obs;
  final products = <ProductModel>[].obs;

  var _page = 1;
  var _loadGeneration = 0;

  Map<String, dynamic> get _productQuery => {
        'ordering': '-updated_at',
        'page_size': ApiConstants.productPageSize,
        if (query.value.isNotEmpty) 'search': query.value,
      };

  Future<void> search(String value) async {
    query.value = value.trim();
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    final token = ++_loadGeneration;
    _page = 1;
    hasMore.value = false;
    isLoadingMore.value = false;
    isLoading.value = true;
    products.clear();

    try {
      final result = await _repository.getProducts(
        slug,
        query: {..._productQuery, 'page': 1},
      );
      if (token != _loadGeneration) return;

      products.assignAll(result.results);
      hasMore.value = result.hasMore;
      _page = 2;
    } catch (e) {
      if (token != _loadGeneration) return;
      AppSnackbar.error(_repository.readError(e));
    } finally {
      if (token == _loadGeneration) {
        isLoading.value = false;
      }
    }
  }

  Future<void> loadMore() async {
    if (isLoading.value || isLoadingMore.value || !hasMore.value) return;

    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    final token = _loadGeneration;
    final page = _page;
    isLoadingMore.value = true;

    try {
      final result = await _repository.getProducts(
        slug,
        query: {..._productQuery, 'page': page},
      );
      if (token != _loadGeneration) return;

      if (result.results.isEmpty) {
        hasMore.value = false;
        return;
      }

      products.addAll(result.results);
      hasMore.value = result.hasMore;
      _page = page + 1;
    } catch (e) {
      if (token != _loadGeneration) return;
      final message = ApiErrorUtils.extractMessage(e).toLowerCase();
      if (message.contains('invalid page')) {
        hasMore.value = false;
      } else {
        AppSnackbar.error(_repository.readError(e));
      }
    } finally {
      if (token == _loadGeneration) {
        isLoadingMore.value = false;
      }
    }
  }
}
