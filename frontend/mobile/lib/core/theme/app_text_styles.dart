import 'package:flutter/material.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';

/// Font-size scale derived from the sizes most used across the app.
///
/// Merged variants: 11.5→11, 12.5→13, 14.5→14, 18→17.
class AppFontSizes {
  AppFontSizes._();

  static const micro = 11.0;
  static const caption = 12.0;
  static const captionLg = 13.0;
  static const body = 14.0;
  static const subtitle = 15.0;
  static const title = 16.0;
  static const appBar = 17.0;
  static const headline = 20.0;
  static const price = 22.0;
}

/// Semantic text styles for use without [BuildContext].
/// Prefer [Theme.of(context).textTheme] when a [BuildContext] is available.
class AppTextStyles {
  AppTextStyles._();

  static const micro = TextStyle(
    fontSize: AppFontSizes.micro,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );

  static const microMuted = TextStyle(
    fontSize: AppFontSizes.micro,
    fontWeight: FontWeight.w500,
    color: AppColors.textMuted,
  );

  static const caption = TextStyle(
    fontSize: AppFontSizes.caption,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );

  static const captionMuted = TextStyle(
    fontSize: AppFontSizes.captionLg,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
  );

  static const hint = TextStyle(
    fontSize: AppFontSizes.captionLg,
    fontWeight: FontWeight.w400,
    color: AppColors.textMuted,
  );

  static const body = TextStyle(
    fontSize: AppFontSizes.body,
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimary,
    height: 1.35,
  );

  static const bodyBold = TextStyle(
    fontSize: AppFontSizes.body,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );

  static const bodySemiBold = TextStyle(
    fontSize: AppFontSizes.body,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static const subtitle = TextStyle(
    fontSize: AppFontSizes.subtitle,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static const subtitleBold = TextStyle(
    fontSize: AppFontSizes.subtitle,
    fontWeight: FontWeight.w800,
    color: AppColors.textPrimary,
  );

  static const title = TextStyle(
    fontSize: AppFontSizes.title,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );

  static const appBarTitle = TextStyle(
    fontSize: AppFontSizes.appBar,
    fontWeight: FontWeight.w800,
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
    height: 1.15,
  );

  static const appBarSubtitle = TextStyle(
    fontSize: AppFontSizes.captionLg,
    fontWeight: FontWeight.w500,
    color: AppColors.textMuted,
  );

  static const headline = TextStyle(
    fontSize: AppFontSizes.headline,
    fontWeight: FontWeight.w800,
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  );

  static const price = TextStyle(
    fontSize: AppFontSizes.price,
    fontWeight: FontWeight.w800,
    color: AppColors.primary,
  );

  static const priceLine = TextStyle(
    fontSize: AppFontSizes.subtitle,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
  );

  static const error = TextStyle(
    fontSize: AppFontSizes.captionLg,
    fontWeight: FontWeight.w400,
    color: AppColors.error,
  );

  static const badge = TextStyle(
    fontSize: AppFontSizes.micro,
    fontWeight: FontWeight.w700,
    color: Colors.white,
  );
}
