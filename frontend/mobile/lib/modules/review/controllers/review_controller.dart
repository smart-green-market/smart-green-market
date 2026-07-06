import 'package:get/get.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class ReviewController extends GetxController {
  ReviewController(this._repository, this._storefront);

  final BuyerRepository _repository;
  final StorefrontController _storefront;

  final isLoading = false.obs;
  final isSubmitting = false.obs;
  final tabIndex = 0.obs;
  final pending = <PendingReviewModel>[].obs;
  final reviews = <ReviewModel>[].obs;

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
        _repository.getPendingReviews(slug),
        _repository.getMyReviews(slug),
      ]);
      pending.assignAll(results[0] as List<PendingReviewModel>);
      reviews.assignAll((results[1] as PaginatedResponse<ReviewModel>).results);
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> submitReview(
    PendingReviewModel item, {
    required int rating,
    required String comment,
    required List<String> imagePaths,
  }) async {
    if (isSubmitting.value) return false;

    isSubmitting.value = true;
    try {
      await _repository.createReview(
        _storefront.currentSlug,
        orderId: item.orderId,
        dealerProductId: item.dealerProductId,
        rating: rating,
        comment: comment,
        imagePaths: imagePaths,
      );
      AppSnackbar.success('Gửi đánh giá thành công');
      await loadData();
      return true;
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<void> deleteReview(int id) async {
    try {
      await _repository.deleteReview(_storefront.currentSlug, id);
      AppSnackbar.success('Đã xóa đánh giá');
      await loadData();
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }
}
