import 'package:get/get.dart';
import 'package:smart_green_market/core/constants/api_constants.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class HomeController extends GetxController {
  HomeController(this._repository, this._storefront);

  final BuyerRepository _repository;
  final StorefrontController _storefront;

  final isLoading = false.obs;
  final categories = <CategoryModel>[].obs;
  final bestSellers = <ProductModel>[].obs;
  final products = <ProductModel>[].obs;

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
      final results = await Future.wait([
        _repository.getCategories(slug),
        _repository.getBestSellers(slug),
        _repository.getProducts(
          slug,
          query: {
            'page': 1,
            'page_size': ApiConstants.homeProductPageSize,
            'ordering': '-updated_at',
          },
        ),
      ]);
      categories.assignAll(results[0] as List<CategoryModel>);
      bestSellers.assignAll(results[1] as List<ProductModel>);
      products.assignAll((results[2] as PaginatedResponse<ProductModel>).results);
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      isLoading.value = false;
    }
  }
}
