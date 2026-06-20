import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { supplierService } from "../../../services/api/suppilerService";
import { categoryService } from "../../../services/api/categoryService";
import { productService } from "../../../services/api/productService";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/authProvider";
import FiltersBar from "./FiltersBar";
import ProductCard from "./ProductCard";
import { useLocation } from "react-router-dom";
// import ProcessStepper from "./ProcessStepper";
import DraftInvoice from "./DraftInvoice";
import DeliveryInfoForm from "./DeliveryInfoForm";

export default function CreatePurchaseOrder({ onClose, onSuccess }) {
  const { user } = useAuth();
  // --- STATE QUẢN LÝ BỘ LỌC (FILTERS) ---
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderNote, setOrderNote] = useState(""); // Ghi chú của đại lý
  const [deliveryInfo, setDeliveryInfo] = useState({
    receiverName: "",
    receiverPhone: "",
    deliveryAddress: "",
    requestedDeliveryTime: "",
  });

  // --- STATE QUẢN LÝ DỮ LIỆU TỪ API ---
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE QUẢN LÝ GIỎ HÀNG NHÁP (DRAFT CART) ---
  // cart: { [productId]: quantity } là 1 object rỗng
  // const [cart, setCart] = useState({});
  // cardQuantities: Lưu số lượng nhập tạm thời hiển thị trên từng thẻ sản phẩm
  const [cardQuantities, setCardQuantities] = useState({});

  const location = useLocation();
  // Khởi tạo state cart từ draftData truyền về (nếu có)
  const [cart, setCart] = useState(() => {
    const savedDraft = location.state?.draftData;
    if (savedDraft && savedDraft.items) {
      const initialCart = {};
      savedDraft.items.forEach((item) => {
        initialCart[item.supplier_product_id] = item.quantity;
      });
      return initialCart;
    }
    return {};
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Gọi API lấy danh sách nhà cung cấp, nếu lỗi trả về mảng rỗng
        const supplierData = await supplierService.getAll().catch(() => []);
        setSuppliers(supplierData || []);

        // Gọi API lấy danh sách danh mục, nếu lỗi trả về mảng rỗng
        const categoryData = await categoryService.getAll().catch(() => []);
        setCategories(categoryData || []);

        // Gọi API lấy danh sách tất cả sản phẩm
        const productResponse = await productService
          .getAll()
          .catch(() => ({ results: [] }));
        //Kiểm tra danh sách trả về có phải là mảng không
        const productList = Array.isArray(productResponse)
          ? productResponse
          : productResponse?.results || [];

        // Chuẩn hóa cấu trúc sản phẩm lấy từ API
        const formattedProducts = productList.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          unit: p.unit || "kg",
          code: p.slug ? p.slug.toUpperCase().slice(0, 10) : `PROD-${p.id}`,
          price: p.wholesale_price || Math.floor(Math.random() * 5 + 2) * 10000,
          stock: p.stock || Math.floor(Math.random() * 800 + 100),
          category: p.category || { id: 1, name: "Rau củ" },
          supplier: p.supplier || {
            id: 1,
            company_name: "Nhà cung cấp đối tác",
          },
          image_url:
            p.images?.[0]?.image_url ||
            "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=300&auto=format&fit=crop",
        }));

        setProducts(formattedProducts);

        // Dự phòng: Nếu API trả về trống, tự động gán dữ liệu mẫu để giao diện không bị lỗi
        if (supplierData.length === 0) {
          setSuppliers([
            { id: 1, company_name: "Hợp tác xã Rau sạch Đà Lạt" },
            { id: 2, company_name: "Nông trại Xanh Lâm Đồng" },
            { id: 3, company_name: "Trại nấm Hữu cơ Minh Đức" },
          ]);
        }
        if (categoryData.length === 0) {
          setCategories([
            { id: 1, name: "Rau củ" },
            { id: 2, name: "Củ quả" },
            { id: 3, name: "Nấm" },
          ]);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang Tạo đơn nhập:", err);
        toast.error("Không thể tải dữ liệu danh sách sản phẩm.", { position: "top-center", duration: 5000 },);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- POPULATE MẶC ĐỊNH DELIVERY INFO KHI CÓ USER ---
  // Đã bỏ mặc định điền thông tin giao hàng theo yêu cầu
  // useEffect(() => {
  //   if (user) { ... }
  // }, [user]);


  /**
   * Cập nhật số lượng nhập trực tiếp từ ô input của thẻ sản phẩm.
   * prev là dự liệu trước đó, ...prev --> sao chép dữ liệu trước đó
   * [productId]: num --> gán dữ liệu mới vào hoặc cập nhật lại số lượng
   */
  const handleCardQtyChange = (productId, val) => {
    let num = parseInt(val);
    if (isNaN(num) || num < 0) num = 0;
    setCardQuantities((prev) => ({
      ...prev,
      [productId]: num,
    }));
  };

  /**
   * Tăng hoặc giảm số lượng thông qua nút cộng/trừ của thẻ sản phẩm.
   */
  const adjustCardQty = (productId, delta) => {
    const current = cardQuantities[productId] || 0;
    const nextVal = Math.max(0, current + delta);
    setCardQuantities((prev) => ({
      ...prev,
      [productId]: nextVal,
    }));
  };

  /**
   * Thêm sản phẩm vào phiếu nhập nháp với số lượng đã chọn.
   */
  const handleAddToCart = (product) => {
    const qtyToAdd = cardQuantities[product.id] || 0;
    if (qtyToAdd <= 0) {
      toast.warning(
        `Vui lòng chọn số lượng để thêm sản phẩm ${product.name}.`,
        {
          position: "top-center",
          duration: 3000,
        },
      );
      return;
    }

    // Kiểm tra xem sản phẩm có cùng nhà cung cấp với các sản phẩm đã có trong giỏ không
    const cartEntries = Object.keys(cart);
    if (cartEntries.length > 0) {
      const firstCartProductId = cartEntries[0];
      const firstProductInCart = products.find(
        (p) => String(p.id) === String(firstCartProductId),
      );
      const currentSupplierId = firstProductInCart?.supplier?.id;
      const newSupplierId = product.supplier?.id;

      if (
        currentSupplierId &&
        newSupplierId &&
        String(currentSupplierId) !== String(newSupplierId)
      ) {
        toast.error(
          `Mỗi đơn hàng chỉ thuộc về 1 nhà cung cấp! Giỏ hàng đang chứa sản phẩm của "${firstProductInCart.supplier?.company_name}". Vui lòng hoàn tất đơn hiện tại hoặc xóa sản phẩm cũ.`,
          { position: "top-center", duration: 5000 },
        );
        return;
      }
    }

    // Cảnh báo nếu số lượng muốn nhập vượt quá lượng hàng có sẵn của NCC
    if (qtyToAdd > product.stock) {
      toast.error(
        `Số lượng nhập (${qtyToAdd} ${product.unit}) vượt quá tồn kho của NCC (${product.stock} ${product.unit})!`,
        { position: "top-center", duration: 4000 },
      );
    } else {
      setCart((prev) => ({
        ...prev,
        [product.id]: (prev[product.id] || 0) + qtyToAdd,
      }));

      toast.success(
        `Đã thêm ${qtyToAdd} ${product.unit} ${product.name} vào phiếu nháp.`,
        { position: "top-center", duration: 3000 },
      );
    }
    // Reset lại ô số lượng trên card sản phẩm về 0
    setCardQuantities((prev) => ({
      ...prev,
      [product.id]: 0,
    }));
  };

  /**
   * Xóa một sản phẩm ra khỏi danh sách phiếu nhập nháp.
   */
  const handleRemoveFromCart = (productId) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  // --- LỌC SẢN PHẨM THEO BỘ LỌC ---
  const filteredProducts = products.filter((p) => {
    const selectedSupObj = suppliers.find(s => String(s.id) === String(selectedSupplier));
    const selectedSupName = selectedSupObj ? (selectedSupObj.company_name || selectedSupObj.name) : "";

    const matchesSupplier =
      selectedSupplier === "" ||
      (p.supplier && (
        String(p.supplier?.id || p.supplier) === String(selectedSupplier) ||
        String(p.supplier?.company_name || p.supplier?.name || p.supplier) === String(selectedSupplier) ||
        (selectedSupName && String(p.supplier?.company_name || p.supplier?.name || p.supplier).toLowerCase() === selectedSupName.toLowerCase())
      ));

    const selectedCatObj = categories.find(c => String(c.id) === String(selectedCategory));
    const selectedCatName = selectedCatObj ? selectedCatObj.name : "";

    const matchesCategory =
      selectedCategory === "" ||
      (p.category && (
        String(p.category?.id || p.category) === String(selectedCategory) ||
        String(p.category?.name || p.category) === String(selectedCategory) ||
        (selectedCatName && String(p.category?.name || p.category).toLowerCase() === selectedCatName.toLowerCase())
      ));

    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSupplier && matchesCategory && matchesSearch;
  });

  // --- TÍNH TOÁN CHI TIẾT ĐƠN HÀNG NHÁP ---
  const cartItems = Object.entries(cart) //Object.entries(cart) chuyển cart sang dạng key-value
    .map(([id, qty]) => {
      const prod = products.find((p) => String(p.id) === String(id));
      return {
        product: prod,
        quantity: qty,
        subtotal: prod ? prod.price * qty : 0,
      };
    })
    .filter((item) => item.product !== undefined);

  //Tổng số lượng sản phẩm
  const totalItemsCount = cartItems.length;
  //Tổng tiền
  const rawSubtotal = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const finalTotal = rawSubtotal;
  /**
   * Gửi yêu cầu tạo đơn nhập hàng mới từ danh sách nháp.
   */
  const handleCreateOrder = () => {
    if (cartItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm vào phiếu nhập!", { position: "top-center", duration: 5000 },);
      return;
    }

    if (!deliveryInfo.receiverName?.trim() || !deliveryInfo.receiverPhone?.trim() || !deliveryInfo.deliveryAddress?.trim() || !deliveryInfo.requestedDeliveryTime) {
      toast.error("Vui lòng nhập đầy đủ Thông tin giao hàng trước khi tạo phiếu!", { position: "top-center", duration: 5000 });
      return;
    }

    const firstProduct = cartItems[0]?.product;
    let supplierId = firstProduct?.supplier?.id;
    if (!supplierId || isNaN(Number(supplierId))) {
      supplierId = 1; // ID mặc định dự phòng
    }

    const draftData = {
      isDraft: true,
      supplier_id: Number(supplierId),
      supplier_name: firstProduct?.supplier?.company_name || "Nhà cung cấp",
      delivery_address: deliveryInfo.deliveryAddress,
      requested_delivery_time: new Date(deliveryInfo.requestedDeliveryTime).toISOString(),
      receiver_name: deliveryInfo.receiverName,
      receiver_phone: deliveryInfo.receiverPhone,
      note: orderNote.trim() !== "" ? orderNote.trim() : "Yêu cầu giao hàng cẩn thận, sản phẩm đạt chuẩn.",
      items: cartItems.map((item) => {
        let productId = item.product.id;
        if (typeof productId === "string" && productId.startsWith("def-")) {
          productId = productId === "def-1" ? 1 : productId === "def-2" ? 2 : 3;
        }
        return {
          supplier_product_id: Number(productId),
          name: item.product.name,
          unit: item.product.unit || "Kg",
          quantity: Number(item.quantity),
          price: Number(item.product.price),
          subtotal: Number(item.subtotal),
          note: "",
        };
      }),
      // Gửi các giá trị tài chính dưới dạng raw
      total_amount: finalTotal,
    };

    if (onSuccess) {
      onSuccess(draftData);
    }
  };

  /**
   * Hủy bỏ quá trình nhập hàng và quay về trang trước.
   */
  const handleCancel = () => {
    if (cartItems.length > 0) {
      if (
        window.confirm("Bạn có chắc chắn muốn hủy phiếu nhập nháp này không?")
      ) {
        setCart({});
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="font-['Geist',sans-serif]">
      {/* Header và Nút quay lại */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer text-neutral-600 border-none bg-transparent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Quản lý đơn nhập hàng
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Tạo phiếu nhập nông sản mới từ các nhà vườn đối tác.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* VÙNG CHÍNH: Bộ lọc & Lưới danh sách sản phẩm */}
        <div className="flex-1 lg:w-3/4 flex flex-col gap-6">
          {/* Component bộ lọc */}
          <FiltersBar
            suppliers={suppliers}
            categories={categories}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Lưới sản phẩm */}
          {loading ? (
            <div className="text-center py-20 text-neutral-500 font-medium">
              Đang tải danh sách sản phẩm...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100 text-neutral-400 font-medium">
              Không tìm thấy sản phẩm nào khớp với bộ lọc.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  inputQty={cardQuantities[p.id] || 0}
                  onQtyChange={(val) => handleCardQtyChange(p.id, val)}
                  onQtyAdjust={(delta) => adjustCardQty(p.id, delta)}
                  onAddToCart={() => handleAddToCart(p)}
                />
              ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI (SIDEBAR): Tiến trình quy trình & Hóa đơn nháp */}
        <div className="w-full lg:w-1/4 flex flex-col gap-6">
          {/* Component thanh quy trình */}
          {/* <ProcessStepper /> */}

          {/* Form thông tin giao nhận */}
          <DeliveryInfoForm
            deliveryInfo={deliveryInfo}
            onInfoChange={setDeliveryInfo}
          />

          {/* Component hóa đơn nháp */}
          <DraftInvoice
            cartItems={cartItems}
            totalItemsCount={totalItemsCount}
            rawSubtotal={rawSubtotal}
            finalTotal={finalTotal}
            orderNote={orderNote}
            onNoteChange={setOrderNote}
            onRemoveItem={handleRemoveFromCart}
            onCancel={() => {
              setCart({});
              setOrderNote("");
            }}
            onCreate={handleCreateOrder}
          />
        </div>
      </div>
    </div>
  );
}
