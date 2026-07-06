import 'package:flutter/material.dart';

/// Modern, fresh color palette for a green-grocery marketplace.
class AppColors {
  AppColors._();

  // Brand green
  static const primary = Color(0xFF1DA860);
  static const primaryDark = Color(0xFF0F7A45);
  static const primaryLight = Color(0xFF4ECB86);
  static const primarySoft = Color(0xFFE6F7EE);

  // Accent (used for discounts, highlights, ratings)
  static const accent = Color(0xFFFF8A3D);
  static const accentSoft = Color(0xFFFFF0E4);

  static const secondary = Color(0xFF8BC34A);

  // Neutrals
  static const background = Color(0xFFF6F9F7);
  static const surface = Colors.white;
  static const surfaceMuted = Color(0xFFF1F4F2);
  static const border = Color(0xFFE7ECE9);
  static const divider = Color(0xFFEDF1EF);

  static const textPrimary = Color(0xFF1B2420);
  static const textSecondary = Color(0xFF6B7A72);
  static const textMuted = Color(0xFF9AA69F);

  static const error = Color(0xFFE5484D);
  static const errorSoft = Color(0xFFFDECEC);
  static const success = Color(0xFF1DA860);
  static const warning = Color(0xFFF5A524);
  static const star = Color(0xFFFFB020);

  static const shadow = Color(0x1A1B2420);

  static const primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryDark],
  );

  static const heroGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [primaryLight, primary],
  );
}
