import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';

/// Unified modern app bar used across every secondary screen.
///
/// Keeping every screen on this single widget is what makes the app feel
/// synchronized: same height, same back button, same title typography and
/// the same soft "floating" shadow instead of a hard divider line.
class AppHeaderBar extends StatelessWidget implements PreferredSizeWidget {
  const AppHeaderBar({
    super.key,
    this.title,
    this.titleWidget,
    this.subtitle,
    this.actions,
    this.leading,
    this.showBack,
    this.centerTitle = false,
    this.backgroundColor = AppColors.surface,
    this.bottom,
    this.onBack,
  }) : assert(title != null || titleWidget != null, 'Provide title or titleWidget');

  final String? title;
  final Widget? titleWidget;
  final String? subtitle;
  final List<Widget>? actions;
  final Widget? leading;
  final bool? showBack;
  final bool centerTitle;
  final Color backgroundColor;
  /// Optional extra row (filters, tabs, search suggestions...) rendered
  /// inside the same elevated header surface, right below the title bar.
  final PreferredSizeWidget? bottom;
  final VoidCallback? onBack;

  static const double _barHeight = 56;

  @override
  Size get preferredSize =>
      Size.fromHeight(_barHeight + (bottom?.preferredSize.height ?? 0));

  @override
  Widget build(BuildContext context) {
    final canPop = showBack ?? Navigator.canPop(context);
    final titleContent = titleWidget ??
        Column(
          crossAxisAlignment:
              centerTitle ? CrossAxisAlignment.center : CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.appBarTitle,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 2),
              Text(
                subtitle!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTextStyles.appBarSubtitle,
              ),
            ],
          ],
        );

    return Container(
      decoration: BoxDecoration(
        color: backgroundColor,
        boxShadow: const [
          BoxShadow(color: AppColors.shadow, blurRadius: 14, offset: Offset(0, 4)),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            SizedBox(
              height: _barHeight,
              child: Row(
                children: [
                  if (canPop)
                    Padding(
                      padding: const EdgeInsets.only(left: 12),
                      child: leading ??
                          HeaderActionButton(
                            icon: Icons.arrow_back_ios_new_rounded,
                            iconSize: 16,
                            onPressed: onBack ?? () => Get.back(),
                          ),
                    )
                  else
                    const SizedBox(width: 16),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(left: canPop ? 12 : 0),
                      child: Align(
                        alignment:
                            centerTitle ? Alignment.center : Alignment.centerLeft,
                        child: titleContent,
                      ),
                    ),
                  ),
                  if (actions != null) ...[
                    ...actions!.map(
                      (action) => Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: action,
                      ),
                    ),
                    const SizedBox(width: 12),
                  ] else
                    const SizedBox(width: 16),
                ],
              ),
            ),
            ?bottom,
          ],
        ),
      ),
    );
  }
}

/// Small rounded icon button used for header leading/trailing actions.
///
/// Reuse this instead of hand-rolled `IconButton.styleFrom(...)` calls so
/// every screen's back button and header actions look identical.
class HeaderActionButton extends StatelessWidget {
  const HeaderActionButton({
    super.key,
    required this.icon,
    required this.onPressed,
    this.iconSize = 18,
    this.showDot = false,
    this.tooltip,
  });

  final IconData icon;
  final VoidCallback onPressed;
  final double iconSize;
  final bool showDot;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          onPressed: onPressed,
          tooltip: tooltip,
          style: IconButton.styleFrom(
            backgroundColor: AppColors.surfaceMuted,
            foregroundColor: AppColors.textPrimary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.sm)),
            minimumSize: const Size(40, 40),
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          icon: Icon(icon, size: iconSize),
        ),
        if (showDot)
          Positioned(
            top: 6,
            right: 6,
            child: Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: AppColors.accent,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.surfaceMuted, width: 1.5),
              ),
            ),
          ),
      ],
    );
  }
}

/// A pill-shaped filter/tab strip meant to live in [AppHeaderBar.bottom],
/// giving every screen with quick filters (orders, vouchers, reviews...)
/// the exact same look and spacing.
class HeaderFilterBar extends StatelessWidget implements PreferredSizeWidget {
  const HeaderFilterBar({super.key, required this.children});

  final List<Widget> children;

  @override
  Size get preferredSize => const Size.fromHeight(52);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: preferredSize.height,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Row(
          children: [
            for (var i = 0; i < children.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              children[i],
            ],
          ],
        ),
      ),
    );
  }
}
