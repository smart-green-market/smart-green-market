import { useState, useEffect } from 'react';
import { Save, X, HardDrive, Shield, Loader2 } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal'; 

export default function SettingsAside() {
  // 1. Dữ liệu ảo giả lập lấy từ API lúc ban đầu
  const initialData = {
    maxImageSize: '5',
    maxProductImages: '10',
    maxCategories: '5',
    maxProducts: '100',
    allowedFileTypes: 'jpg,png,svg,webp',
    maxFailedLogins: '5'
  };

  // 2. Quản lý State dữ liệu & UI
  const [formData, setFormData] = useState(initialData);
  const [savedData, setSavedData] = useState(initialData); // Lưu bản sao gốc để kiểm tra thay đổi
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State quản lý việc đóng/mở và nội dung của ConfirmModal chung
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    variant: 'warning',
    onConfirm: () => {},
  });

  // 3. Kiểm tra xem form có sự thay đổi so với dữ liệu gốc không (Dirty Check)
  useEffect(() => {
    const hasChanged = Object.keys(formData).some(
      (key) => formData[key] !== savedData[key]
    );
    setIsDirty(hasChanged);
  }, [formData, savedData]);

  // 4. Xử lý khi user nhập liệu vào các ô input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 5. Hàm thực thi khi user nhấn xác nhận LƯU trên Modal
  const handleConfirmSave = async () => {
    setIsLoading(true);
    // Giả lập hiệu ứng gọi API mất 1.2 giây
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    setSavedData(formData); // Cập nhật dữ liệu gốc bằng dữ liệu mới
    setIsDirty(false);
    setIsLoading(false);
  };

  // 6. Hàm thực thi khi user nhấn xác nhận HỦY trên Modal
  const handleConfirmCancel = () => {
    setFormData(savedData); // Reset toàn bộ form về dữ liệu đã lưu gần nhất
  };

  // 7. Kích hoạt mở Modal Hủy bỏ
  const openCancelModal = () => {
    setModalConfig({
      isOpen: true,
      title: 'Hủy các thay đổi?',
      message: 'Các thiết lập bạn vừa chỉnh sửa sẽ bị xóa và khôi phục lại trạng thái ban đầu. Bạn có chắc chắn muốn hủy?',
      confirmText: 'Hủy',
      cancelText: 'Quay lại',
      variant: 'danger', // Dùng màu đỏ cảnh báo mất dữ liệu
      onConfirm: handleConfirmCancel,
    });
  };

  // 8. Kích hoạt mở Modal Lưu thay đổi
  const openSaveModal = () => {
    setModalConfig({
      isOpen: true,
      title: 'Xác nhận cập nhật cấu hình?',
      message: 'Mọi thay đổi cấu hình hệ thống này sẽ có hiệu lực ngay lập tức.',
      confirmText: 'Lưu cấu hình',
      cancelText: 'Quay lại',
      variant: 'info', // Dùng màu xanh dương cho hành động cập nhật thông tin
      onConfirm: handleConfirmSave,
    });
  };

  // Hàm đóng modal chung
  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <aside className="w-full max-w-full p-4 md:p-8 font-sans antialiased text-zinc-900 bg-neutral-50 min-h-screen">
      <div className="w-full px-6 py-8 md:px-8 md:pt-10 md:pb-16 bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col justify-start items-start gap-8">
        
        {/* KHỐI 1: LƯU TRỮ & HÌNH ẢNH */}
        <div className="self-stretch flex flex-col justify-start items-start gap-6">
          <div className="self-stretch pb-4 border-b border-neutral-200 inline-flex justify-start items-center gap-3">
            <HardDrive className="w-5 h-5 text-emerald-950" />
            <h2 className="text-zinc-900 text-xl font-semibold font-serif leading-7">Lưu trữ &amp; Hình ảnh</h2>
          </div>

          <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Giới hạn dung lượng */}
            <div className="flex flex-col gap-1.5">
              <label className="text-neutral-700 text-xs font-bold uppercase tracking-wide">
                Giới hạn dung lượng ảnh (MB)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  name="maxImageSize"
                  value={formData.maxImageSize}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white text-base font-mono rounded-lg border border-neutral-200 outline-none focus:border-emerald-700 transition-all pr-12"
                />
                <span className="absolute right-4 text-neutral-500 text-base font-medium pointer-events-none">MB</span>
              </div>
              <p className="text-neutral-500 text-xs">Kích thước tệp tối đa cho phép upload.</p>
            </div>

            {/* Số lượng ảnh tối đa */}
            <div className="flex flex-col gap-1.5">
              <label className="text-neutral-700 text-xs font-bold uppercase tracking-wide">
                Số lượng ảnh tối đa của sản phẩm
              </label>
              <input
                type="number"
                name="maxProductImages"
                value={formData.maxProductImages}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white text-base font-mono rounded-lg border border-neutral-200 outline-none focus:border-emerald-700 transition-all"
              />
              <p className="text-neutral-500 text-xs">Số lượng ảnh tối đa cho một sản phẩm.</p>
            </div>

            {/* Giới hạn danh mục */}
            <div className="flex flex-col gap-1.5">
              <label className="text-neutral-700 text-xs font-bold uppercase tracking-wide">
                Giới hạn đăng ký danh mục
              </label>
              <input
                type="number"
                name="maxCategories"
                value={formData.maxCategories}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white text-base font-mono rounded-lg border border-neutral-200 outline-none focus:border-emerald-700 transition-all"
              />
              <p className="text-neutral-500 text-xs">Số lượng danh mục tối đa được phép đăng ký.</p>
            </div>

            {/* Giới hạn sản phẩm */}
            <div className="flex flex-col gap-1.5">
              <label className="text-neutral-700 text-xs font-bold uppercase tracking-wide">
                Giới hạn đăng ký sản phẩm
              </label>
              <input
                type="number"
                name="maxProducts"
                value={formData.maxProducts}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white text-base font-mono rounded-lg border border-neutral-200 outline-none focus:border-emerald-700 transition-all"
              />
              <p className="text-neutral-500 text-xs">Số lượng sản phẩm tối đa được phép đăng ký.</p>
            </div>
          </div>

          {/* Loại file được phép */}
          <div className="self-stretch flex flex-col gap-1.5">
            <label className="text-neutral-700 text-xs font-bold uppercase tracking-wide">
              Các loại file ảnh được phép upload
            </label>
            <textarea
              name="allowedFileTypes"
              rows={2}
              value={formData.allowedFileTypes}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white text-base font-mono rounded-lg border border-neutral-200 outline-none focus:border-emerald-700 transition-all resize-none"
            />
          </div>
        </div>

        {/* KHỐI 2: BẢO MẬT */}
        <div className="self-stretch flex flex-col justify-start items-start gap-6">
          <div className="self-stretch pb-4 border-b border-neutral-200 inline-flex justify-start items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-950" />
            <h2 className="text-zinc-900 text-xl font-semibold font-serif leading-7">Bảo mật</h2>
          </div>

          {/* md:w-1/2 */}
          <div className="w-full flex flex-col gap-1.5">  
            <label className="text-neutral-700 text-xs font-bold uppercase tracking-wide">
              Giới hạn số lần đăng nhập thất bại
            </label>
            <input
              type="number"
              name="maxFailedLogins"
              value={formData.maxFailedLogins}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white text-base font-mono rounded-lg border border-neutral-200 outline-none focus:border-emerald-700 transition-all"
            />
            <p className="text-neutral-500 text-xs">Khóa tài khoản tạm thời sau số lần thử không đúng.</p>
          </div>
        </div>

        {/* KHỐI 3: THANH ĐIỀU KHIỂN NÚT (Ẩn/Hiện linh hoạt) */}
        <div className="self-stretch pt-6 border-t border-neutral-100 flex justify-end items-center h-16">
          {isDirty && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                type="button"
                onClick={openCancelModal}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={openSaveModal}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-lg bg-emerald-900 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-emerald-950 transition-colors shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu thay đổi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TÁI SỬ DỤNG CONFIRM MODAL CỦA BẠN */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        variant={modalConfig.variant}
      />
    </aside>
  );
}