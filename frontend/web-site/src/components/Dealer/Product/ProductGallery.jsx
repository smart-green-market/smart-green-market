import { useState, useRef } from "react";
import { Image as ImageIcon, Upload, Star, Trash2 } from "lucide-react";
import { dealerProductService } from "../../../services/api/dealerProductService";
import { toast } from "sonner";

export default function ProductGallery({ product, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const images = product.images || [];

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image_url", file);
      await dealerProductService.uploadImage(product.id, formData);
      toast.success("Tải ảnh lên thành công!");
      onUpdate(); // Gọi hàm tải lại data từ component cha
    } catch (error) {
      toast.error("Lỗi khi tải ảnh lên.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetThumbnail = async (imageId) => {
    try {
      const oldThumbnails = images.filter((img) => img.is_thumbnail && img.id !== imageId);
      
      for (const old of oldThumbnails) {
        await dealerProductService.unsetThumbnail(old.id);
      }

      await dealerProductService.setThumbnail(imageId);
      toast.success("Đã đổi ảnh chính!");
      onUpdate();
    } catch (error) {
      toast.error("Lỗi khi đặt ảnh chính.");
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;
    try {
      await dealerProductService.deleteImage(imageId);
      toast.success("Đã xóa ảnh!");
      onUpdate();
    } catch (error) {
      toast.error("Lỗi khi xóa ảnh.");
    }
  };

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-xs h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-emerald-600" /> Thư viện ảnh
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Đang tải..." : "Thêm ảnh"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
          <ImageIcon className="w-10 h-10 text-neutral-300 mb-2" />
          <p className="text-sm font-medium text-neutral-500">Chưa có ảnh sản phẩm</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 group ${
                img.is_thumbnail ? "border-emerald-500 shadow-md" : "border-transparent bg-neutral-100"
              }`}
            >
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="p-1.5 bg-white/20 hover:bg-red-500/80 text-white rounded-md backdrop-blur-sm transition-colors cursor-pointer"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {!img.is_thumbnail && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleSetThumbnail(img.id)}
                      className="px-2 py-1 bg-white/20 hover:bg-emerald-500/80 text-white text-[10px] font-bold rounded backdrop-blur-sm transition-colors cursor-pointer w-full text-center"
                    >
                      Đặt làm ảnh chính
                    </button>
                  </div>
                )}
              </div>

              {/* Badge Thumbnail */}
              {img.is_thumbnail && (
                <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-0.5 rounded shadow-sm text-[9px] font-bold flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current" /> Ảnh chính
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-neutral-400 mt-4 text-center">
        Gợi ý: Upload ảnh tỉ lệ 1:1, nền trắng để hiển thị đẹp nhất.
      </p>
    </div>
  );
}
