import { useNavigate } from "react-router-dom";
import CreatePurchaseOrderComponent from "../../../components/Dealer/PurchaseOrder/CreatePurchaseOrder";


export default function DealerCreatePurchaseOrderPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/dai-ly/nhap-hang");
  };

  /**
   * Xử lý sự kiện khi tạo đơn nhập hàng thành công.
   * @param {Object} newOrder - Phiếu nhập hàng mới vừa được tạo.
   * Chuyển hướng sang trang chi tiết của phiếu nhập hàng này.
   */
  const handleSuccess = (draftData) => {
    navigate(`/dai-ly/nhap-hang/tao-phieu-nhap`, { state: { draftData } });
  };

  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Gọi Component Form tạo đơn nhập hàng và truyền các hàm xử lý điều hướng */}
      <CreatePurchaseOrderComponent 
        onClose={handleClose} 
        onSuccess={handleSuccess} 
      />
    </div>
  );
}
