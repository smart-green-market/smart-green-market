import { useState, useEffect, useRef } from "react";
import {
  X, ImageIcon, CloudUpload, Loader2, Star, Trash2, RefreshCw, Plus,
} from "lucide-react";
import { productService } from "../../../services/api/productService";
import {
  parseSupplierApiErrors,
  extractSupplierApiMessage,
  errorsToSummary,
} from "../../../utils/supplierValidation";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;
const ACCEPT_TYPES = "image/png,image/jpeg,image/jpg,image/webp";

function buildSlotsFromProduct(images = []) {
  return images.map((img, index) => ({
    key: `existing-${img.id}`,
    id: img.id,
    preview: img.image_url,
    file: null,
    is_thumbnail: !!img.is_thumbnail,
    sort_order: img.sort_order ?? index,
    markedDelete: false,
  }));
}

function appendProductImageFile(formData, file) {
  formData.append("images", file, file.name);
}

function buildNewImageFormData(productId, file, { isThumbnail = false, sortOrder = 0 } = {}) {
  const fd = new FormData();
  fd.append("supplier_product", productId);
  appendProductImageFile(fd, file);
  fd.append("is_thumbnail", isThumbnail ? "true" : "false");
  fd.append("sort_order", String(sortOrder));
  return fd;
}

function validateImageSlots(slots) {
  const active = slots.filter((s) => !s.markedDelete);
  const errs = {};

  if (active.length === 0) {
    errs.images = "Hình ảnh: Sản phẩm phải có ít nhất 1 ảnh.";
  } else if (active.length > MAX_IMAGES) {
    errs.images = `Hình ảnh: Tối đa ${MAX_IMAGES} ảnh cho mỗi sản phẩm.`;
  } else if (!active.some((s) => s.is_thumbnail)) {
    errs.images = "Hình ảnh: Vui lòng chọn 1 ảnh đại diện.";
  }

  for (const slot of active) {
    if (slot.file && slot.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      errs.images = `Hình ảnh: Mỗi ảnh không được vượt quá ${MAX_FILE_SIZE_MB}MB.`;
      break;
    }
  }

  return errs;
}

