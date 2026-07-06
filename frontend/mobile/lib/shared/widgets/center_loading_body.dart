import 'package:flutter/material.dart';
import 'package:smart_green_market/shared/widgets/loading_widget.dart';

/// Shows a centered loading indicator while [isLoading] is true.
class CenterLoadingBody extends StatelessWidget {
  const CenterLoadingBody({
    super.key,
    required this.isLoading,
    required this.child,
    this.message,
  });

  final bool isLoading;
  final Widget child;
  final String? message;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return LoadingWidget(message: message);
    }
    return child;
  }
}
