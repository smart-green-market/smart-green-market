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
   - Key Value `smart-green-market-redis` (free — channel layer WebSocket)
   - Web Service `smart-green-market-api` (free, **Daphne ASGI**)

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
| **Start Command** | `daphne -b 0.0.0.0 -p $PORT config.asgi:application` |
| **Plan** | Free |

4. **Environment Variables:**

| Key | Value |
|-----|--------|
| `PYTHON_VERSION` | `3.13.7` |
| `SECRET_KEY` | (Generate hoặc chuỗi random dài) |
| `DEBUG` | `False` |
| `DATABASE_URL` | Paste Internal Database URL từ PostgreSQL |
| `REDIS_URL` | (Blueprint tự gán từ Key Value) hoặc Upstash `rediss://...` |

5. **Create Web Service**

---

## Chạy local (sau khi đổi settings)

```bash
cd backend
cp .env.example .env
# Sửa .env: DB_PASSWORD, SECRET_KEY...

pip install -r requirements.txt
python manage.py migrate
# Cần Redis local cho WebSocket push (hoặc bỏ REDIS_URL → InMemory, single process)
daphne -b 127.0.0.1 -p 8000 config.asgi:application
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
| `REDIS_URL` | ✅ (Blueprint) | Channel layer — WebSocket push notification |
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

## WebSocket (notification realtime)

Server chạy **Daphne ASGI** — hỗ trợ HTTP REST và WebSocket trên cùng port.

| | URL |
|---|-----|
| **Endpoint** | `wss://<tên-app>.onrender.com/ws/notifications/?token=<JWT_access_token>` |
| **Auth** | JWT access token qua query `token` (giống login API) |
| **Event** | `{"event":"notification.new", ...}` khi có thông báo mới |

**Kiểm tra nhanh** (sau khi có token):

```bash
npx wscat -c "wss://smart-green-market-api.onrender.com/ws/notifications/?token=YOUR_ACCESS_TOKEN"
```

**Lưu ý free tier:** service sleep → WebSocket **ngắt**, client cần **reconnect**. FE chưa tích hợp WS — noti vẫn qua `GET /api/notifications/my/`.

**Deploy service cũ (đã tạo trước Blueprint):** vào Dashboard → Web Service → Settings → đổi **Start Command** sang Daphne, thêm env `REDIS_URL` (tạo Key Value hoặc Upstash).

---

## Xử lý lỗi thường gặp

### Build fail — `psycopg2` / migrate

- Kiểm tra `DATABASE_URL` đã gán cho Web Service
- Xem log build: lỗi migration → chạy `python manage.py migrate` trong Shell

### 400 Bad Request / DisallowedHost

- Đảm bảo `RENDER_EXTERNAL_HOSTNAME` có (Render tự set)
- Hoặc thêm domain vào `ALLOWED_HOSTS` trên Render

### 502 sau deploy

- Xem **Logs** → lỗi Daphne / Redis
- Start command phải bind `$PORT`:  
  `daphne -b 0.0.0.0 -p $PORT config.asgi:application`
- Kiểm tra `REDIS_URL` đã gán (Key Value hoặc Upstash)

### WebSocket không connect

- Dùng **`wss://`** (không `ws://`) trên production
- Token hết hạn → 4401 close
- Service đang sleep → đợi wake (~30–60s) rồi thử lại

### Logout JWT lỗi blacklist

- Đã bật `rest_framework_simplejwt.token_blacklist` — `migrate` chạy trong `build.sh`

---

## Cấu trúc file deploy

```
smart-green-market/
├── render.yaml          # Blueprint: DB + Key Value + Web (Daphne)
└── backend/
    ├── build.sh         # install + collectstatic + migrate
    ├── requirements.txt # channels, daphne, channels-redis
    ├── .env.example     # mẫu env local
    └── config/
        ├── asgi.py      # HTTP + WebSocket routing
        └── settings.py  # DATABASE_URL, REDIS_URL, CHANNEL_LAYERS
```
