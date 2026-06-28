import { ImageIcon, CloudUpload, Plus, Star, X } from "lucide-react";

/**
 * Props:
 *   images        : { file, preview }[]
 *   thumbnailIdx  : number
 *   saving        : boolean
 *   accentColor   : string
 *   onUpload      : (e: ChangeEvent) => void
 *   onRemove      : (idx: number) => void
 *   onSetThumbnail: (idx: number) => void
 */
export default function ImageUploadPanel({
  images,
  thumbnailIdx,
  saving,
  accentColor,
  onUpload,
  onRemove,
  onSetThumbnail,
}) {
  return (
    <div className="border border-zinc-200 rounded-xl p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <ImageIcon className={`w-4 h-4 ${accentColor} flex-shrink-0`} />
          <span className="text-sm font-semibold text-zinc-800">Hình ảnh</span>
        </div>
        <span className="text-xs text-zinc-400">{images.length}/5 ảnh</span>
      </div>

      {/* Drop zone */}
      <label
        className={`border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors block mb-3 group ${
          saving || images.length >= 5 ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={onUpload}
          disabled={saving || images.length >= 5}
        />
        <CloudUpload className="w-6 h-6 text-zinc-400 group-hover:text-green-600 mx-auto mb-1.5 transition-colors" />
        <div className="text-xs font-medium text-zinc-600 group-hover:text-green-700 transition-colors">
          Kéo thả hoặc Click để tải lên
        </div>
        <div className="text-xs text-zinc-400 mt-0.5">PNG, JPG — tối đa 2MB/ảnh</div>
      </label>

      {/* Grid preview */}
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative group">
            <div
              className={`aspect-square rounded-lg overflow-hidden bg-zinc-100 border-2 transition-colors cursor-pointer ${
                thumbnailIdx === i ? "border-green-500" : "border-transparent"
              }`}
              onClick={() => onSetThumbnail(i)}
            >
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
            </div>

            {/* Thumbnail badge */}
            {thumbnailIdx === i && (
              <div className="absolute top-1 left-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={() => onRemove(i)}
              disabled={saving}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {/* Add more slot */}
        {images.length < 5 && (
          <label
            className={`aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors ${
              saving ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={saving} />
            <Plus className="w-5 h-5 text-zinc-400" />
          </label>
        )}
      </div>

      {images.length > 0 && (
        <p className="text-xs text-zinc-400 mt-2 text-center">
          Click ảnh để đặt làm{" "}
          <span className={`${accentColor} font-medium`}>ảnh đại diện</span>
        </p>
      )}
    </div>
  );
}
