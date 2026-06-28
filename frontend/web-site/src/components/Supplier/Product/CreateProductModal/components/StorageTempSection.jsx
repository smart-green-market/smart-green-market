import { Thermometer } from "lucide-react";
import Section from "./Section";
import { labelCls } from "../constants";

/**
 * Props:
 *   form         : object
 *   setTemperature : (key, rawVal) => void
 *   fieldErrors  : object
 *   saving       : boolean
 *   accentColor  : string
 *   inputClsMode : string
 */
export default function StorageTempSection({
  form,
  setTemperature,
  fieldErrors,
  saving,
  accentColor,
  inputClsMode,
}) {
  const blockTempKeys = (e) => {
    if (["e", "E", "+"].includes(e.key)) e.preventDefault();
  };

  const errCls = (field) =>
    fieldErrors[field] ? "!border-red-400 !bg-red-50 focus:!ring-red-300" : "";

  const ErrMsg = ({ field }) =>
    fieldErrors[field]
      ? <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p>
      : null;

  return (
    <Section icon={<Thermometer className={`w-4 h-4 ${accentColor}`} />} title="Nhiệt độ bảo quản">
      <div className="grid grid-cols-2 gap-3">
        {/* Nhiệt độ tối thiểu */}
        <div>
          <label className={labelCls}>Nhiệt độ tối thiểu</label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              placeholder="VD: 2"
              value={form.min_storage_temp}
              onKeyDown={blockTempKeys}
              onChange={(e) => setTemperature("min_storage_temp", e.target.value)}
              className={`${inputClsMode} pr-8 ${errCls("min_storage_temp")}`}
              disabled={saving}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">°C</span>
          </div>
          <ErrMsg field="min_storage_temp" />
        </div>

        {/* Nhiệt độ tối đa */}
        <div>
          <label className={labelCls}>Nhiệt độ tối đa</label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              placeholder="VD: 8"
              value={form.max_storage_temp}
              onKeyDown={blockTempKeys}
              onChange={(e) => setTemperature("max_storage_temp", e.target.value)}
              className={`${inputClsMode} pr-8 ${errCls("max_storage_temp")}`}
              disabled={saving}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">°C</span>
          </div>
          <ErrMsg field="max_storage_temp" />
        </div>
      </div>
      <p className="text-xs text-zinc-400 mt-2">Để trống nếu không có yêu cầu cụ thể.</p>
    </Section>
  );
}
