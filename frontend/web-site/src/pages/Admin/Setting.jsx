import { useState, useEffect, useCallback } from 'react';
import { HardDrive, Shield, ShoppingCart, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { settingService, handleApiError } from '../../services/api/settingService';

// ── Field hiển thị chỉ đọc ──────────────────────────────────────────────────
function ReadField({ label, value, suffix, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-neutral-700 text-xs font-bold uppercase tracking-wide">
        {label}
      </label>
      <div className="relative flex items-center">
        <div className="w-full px-4 py-3 bg-neutral-50 text-base font-mono rounded-lg border border-neutral-200 text-zinc-900">
          {value ?? '—'}
        </div>
        {suffix && (
          <span className="absolute right-4 text-neutral-500 text-base font-medium pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-neutral-500 text-xs">{hint}</p>}
    </div>
  );
}

export default function SettingsAside() {
  const [config, setConfig] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchConfig = useCallback(async () => {
    try {
      setIsFetching(true);
      setLoadError('');
      const data = await settingService.get();
      setConfig(data);
    } catch (err) {
      setLoadError(handleApiError(err, 'Không thể tải cấu hình hệ thống'));
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ── Loading lần đầu ──────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <aside className="w-full max-w-full p-4 md:p-8 font-sans antialiased text-zinc-900 bg-neutral-50 min-h-screen">
        <div className="w-full h-64 bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col items-center justify-center gap-3 text-neutral-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          <span className="text-sm font-medium">Đang tải cấu hình hệ thống...</span>
        </div>
      </aside>
    );
  }

  // ── Lỗi tải dữ liệu ──────────────────────────────────────────────────────
  if (loadError) {
    return (
      <aside className="w-full max-w-full p-4 md:p-8 font-sans antialiased text-zinc-900 bg-neutral-50 min-h-screen">
        <div className="w-full bg-white rounded-lg shadow-sm border border-neutral-200 p-8 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5" />
            {loadError}
          </div>
          <button
            type="button"
            onClick={fetchConfig}
            className="px-5 py-2.5 rounded-lg bg-emerald-900 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-emerald-950 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      </aside>
    );
  }

  const allowedTypes = Array.isArray(config?.allowed_image_types)
    ? config.allowed_image_types
    : [];

  return (
    <aside className="w-full max-w-full p-4 md:p-8 font-sans antialiased text-zinc-900 bg-neutral-50 min-h-screen">
      <div className="w-full px-6 py-8 md:px-8 md:pt-10 md:pb-16 bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col justify-start items-start gap-8">

        {/* HEADER */}
        <div className="self-stretch flex items-center justify-between gap-3">
          <div>
            <h1 className="text-zinc-900 text-2xl font-semibold leading-8 font-['Noto_Serif',serif]">
              Cấu hình hệ thống
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Giới hạn nghiệp vụ hiện tại (upload, danh mục, sản phẩm, đăng nhập).
            </p>
          </div>
          <button
            type="button"
            onClick={fetchConfig}
            title="Tải lại"
            className="px-4 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-neutral-50 transition-colors shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Tải lại
          </button>
        </div>

        {/* KHỐI 1: LƯU TRỮ & HÌNH ẢNH */}
        <div className="self-stretch flex flex-col justify-start items-start gap-6">
          <div className="self-stretch pb-4 border-b border-neutral-200 inline-flex justify-start items-center gap-3">
            <HardDrive className="w-5 h-5 text-emerald-950" />
            <h2 className="text-zinc-900 text-xl font-semibold font-serif leading-7">Lưu trữ &amp; Hình ảnh</h2>
          </div>

          <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReadField
              label="Giới hạn dung lượng ảnh (MB)"
              value={config?.max_upload_image_size_mb}
              suffix="MB"
              hint="Kích thước tệp tối đa cho phép upload."
            />
            <ReadField
              label="Số lượng ảnh tối đa của sản phẩm"
              value={config?.max_images_per_product}
              hint="Số lượng ảnh tối đa cho một sản phẩm."
            />
            <ReadField
              label="Số lượng ảnh tối đa của chứng chỉ"
              value={config?.max_images_per_certification}
              hint="Số lượng ảnh tối đa cho một chứng chỉ."
            />
            <ReadField
              label="Giới hạn đăng ký danh mục"
              value={config?.max_categories_per_supplier}
              hint="Số lượng danh mục tối đa mỗi nhà cung cấp."
            />
            <ReadField
              label="Giới hạn đăng ký sản phẩm"
              value={config?.max_products_per_supplier}
              hint="Số lượng sản phẩm tối đa mỗi nhà cung cấp."
            />
          </div>

          {/* Loại file được phép — hiển thị dạng chip */}
          <div className="self-stretch flex flex-col gap-1.5">
            <label className="text-neutral-700 text-xs font-bold uppercase tracking-wide">
              Các loại file ảnh được phép upload
            </label>
            <div className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-wrap gap-2">
              {allowedTypes.length > 0 ? (
                allowedTypes.map((type) => (
                  <span
                    key={type}
                    className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-mono font-semibold"
                  >
                    {type}
                  </span>
                ))
              ) : (
                <span className="text-neutral-400 text-sm">—</span>
              )}
            </div>
            <p className="text-neutral-500 text-xs">
              Tổng cộng {allowedTypes.length} định dạng được chấp nhận.
            </p>
          </div>
        </div>

        {/* KHỐI 2: BẢO MẬT */}
        <div className="self-stretch flex flex-col justify-start items-start gap-6">
          <div className="self-stretch pb-4 border-b border-neutral-200 inline-flex justify-start items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-950" />
            <h2 className="text-zinc-900 text-xl font-semibold font-serif leading-7">Bảo mật</h2>
          </div>

          <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReadField
              label="Giới hạn số lần đăng nhập thất bại"
              value={config?.max_login_attempts}
              suffix="lần"
              hint="Khóa tài khoản tạm thời sau số lần thử không đúng."
            />
            <ReadField
              label="Thời gian khóa tài khoản"
              value={config?.login_lockout_minutes}
              suffix="phút"
              hint="Thời gian khóa sau khi vượt số lần đăng nhập sai."
            />
          </div>
        </div>
        
      {/* KHỐI 3: ĐƠN HÀNG & THANH TOÁN */}
      <div className="self-stretch flex flex-col justify-start items-start gap-6">
          <div className="self-stretch pb-4 border-b border-neutral-200 inline-flex justify-start items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-emerald-950" />
            <h2 className="text-zinc-900 text-xl font-semibold font-serif leading-7">Đơn hàng &amp; Thanh toán</h2>
          </div>

          <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReadField
              label="Giá trị đơn hàng tối thiểu"
              value={config?.min_order_amount}
              suffix="VNĐ"
              hint="Số tiền tối thiểu để đặt một đơn hàng."
            />
            <ReadField
              label="Giá trị đơn hàng tối đa"
              value={config?.max_order_amount}
              suffix="VNĐ"
              hint="Số tiền tối đa cho phép trên một đơn hàng."
            />
            <ReadField
              label="Tỷ lệ đặt cọc tối thiểu"
              value={config?.min_deposit_percent}
              suffix="%"
              hint="Phần trăm đặt cọc thấp nhất được phép."
            />
            <ReadField
              label="Tỷ lệ đặt cọc tối đa"
              value={config?.max_deposit_percent}
              suffix="%"
              hint="Phần trăm đặt cọc cao nhất được phép."
            />
            <ReadField
              label="Tỷ lệ đặt cọc mặc định"
              value={config?.default_deposit_percent}
              suffix="%"
              hint="Tỷ lệ đặt cọc áp dụng mặc định khi tạo đơn."
            />
            <ReadField
              label="Số ngày giao hàng tối thiểu"
              value={config?.min_delivery_lead_days}
              suffix="ngày"
              hint="Thời gian chờ giao hàng tối thiểu kể từ khi đặt đơn."
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
