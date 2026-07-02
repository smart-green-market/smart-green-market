#!/usr/bin/env python
"""Điểm vào quản lý Django cho dự án Smart Green Market."""

import os  # os.environ để đọc biến môi trường
import sys  # sys.argv để lấy các tham số command line ví dụ:python manage.py runserver

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Tắt thông báo nhắc nhở oneDNN đúng theo yêu cầu của TF
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'   # Ẩn hoàn toàn các log Info và Warning của TensorFlow (Chỉ hiện lỗi Error)

def main():
    """Khởi chạy lệnh quản trị Django từ dòng lệnh."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
