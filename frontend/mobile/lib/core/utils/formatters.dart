import 'package:intl/intl.dart';

class Formatters {
  Formatters._();

  static final _currency = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

  static String currency(num value) => _currency.format(value);

  static String date(DateTime value) =>
      DateFormat('dd/MM/yyyy').format(value);

  static String dateTime(DateTime value) =>
      DateFormat('dd/MM/yyyy HH:mm').format(value);
}
