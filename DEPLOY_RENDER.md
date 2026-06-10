# Deploy Smart Green Market API lên Render (Free)

Hướng dẫn deploy backend Django lên [Render](https://render.com) — free tier.

---

## Yêu cầu trước khi deploy

- Tài khoản [Render](https://render.com) (đăng nhập bằng GitHub)
- Code đã push lên **GitHub** (Render kết nối repo)
- Python **3.13.7** (đã cấu hình trong `render.yaml` và `backend/.python-version`)

---

## Cách 1 — Blueprint (khuyến nghị, tự tạo DB + Web)

### Bước 1: Push code lên GitHub

```bash
git add .
git commit -m "chore: configure Render deployment"
git push origin main
```

### Bước 2: Tạo Blueprint trên Render

1. Vào [dashboard.render.com](https://dashboard.render.com)
2. **New +** → **Blueprint**
3. Kết nối repo `smart-green-market`
4. Render đọc file `render.yaml` ở root repo
5. Bấm **Apply** — tự tạo:
   - PostgreSQL `smart-green-market-db` (free)
   - Web Service `smart-green-market-api` (free)

### Bước 3: Chờ deploy xong

- Tab **Logs** → xem `build.sh` chạy `migrate` + `collectstatic`
- Khi status **Live**, copy URL dạng:  
  `https://smart-green-market-api.onrender.com`

### Bước 4: Kiểm tra API

| URL | Mô tả |
|-----|--------|
| `https://<tên-app>.onrender.com/api/docs/` | Swagger UI |
| `https://<tên-app>.onrender.com/api/redoc/` | ReDoc |
| `https://<tên-app>.onrender.com/admin/` | Django Admin |

---

## Cách 2 — Tạo tay (không dùng Blueprint)

### A. Tạo PostgreSQL

1. **New +** → **PostgreSQL**
2. Name: `smart-green-market-db`
3. Plan: **Free**
4. Create → copy **Internal Database URL**

### B. Tạo Web Service

1. **New +** → **Web Service**
2. Connect repo GitHub
3. Cấu hình:

| Field | Giá trị |
|-------|---------|
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `chmod +x build.sh && ./build.sh` |
| **Start Command** | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT` |
| **Plan** | Free |

4. **Environment Variables:**

| Key | Value |
|-----|--------|
| `PYTHON_VERSION` | `3.13.7` |
| `SECRET_KEY` | (Generate hoặc chuỗi random dài) |
| `DEBUG` | `False` |
| `DATABASE_URL` | Paste Internal Database URL từ PostgreSQL |

5. **Create Web Service**

---

## Chạy local (sau khi đổi settings)

```bash
cd backend
cp .env.example .env
# Sửa .env: DB_PASSWORD, SECRET_KEY...

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

## Tạo tài khoản Admin trên Render

Vào **Shell** của Web Service trên Render (tab Shell):

```bash
python manage.py createsuperuser
```

Hoặc chạy local với `DATABASE_URL` trỏ tới DB Render (External URL).

---

## Lưu ý free tier Render

| Hạn chế | Chi tiết |
|---------|----------|
| **Sleep** | Web service tắt sau ~15 phút không có request → request đầu mất **30–60 giây** để wake |
| **PostgreSQL free** | Hết hạn sau **90 ngày** (cần upgrade hoặc export data) |
| **Upload file (media/)** | Lưu trên disk tạm — **mất khi redeploy/restart**. Demo OK; production nên dùng **Cloudinary / AWS S3** |
| **Bandwidth** | Giới hạn theo plan free |

---

## Biến môi trường (tham khảo)

| Biến | Bắt buộc Render | Mô tả |
|------|-----------------|--------|
| `DATABASE_URL` | ✅ (auto từ Blueprint) | Connection string PostgreSQL |
| `SECRET_KEY` | ✅ | Django secret |
| `DEBUG` | ✅ = `False` | Tắt debug production |
| `RENDER_EXTERNAL_HOSTNAME` | Auto | Render tự inject |
| `ALLOWED_HOSTS` | Tùy chọn | Mặc định + hostname Render |
| `DB_*` | Chỉ local | Dùng trong `.env` khi dev |

---

## Frontend (Flutter / Web) kết nối API

Đặt base URL:

```
https://smart-green-market-api.onrender.com/api/
```

Ví dụ đăng ký: `POST .../api/register/`

---

## Xử lý lỗi thường gặp

### Build fail — `psycopg2` / migrate

- Kiểm tra `DATABASE_URL` đã gán cho Web Service
- Xem log build: lỗi migration → chạy `python manage.py migrate` trong Shell

### 400 Bad Request / DisallowedHost

- Đảm bảo `RENDER_EXTERNAL_HOSTNAME` có (Render tự set)
- Hoặc thêm domain vào `ALLOWED_HOSTS` trên Render

### 502 sau deploy

- Xem **Logs** → lỗi gunicorn
- Start command phải bind `$PORT`:  
  `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

### Logout JWT lỗi blacklist

- Đã bật `rest_framework_simplejwt.token_blacklist` — `migrate` chạy trong `build.sh`

---

## Cấu trúc file deploy

```
smart-green-market/
├── render.yaml          # Blueprint Render
└── backend/
    ├── build.sh         # install + collectstatic + migrate
    ├── requirements.txt
    ├── .env.example     # mẫu env local
    └── config/
        └── settings.py  # đọc DATABASE_URL, SECRET_KEY từ env
```
