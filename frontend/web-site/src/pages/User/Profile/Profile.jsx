import { useState } from "react";
import { Loader2 } from "lucide-react";
import AddressFormModal from "../../../components/User/Profile/AddressFormModal";
import AddressSection from "../../../components/User/Profile/AddressSection";
import EditProfileModal from "../../../components/User/Profile/EditProfileModal";
import PersonalInfoCard from "../../../components/User/Profile/PersonalInfoCard";
import BuyerConfirmModal from "../../../components/User/Ui/BuyerConfirmModal";
import { useBuyerAddresses } from "../../../hooks/useBuyerAddresses";
import { useBuyerCatalog } from "../../../hooks/useBuyerCatalog";
import { useBuyerProfile } from "../../../hooks/useBuyerProfile";
import { appToast } from "../../../components/common/toast";

export default function UserProfilePage() {
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [addressModal, setAddressModal] = useState({
        open: false,
        mode: "create",
        address: null,
    });
    const [deleteConfirm, setDeleteConfirm] = useState({
        open: false,
        address: null,
    });

    const {
        profile,
        loading: profileLoading,
        saving: profileSaving,
        error: profileError,
        reload: reloadProfile,
        saveProfile,
    } = useBuyerProfile();

    const {
        addresses,
        loading: addressLoading,
        saving: addressSaving,
        error: addressError,
        defaultAddressId,
        canAddMore,
        maxAddresses,
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
    } = useBuyerAddresses();

    const { categories } = useBuyerCatalog();

    const visibleCategories = categories.filter(
        (item) => item.status !== "inactive" && item.status !== "rejected",
    );

    const openAddressModal = (mode, address = null) => {
        setAddressModal({ open: true, mode, address });
    };

    const closeAddressModal = () => {
        setAddressModal({ open: false, mode: "create", address: null });
    };

    const handleAddressSubmit = async (form) => {
        if (addressModal.mode === "edit" && addressModal.address?.id != null) {
            return updateAddress(addressModal.address.id, form);
        }
        return createAddress(form);
    };

    const handleSetDefault = async (id) => {
        const result = await setDefaultAddress(id);
        if (!result.success) {
            appToast.warning(result.message || "Không thể đặt địa chỉ mặc định");
            return;
        }
        appToast.success("Đã cập nhật địa chỉ mặc định");
    };

    const openDeleteConfirm = (address) => {
        setDeleteConfirm({ open: true, address });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ open: false, address: null });
    };

    const handleConfirmDeleteAddress = async () => {
        if (!deleteConfirm.address?.id) {
            return { success: false };
        }

        const result = await deleteAddress(deleteConfirm.address.id);
        if (!result.success) {
            appToast.warning(result.message || "Xóa địa chỉ thất bại");
            return { success: false };
        }

        appToast.success("Đã xóa địa chỉ");
        return { success: true };
    };

    if (profileLoading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl bg-white shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
            </div>
        );
    }

    if (profileError || !profile) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-sm text-red-700">
                    {profileError || "Không thể tải thông tin cá nhân."}
                </p>
                <button
                    type="button"
                    onClick={reloadProfile}
                    className="cursor-pointer mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PersonalInfoCard
                profile={profile}
                onEdit={() => setIsEditProfileOpen(true)}
            />

            <AddressSection
                addresses={addresses}
                defaultAddressId={defaultAddressId}
                loading={addressLoading}
                saving={addressSaving}
                error={addressError}
                canAddMore={canAddMore}
                maxAddresses={maxAddresses}
                onAddAddress={() => {
                    if (!canAddMore) {
                        appToast.warning(
                            `Chỉ được thêm tối đa ${maxAddresses} địa chỉ.`,
                        );
                        return;
                    }
                    openAddressModal("create");
                }}
                onSetDefault={handleSetDefault}
                onViewAddress={(address) => openAddressModal("view", address)}
                onEditAddress={(address) => openAddressModal("edit", address)}
                onDeleteAddress={openDeleteConfirm}
            />

            <EditProfileModal
                open={isEditProfileOpen}
                profile={profile}
                categories={visibleCategories}
                saving={profileSaving}
                onClose={() => setIsEditProfileOpen(false)}
                onSave={saveProfile}
            />

            <AddressFormModal
                open={addressModal.open}
                mode={addressModal.mode}
                address={addressModal.address}
                saving={addressSaving}
                onClose={closeAddressModal}
                onSubmit={handleAddressSubmit}
            />

            <BuyerConfirmModal
                open={deleteConfirm.open}
                onClose={closeDeleteConfirm}
                onConfirm={handleConfirmDeleteAddress}
                title="Xác nhận xóa địa chỉ"
                message={
                    deleteConfirm.address ? (
                        <>
                            Bạn có chắc muốn xóa địa chỉ của{" "}
                            <span className="font-semibold text-emerald-950">
                                {deleteConfirm.address.receiver_name}
                            </span>
                            ? Hành động này không thể hoàn tác.
                        </>
                    ) : (
                        "Bạn có chắc muốn xóa địa chỉ này?"
                    )
                }
                confirmText="Xóa địa chỉ"
                cancelText="Hủy"
                variant="danger"
                loading={addressSaving}
            />
        </div>
    );
}
