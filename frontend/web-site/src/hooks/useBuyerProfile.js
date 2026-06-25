import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/authProvider";
import { accountService } from "../services/api/accountService";
import {
  buyerProfileService,
  handleApiError,
} from "../services/api/Buyer/buyerProfileService";
import {
  buildBuyerProfileUpdatePayload,
  normalizeBuyerProfile,
  syncBuyerUserStorage,
} from "../utils/buyerProfileUtils";
import { useDealerSlug } from "./useStorefrontPaths";

export function useBuyerProfile() {
  const slug = useDealerSlug();
  const { syncSession } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!slug) {
      setProfile(null);
      setError("Chưa xác định cửa hàng.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await buyerProfileService.getProfile(slug);
      setProfile(normalizeBuyerProfile(data));
    } catch (err) {
      setError(handleApiError(err, "Không thể tải thông tin cá nhân"));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const applyProfileResponse = useCallback(
    (data) => {
      const normalized = normalizeBuyerProfile(data);
      setProfile(normalized);
      syncBuyerUserStorage(normalized);
      syncSession?.();
      return normalized;
    },
    [syncSession],
  );

  const saveProfile = useCallback(
    async (form, avatarFile = null) => {
      if (!slug || !profile) {
        return {
          success: false,
          message: "Không tìm thấy thông tin cửa hàng.",
        };
      }

      setSaving(true);
      try {
        const payload = buildBuyerProfileUpdatePayload(form, profile);
        const hasTextChanges = Object.keys(payload).length > 0;

        if (!avatarFile && !hasTextChanges) {
          return { success: false, message: "Không có thay đổi để lưu." };
        }

        if (avatarFile) {
          const formData = new FormData();
          formData.append("avatar", avatarFile);
          await accountService.updateAvatar(formData);
        }

        if (hasTextChanges) {
          await buyerProfileService.updateProfile(slug, payload);
        }

        const data = await buyerProfileService.getProfile(slug);
        applyProfileResponse(data);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          message: handleApiError(err, "Cập nhật thông tin thất bại"),
        };
      } finally {
        setSaving(false);
      }
    },
    [slug, profile, applyProfileResponse],
  );

  return {
    slug,
    profile,
    loading,
    saving,
    error,
    reload: loadProfile,
    saveProfile,
  };
}