export default function UpdateProductImagesModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}) {
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const replaceInputRef = useRef(null);
  const [replaceTargetKey, setReplaceTargetKey] = useState(null);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useEffect(() => {
    if (!isOpen || !product) return;
    setSlots(buildSlotsFromProduct(product.images));
    setError("");
    setFieldErrors({});
  }, [isOpen, product]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, saving]);

  useEffect(() => {
    return () => {
      slotsRef.current.forEach((slot) => {
        if (slot.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(slot.preview);
        }
      });
    };
  }, []);

  if (!isOpen || !product) return null;

  const activeSlots = slots.filter((s) => !s.markedDelete);
  const activeCount = activeSlots.length;

  const setThumbnail = (key) => {
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        is_thumbnail: !s.markedDelete && s.key === key,
      }))
    );
  };

  const markDelete = (key) => {
    setSlots((prev) => {
      const next = prev.map((s) =>
        s.key === key ? { ...s, markedDelete: true, is_thumbnail: false } : s
      );
      const remaining = next.filter((s) => !s.markedDelete);
      if (remaining.length && !remaining.some((s) => s.is_thumbnail)) {
        remaining[0].is_thumbnail = true;
        return next.map((s) =>
          s.key === remaining[0].key ? { ...s, is_thumbnail: true } : s
        );
      }
      return next;
    });
  };

  const undoDelete = (key) => {
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, markedDelete: false } : s))
    );
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSlots((prev) => {
      const currentActive = prev.filter((s) => !s.markedDelete).length;
      const room = MAX_IMAGES - currentActive;
      const toAdd = files.slice(0, room).map((file, i) => ({
        key: `new-${Date.now()}-${i}`,
        id: null,
        preview: URL.createObjectURL(file),
        file,
        is_thumbnail: false,
        sort_order: currentActive + i,
        markedDelete: false,
      }));

      const next = [...prev, ...toAdd];
      if (!next.some((s) => !s.markedDelete && s.is_thumbnail) && toAdd.length) {
        const firstNewKey = toAdd[0].key;
        return next.map((s) =>
          s.key === firstNewKey ? { ...s, is_thumbnail: true } : s
        );
      }
      return next;
    });

    e.target.value = "";
    setError("");
    setFieldErrors({});
  };

  const openReplacePicker = (key) => {
    setReplaceTargetKey(key);
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTargetKey) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Hình ảnh: Tệp không được vượt quá ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }

    setSlots((prev) =>
      prev.map((s) => {
        if (s.key !== replaceTargetKey) return s;
        if (s.preview?.startsWith("blob:")) URL.revokeObjectURL(s.preview);
        return {
          ...s,
          file,
          preview: URL.createObjectURL(file),
        };
      })
    );

    setReplaceTargetKey(null);
    e.target.value = "";
    setError("");
  };

  const handleSave = async () => {
    setError("");
    setFieldErrors({});

    const errs = validateImageSlots(slots);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setError(errorsToSummary(errs));
      return;
    }

    setSaving(true);
    try {
      const toDelete = slots.filter((s) => s.markedDelete && s.id);
      const toReplace = slots.filter((s) => s.id && !s.markedDelete && s.file);
      const toCreate = slots.filter((s) => !s.id && !s.markedDelete && s.file);
      const thumbKey = slots.find((s) => !s.markedDelete && s.is_thumbnail)?.key;

      const createdMap = new Map();
      const existingCount = slots.filter((s) => s.id && !s.markedDelete).length;

      // 1. Thêm ảnh mới trước (tránh backend báo lỗi khi sản phẩm không còn ảnh)
      for (const [index, slot] of toCreate.entries()) {
        const fd = buildNewImageFormData(product.id, slot.file, {
          isThumbnail: false,
          sortOrder: existingCount + index,
        });
        const created = await productService.addImageProduct(fd);
        createdMap.set(slot.key, created?.id ?? created?.data?.id);
      }

      // 2. Thay file ảnh hiện có
      for (const slot of toReplace) {
        const fd = new FormData();
        appendProductImageFile(fd, slot.file);
        await productService.updateImageProduct(slot.id, fd);
      }

      let fresh = await productService.getById(product.id);
      let allImages = fresh.images ?? [];

      // 3. Cập nhật ảnh đại diện
      let thumbnailId = null;
      const thumbSlot = slots.find((s) => s.key === thumbKey && !s.markedDelete);
      if (thumbSlot?.id) {
        thumbnailId = thumbSlot.id;
      } else if (thumbSlot) {
        thumbnailId = createdMap.get(thumbSlot.key) ?? null;
      }

      if (thumbnailId) {
        await Promise.all(
          allImages.map(async (img) => {
            const shouldThumb = img.id === thumbnailId;
            if (!!img.is_thumbnail === shouldThumb) return;
            const fd = new FormData();
            fd.append("is_thumbnail", shouldThumb ? "true" : "false");
            await productService.updateImageProduct(img.id, fd);
          })
        );
        fresh = await productService.getById(product.id);
        allImages = fresh.images ?? [];
      }

      // 4. Xóa ảnh cuối cùng
      for (const slot of toDelete) {
        await productService.deleteImageProduct(slot.id);
      }

      if (toDelete.length) {
        fresh = await productService.getById(product.id);
        allImages = fresh.images ?? [];
      }

      const updatedProduct = {
        ...product,
        ...fresh,
        images: allImages,
      };

      onSuccess?.(updatedProduct);
      onClose();
    } catch (err) {
      console.error("Lỗi cập nhật ảnh sản phẩm:", err);
      const parsed = parseSupplierApiErrors(err?.response?.data, {
        fallback: "Cập nhật ảnh thất bại. Vui lòng kiểm tra lại và thử lại.",
      });
      if (Object.keys(parsed.fieldErrors).length) setFieldErrors(parsed.fieldErrors);
      setError(parsed.general || parsed.summary || extractSupplierApiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deletedSlots = slots.filter((s) => s.markedDelete);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => !saving && onClose()}
      />

      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-green-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Cập nhật hình ảnh sản phẩm</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-600">
              Quản lý ảnh hiện có, thay ảnh, thêm mới hoặc đặt ảnh đại diện.
            </p>
            <span className="text-xs font-semibold text-zinc-400">
              {activeCount}/{MAX_IMAGES} ảnh
            </span>
          </div>

          <label
            className={`border-2 border-dashed border-zinc-200 rounded-xl p-5 text-center cursor-pointer block
              hover:border-green-400 hover:bg-green-50 transition-colors group
              ${saving || activeCount >= MAX_IMAGES ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              type="file"
              accept={ACCEPT_TYPES}
              multiple
              className="hidden"
              onChange={handleAddImages}
              disabled={saving || activeCount >= MAX_IMAGES}
            />
            <CloudUpload className="w-7 h-7 text-zinc-400 group-hover:text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-700">Thêm ảnh mới</p>
            <p className="text-xs text-zinc-400 mt-1">PNG, JPG, WEBP — tối đa {MAX_FILE_SIZE_MB}MB/ảnh</p>
          </label>

          <input
            ref={replaceInputRef}
            type="file"
            accept={ACCEPT_TYPES}
            className="hidden"
            onChange={handleReplaceFile}
          />

          {fieldErrors.images && (
            <p className="text-xs text-red-500">{fieldErrors.images}</p>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {activeSlots.map((slot) => (
              <div key={slot.key} className="relative group">
                <button
                  type="button"
                  onClick={() => setThumbnail(slot.key)}
                  className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    slot.is_thumbnail ? "border-green-600 ring-2 ring-green-200" : "border-transparent"
                  }`}
                  title="Đặt làm ảnh đại diện"
                >
                  <img src={slot.preview} alt="" className="w-full h-full object-cover" />
                </button>

                {slot.is_thumbnail && (
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center pointer-events-none">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                )}

                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openReplacePicker(slot.key)}
                    disabled={saving}
                    title="Thay ảnh"
                    className="w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => markDelete(slot.key)}
                    disabled={saving || activeCount <= 1}
                    title="Xóa ảnh"
                    className="w-6 h-6 bg-red-600/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {slot.file && (
                  <span className="absolute bottom-1 left-1 right-1 text-[10px] text-center bg-amber-500/90 text-white rounded px-1 py-0.5 truncate">
                    {slot.id ? "Ảnh mới (chưa lưu)" : "Sẽ tải lên"}
                  </span>
                )}
              </div>
            ))}

            {activeCount < MAX_IMAGES && (
              <label
                className={`aspect-square rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1
                  cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors
                  ${saving ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  type="file"
                  accept={ACCEPT_TYPES}
                  className="hidden"
                  onChange={handleAddImages}
                  disabled={saving}
                />
                <Plus className="w-5 h-5 text-zinc-400" />
                <span className="text-[10px] text-zinc-400">Thêm</span>
              </label>
            )}
          </div>

          {deletedSlots.length > 0 && (
            <div className="rounded-xl border border-zinc-200 p-3 bg-zinc-50">
              <p className="text-xs font-semibold text-zinc-500 mb-2">Ảnh đã đánh dấu xóa</p>
              <div className="flex flex-wrap gap-2">
                {deletedSlots.map((slot) => (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => undoDelete(slot.key)}
                    disabled={saving}
                    className="flex items-center gap-2 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-600 hover:border-green-400"
                  >
                    <img src={slot.preview} alt="" className="w-8 h-8 rounded object-cover opacity-60" />
                    Hoàn tác
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-zinc-400">
            Nhấn vào ảnh để đặt <span className="text-green-700 font-medium">ảnh đại diện</span>.
            Hover để thay hoặc xóa ảnh. Nhấn <strong>Lưu thay đổi</strong> để đồng bộ lên hệ thống.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 bg-stone-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg disabled:opacity-60 min-w-[140px] justify-center"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
