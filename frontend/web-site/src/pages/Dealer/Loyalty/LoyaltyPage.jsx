import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Coins, Settings, Award } from "lucide-react";
import { loyaltyService } from "../../../services/api/loyaltyService";
import { toast } from "sonner";

import LoyaltySettingsTab from "../../../components/Dealer/Loyalty/LoyaltySettingsTab";
import LoyaltyTiersTab from "../../../components/Dealer/Loyalty/LoyaltyTiersTab";
import LoyaltyStatsTab from "../../../components/Dealer/Loyalty/LoyaltyStatsTab";
import TierFormModal from "../../../components/Dealer/Loyalty/TierFormModal";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b", "#ec4899"];

export default function LoyaltyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "settings";

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Settings states
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Tiers states
  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [savingTier, setSavingTier] = useState(false);

  // Stats states
  const [stats, setStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchTiers();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const data = await loyaltyService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Lỗi khi tải cấu hình tích điểm:", err);
      toast.error("Không thể tải cấu hình tích điểm.");
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchTiers = async () => {
    setLoadingTiers(true);
    try {
      const data = await loyaltyService.getTiers();
      setTiers(data.results || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách hạng:", err);
      toast.error("Không thể tải danh sách hạng thành viên.");
    } finally {
      setLoadingTiers(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await loyaltyService.getTierStats();
      // Format data for chart
      const chartData = data.map((item) => ({
        name: item.tier.name,
        count: item.customer_count,
      }));
      setStats(chartData);
    } catch (err) {
      console.error("Lỗi tải thống kê hạng:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settings) return;
    if (parseInt(settings.points_per_unit) <= 0) {
      toast.warning("Tỷ lệ quy đổi phải lớn hơn 0 VNĐ");
      return;
    }

    setSavingSettings(true);
    try {
      await loyaltyService.updateSettings({
        is_active: settings.is_active,
        points_per_unit: parseInt(settings.points_per_unit),
        include_shipping_in_points: settings.include_shipping_in_points,
      });
      toast.success("Đã lưu cấu hình tích điểm thành công!");
      fetchSettings();
    } catch (err) {
      console.error("Lỗi lưu cấu hình tích điểm:", err);
      toast.error(err.response?.data?.points_per_unit?.[0] || "Không thể lưu cấu hình tích điểm.");
    } finally {
      setSavingSettings(false);
    }
  };

  const openTierModal = (tier = null) => {
    setSelectedTier(tier);
    setIsTierModalOpen(true);
  };

  const handleSaveTier = async (payload) => {
    setSavingTier(true);
    try {
      if (selectedTier) {
        await loyaltyService.updateTier(selectedTier.id, payload);
        toast.success(`Đã cập nhật hạng ${payload.name} thành công!`);
      } else {
        await loyaltyService.createTier(payload);
        toast.success(`Đã tạo mới hạng ${payload.name} thành công!`);
      }
      setIsTierModalOpen(false);
      fetchTiers();
      fetchStats();
    } catch (err) {
      console.error("Lỗi lưu hạng thành viên:", err);
      const detail = err.response?.data;
      if (detail && typeof detail === "object") {
        const errorMsg = Object.entries(detail)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("\n");
        toast.error(errorMsg || "Lỗi lưu cấu hình hạng.");
      } else {
        toast.error("Không thể lưu hạng thành viên.");
      }
    } finally {
      setSavingTier(false);
    }
  };

  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Coins className="w-6 h-6 text-emerald-600 animate-pulse" />
          <h1 className="text-2xl font-black text-emerald-950 tracking-tight">Thiết lập Loyalty &amp; Hạng thành viên</h1>
        </div>
        <p className="text-sm text-neutral-500 font-medium">
          Cấu hình tích điểm cho khách hàng B2C và quản lý cấp độ hạng để thúc đẩy mua sắm.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-8 bg-white p-1 rounded-xl shadow-2xs max-w-fit gap-1">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "settings"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Settings className="w-4 h-4" /> Thiết lập tích điểm
        </button>
        <button
          onClick={() => setActiveTab("tiers")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "tiers"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Award className="w-4 h-4" /> Cấp độ hạng thành viên
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "stats"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Award className="w-4 h-4" /> Thống kê khách hàng
        </button>
      </div>

      {/* Tab Contents */}
      <div className="max-w-4xl">
        {activeTab === "settings" && (
          <LoyaltySettingsTab
            settings={settings}
            onChange={setSettings}
            loadingSettings={loadingSettings}
            savingSettings={savingSettings}
            onSave={handleSaveSettings}
          />
        )}

        {activeTab === "tiers" && (
          <LoyaltyTiersTab
            tiers={tiers}
            loadingTiers={loadingTiers}
            onAddTier={() => openTierModal()}
            onEditTier={(tier) => openTierModal(tier)}
          />
        )}

        {activeTab === "stats" && (
          <LoyaltyStatsTab
            stats={stats}
            loadingStats={loadingStats}
            colors={COLORS}
          />
        )}
      </div>

      {/* Create / Edit Tier Form Modal */}
      <TierFormModal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        selectedTier={selectedTier}
        savingTier={savingTier}
        onSave={handleSaveTier}
      />
    </div>
  );
}
