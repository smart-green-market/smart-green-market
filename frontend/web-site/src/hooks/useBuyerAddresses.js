import { useCallback, useEffect, useMemo, useState } from "react";
import {
    buyerAddressService,
    handleApiError,
} from "../services/api/Buyer/buyerAddressService";
import {
    buildAddressPayload,
    MAX_BUYER_ADDRESSES,
    normalizeBuyerAddress,
    parseAddressList,
} from "../utils/buyerAddressUtils";
import { useDealerSlug } from "./useStorefrontPaths";

export function useBuyerAddresses() {
    const slug = useDealerSlug();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadAddresses = useCallback(async () => {
        if (!slug) {
            setAddresses([]);
            setError("Chưa xác định cửa hàng.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await buyerAddressService.getAll(slug);
            const list = parseAddressList(data).map(normalizeBuyerAddress);
            setAddresses(list);
        } catch (err) {
            setError(handleApiError(err, "Không thể tải danh sách địa chỉ"));
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);

    const defaultAddressId = useMemo(
        () => addresses.find((item) => item.is_default)?.id ?? null,
        [addresses],
    );

    const canAddMore = addresses.length < MAX_BUYER_ADDRESSES;

    const createAddress = useCallback(
        async (form) => {
            if (!slug) {
                return { success: false, message: "Chưa xác định cửa hàng." };
            }

            if (!canAddMore) {
                return {
                    success: false,
                    message: `Chỉ được thêm tối đa ${MAX_BUYER_ADDRESSES} địa chỉ.`,
                };
            }

            setSaving(true);
            try {
                const payload = buildAddressPayload(form);
                const isFirst = addresses.length === 0;
                await buyerAddressService.create(slug, {
                    ...payload,
                    is_default: isFirst ? true : payload.is_default,
                });
                await loadAddresses();
                return { success: true };
            } catch (err) {
                return {
                    success: false,
                    message: handleApiError(err, "Thêm địa chỉ thất bại"),
                };
            } finally {
                setSaving(false);
            }
        },
        [slug, canAddMore, addresses.length, loadAddresses],
    );

    const updateAddress = useCallback(
        async (id, form) => {
            if (!slug) {
                return { success: false, message: "Chưa xác định cửa hàng." };
            }

            setSaving(true);
            try {
                await buyerAddressService.update(slug, id, buildAddressPayload(form));
                await loadAddresses();
                return { success: true };
            } catch (err) {
                return {
                    success: false,
                    message: handleApiError(err, "Cập nhật địa chỉ thất bại"),
                };
            } finally {
                setSaving(false);
            }
        },
        [slug, loadAddresses],
    );

    const deleteAddress = useCallback(
        async (id) => {
            if (!slug) {
                return { success: false, message: "Chưa xác định cửa hàng." };
            }

            const target = addresses.find((item) => String(item.id) === String(id));
            const isDeletingDefault = Boolean(target?.is_default);
            const nextDefault = isDeletingDefault
                ? addresses.find((item) => String(item.id) !== String(id))
                : null;

            setSaving(true);
            try {
                await buyerAddressService.delete(slug, id);

                if (nextDefault) {
                    await buyerAddressService.update(slug, nextDefault.id, {
                        receiver_name: nextDefault.receiver_name,
                        receiver_phone: nextDefault.receiver_phone,
                        address: nextDefault.address,
                        is_default: true,
                    });
                }

                await loadAddresses();
                return { success: true };
            } catch (err) {
                return {
                    success: false,
                    message: handleApiError(err, "Xóa địa chỉ thất bại"),
                };
            } finally {
                setSaving(false);
            }
        },
        [slug, addresses, loadAddresses],
    );

    const setDefaultAddress = useCallback(
        async (id) => {
            if (!slug) {
                return { success: false, message: "Chưa xác định cửa hàng." };
            }

            const target = addresses.find((item) => String(item.id) === String(id));
            if (!target || target.is_default) {
                return { success: true };
            }

            setSaving(true);
            try {
                await buyerAddressService.update(slug, id, {
                    receiver_name: target.receiver_name,
                    receiver_phone: target.receiver_phone,
                    address: target.address,
                    is_default: true,
                });
                await loadAddresses();
                return { success: true };
            } catch (err) {
                return {
                    success: false,
                    message: handleApiError(err, "Không thể đặt địa chỉ mặc định"),
                };
            } finally {
                setSaving(false);
            }
        },
        [slug, addresses, loadAddresses],
    );

    const getAddressById = useCallback(
        async (id) => {
            if (!slug) return null;

            const cached = addresses.find((item) => String(item.id) === String(id));
            if (cached) return cached;

            try {
                const data = await buyerAddressService.getById(slug, id);
                return normalizeBuyerAddress(data);
            } catch {
                return null;
            }
        },
        [slug, addresses],
    );

    return {
        addresses,
        loading,
        saving,
        error,
        defaultAddressId,
        canAddMore,
        maxAddresses: MAX_BUYER_ADDRESSES,
        reload: loadAddresses,
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        getAddressById,
    };
}
