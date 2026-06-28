import { Tag } from "lucide-react";
import Section from "./Section";
import { labelCls, UNIT_OPTIONS, blockInvalidNumberKeys, blockDecimalKeys } from "../constants";

const Req = () => <span className="text-red-500 ml-0.5">*</span>;

/**
 * Props:
 *   isPersonal      : boolean
 *   form            : object
 *   set             : (key, value) => void
 *   setPositiveNumber  : (key, rawVal) => void
 *   setPositiveInteger : (key, rawVal) => void
 *   fieldErrors     : object
 *   saving          : boolean
 *   accentColor     : string
 *   inputClsMode    : string
 *   selectClsMode   : string
 */
export default function ProductionSection({
  isPersonal,
  form,
  set,
  setPositiveNumber,
  setPositiveInteger,
  fieldErrors,
  saving,
  accentColor,
  inputClsMode,
  selectClsMode,
}) {
  const errCls = (field) =>
    fieldErrors[field] ? "!border-red-400 !bg-red-50 focus:!ring-red-300" : "";

  const ErrMsg = ({ field }) =>
    fieldErrors[field]
      ? <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p>
      : null;

  return (
    <Section icon={<Tag className={`w-4 h-4 ${accentColor}`} />} title="Phân loại & Năng suất">
      <div className="grid grid-cols-2 gap-3">

        {/* Đơn vị tính — chỉ hiện ở catalog mode (personal mode đặt trong BasicInfoSection) */}
        {!isPersonal && (
          <div className="col-span-2">
            <label className={labelCls}>Đơn vị tính</label>
            <select
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              className={selectClsMode}
              disabled={saving}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Giá sỉ */}
        <div>
          <label className={labelCls}>Giá sỉ <Req /></label>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="1"
              placeholder="VD: 15000"
              value={form.wholesale_price}
              onKeyDown={blockDecimalKeys}
              onChange={(e) => setPositiveInteger("wholesale_price", e.target.value)}
              className={`${inputClsMode} pr-8 ${errCls("wholesale_price")}`}
              disabled={saving}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">đ</span>
          </div>
          <ErrMsg field="wholesale_price" />
        </div>

        {/* Năng suất */}
        <div>
          <label className={labelCls}>Năng suất <Req /></label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="VD: 500"
              value={form.daily_production_capacity}
              onKeyDown={blockInvalidNumberKeys}
              onChange={(e) => setPositiveNumber("daily_production_capacity", e.target.value)}
              className={`${inputClsMode} ${errCls("daily_production_capacity")}`}
              disabled={saving}
            />
            <span className="text-xs text-zinc-400 whitespace-nowrap">kg/tháng</span>
          </div>
          <ErrMsg field="daily_production_capacity" />
        </div>

        {/* Thời hạn bảo quản */}
        <div>
          <label className={labelCls}>Thời hạn bảo quản</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Số ngày"
              value={form.storage_duration_days}
              onKeyDown={blockDecimalKeys}
              onChange={(e) => setPositiveInteger("storage_duration_days", e.target.value)}
              className={`${inputClsMode} ${errCls("storage_duration_days")}`}
              disabled={saving}
            />
            <span className="text-xs text-zinc-400 whitespace-nowrap">ngày</span>
          </div>
          <ErrMsg field="storage_duration_days" />
        </div>
      </div>
    </Section>
  );
}
