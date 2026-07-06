import 'package:get/get.dart';
import 'package:smart_green_market/core/constants/api_constants.dart';
import 'package:smart_green_market/core/utils/buyer_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class ProductListController extends GetxController {
  ProductListController(this._repository, this._storefront);

  final BuyerRepository _repository;
  final StorefrontController _storefront;

  final isLoading = false.obs;
  final isLoadingMore = false.obs;
  final hasMore = false.obs;
  final products = <ProductModel>[].obs;
  final categories = <CategoryModel>[].obs;
  final selectedCategoryId = RxnInt();
  final ordering = '-updated_at'.obs;

  var _page = 1;
  var _loadGeneration = 0;

  @override
  void onInit() {
    super.onInit();
    final category = Get.parameters['category'];
    if (category != null) selectedCategoryId.value = int.tryParse(category);
    loadData();
  }

  Map<String, dynamic> get _productQuery => {
        'ordering': ordering.value,
        'page_size': ApiConstants.productPageSize,
        if (selectedCategoryId.value != null) 'category': selectedCategoryId.value,
      };

  Future<void> loadData() async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    final token = ++_loadGeneration;
    _page = 1;
    hasMore.value = false;
    isLoadingMore.value = false;
    isLoading.value = true;

    try {
      if (categories.isEmpty) {
        final cats = await _repository.getCategories(slug);
        if (token != _loadGeneration) return;
        categories.assignAll(cats);
      }

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
      if (_isInvalidPageError(e)) {
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

  bool _isInvalidPageError(Object error) {
    final message = ApiErrorUtils.extractMessage(error).toLowerCase();
    return message.contains('invalid page');
  }

  void setCategory(int? id) {
    if (selectedCategoryId.value == id) return;
    selectedCategoryId.value = id;
    loadData();
  }

  void setOrdering(String value) {
    if (ordering.value == value) return;
    ordering.value = value;
    loadData();
  }
}
