import { useMemo, useState } from "react";
import AddressSection from "../../../components/User/Profile/AddressSection";
import PersonalInfoCard from "../../../components/User/Profile/PersonalInfoCard";
import EditProfileModal from "../../../components/User/Profile/EditProfileModal";
import AddAddressModal from "../../../components/User/Profile/AddAddressModal";
import { mockAddresses, mockProfile } from "../../../components/User/Profile/mockData";

export default function UserProfilePage() {
  const [selectedAddressId, setSelectedAddressId] = useState(
    mockAddresses.find((item) => item.isDefault)?.id || mockAddresses[0]?.id || "",
  );
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);

  const addresses = useMemo(() => mockAddresses, []);

  const handleEditAddress = (address) => {
    // TODO: khi có API sẽ mở modal chỉnh sửa theo id address.
    console.log("Edit address", address.id);
    setIsAddAddressOpen(true);
  };

  return (
    <div className="space-y-8">
      <PersonalInfoCard profile={mockProfile} onEdit={() => setIsEditProfileOpen(true)} />
      <AddressSection
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onChangeAddress={setSelectedAddressId}
        onAddAddress={() => setIsAddAddressOpen(true)}
        onEditAddress={handleEditAddress}
      />

      <EditProfileModal
        open={isEditProfileOpen}
        profile={mockProfile}
        onClose={() => setIsEditProfileOpen(false)}
      />
      <AddAddressModal open={isAddAddressOpen} onClose={() => setIsAddAddressOpen(false)} />
    </div>
  );
}
