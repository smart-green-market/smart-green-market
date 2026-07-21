import { useState, useEffect } from "react";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { useAuth } from "../../../contexts/authProvider";
import WaitingStockModal from "../PreOrder/WaitingStockModal";
import { supplierService } from "../../../services/api/suppilerService";
import { categoryService } from "../../../services/api/categoryService";
import { dealerService } from "../../../services/api/dealerService";
import { toast } from "sonner";
import FiltersBar from "./FiltersBar";
import ProductCard from "./ProductCard";
import { useLocation } from "react-router-dom";
// import ProcessStepper from "./ProcessStepper";
import DraftInvoice from "./DraftInvoice";
import DeliveryInfoForm from "./DeliveryInfoForm";
import {
  computeDiscountedUnitPrice,
  formatOrderItemDiscountLabel,
} from "../../../utils/quantityDiscountUtils";
import Pagination from "../../common/Pagination";

const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=300&auto=format&fit=crop";

function formatPurchaseProduct(p) {
  const wholesalePrice = parseFloat(p.wholesale_price) || 0;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    unit: p.unit || "kg",
    code: p.slug ? p.slug.toUpperCase().slice(0, 10) : `PROD-${p.id}`,
    price: wholesalePrice,
    basePrice: wholesalePrice,
    quantityDiscountTiers: p.quantity_discount_tiers || [],
    dailyProductionCapacity: parseFloat(p.daily_production_capacity) || 0,
    category: p.category || null,
    supplier: p.supplier || null,
    image_url: p.images?.[0]?.image_url || PRODUCT_IMAGE_FALLBACK,
  };
}

export default function CreatePurchaseOrder({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [waitingStockOpen, setWaitingStockOpen] = useState(false);

  // --- STATE QUẢN LÝ BỘ LỌC (FILTERS) ---
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const location = useLocation();
  const savedDraft = location.state?.draftData;

  // Ghi chú đơn hàng — khôi phục từ draftData nếu back từ trang preview
  const [orderNote, setOrderNote] = useState(() => savedDraft?.note ?? "");

  // Thông tin giao hàng — khôi phục từ draftData nếu back từ trang preview
  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    if (savedDraft) {
      // Chuyển ISO string về định dạng datetime-local (yyyy-MM-ddTHH:mm)
      let deliveryTime = "";
      if (savedDraft.requested_delivery_time) {
        const dt = new Date(savedDraft.requested_delivery_time);
        // Offset sang giờ local để datetime-local input hiển thị đúng
        const offset = dt.getTimezoneOffset() * 60000;
        deliveryTime = new Date(dt - offset).toISOString().slice(0, 16);
      }
      return {
        receiverName: savedDraft.receiver_name ?? "",
        receiverPhone: savedDraft.receiver_phone ?? "",
        deliveryAddress: savedDraft.delivery_address ?? "",
        requestedDeliveryTime: deliveryTime,
      };
    }
    return {
      receiverName: "",
      receiverPhone: "",
      deliveryAddress: "",
      requestedDeliveryTime: "",
    };
  });

  // --- STATE QUẢN LÝ DỮ LIỆU TỪ API ---
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE QUẢN LÝ GIỎ HÀNG NHÁP (DRAFT CART) ---
  // cart: { [productId]: quantity } là 1 object rỗng
  // cardQuantities: Lưu số lượng nhập tạm thời hiển thị trên từng thẻ sản phẩm
  const [cardQuantities, setCardQuantities] = useState({});

  // Khởi tạo state cart từ draftData truyền về (nếu có)
  const [cart, setCart] = useState(() => {
    if (savedDraft && savedDraft.items) {
      const initialCart = {};
      savedDraft.items.forEach((item) => {
        initialCart[item.supplier_product_id] = {
          product: {
            id: item.supplier_product_id,
            name: item.name,
            unit: item.unit || "Kg",
            price: item.price,
            basePrice: item.base_price,
            quantityDiscountTiers: item.discount_type ? [{
              discount_type: item.discount_type,
              discount_value: item.discount_value,
              min_quantity: item.discount_min_quantity
            }] : [],
            supplier: item.supplier || { id: item.supplier_id || savedDraft.supplier_id, company_name: savedDraft.supplier_name },
            image_url: item.product_thumbnail_url || PRODUCT_IMAGE_FALLBACK,
          },
          quantity: item.quantity,
        };
      });
      return initialCart;
    }
    return {};
  });

  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearchQuery !== searchQuery) {
        setDebouncedSearchQuery(searchQuery);
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery]);

  // Reset trang về 1 khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSupplier, selectedCategory, debouncedSearchQuery]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [supplierData, categoryData, dealerData] = await Promise.all([
          supplierService.getAll().catch(() => []),
          categoryService.getAll({ status: "active" }).catch(() => []),
          dealerService.getAll().catch(() => []),
        ]);

        const supplierList = Array.isArray(supplierData) ? supplierData : [];
        setSuppliers(supplierList);
        setCategories(Array.isArray(categoryData) ? categoryData : []);

        // Mặc định chọn "Tất cả" (selectedSupplier = "")

        //Tự điền thông tin người nhận vào thông tin giao hàng
        if (dealerData?.length > 0 && !savedDraft) {
          const dealer = dealerData[0];
          const dt = new Date();
          dt.setDate(dt.getDate() + 3);
          const offset = dt.getTimezoneOffset() * 60000;
          const deliveryTime = new Date(dt.getTime() - offset).toISOString().slice(0, 16);

          setDeliveryInfo((prev) => ({
            ...prev,
            receiverName: dealer.account?.full_name || dealer.account?.first_name || prev.receiverName,
            receiverPhone: dealer.account?.phone || prev.receiverPhone,
            deliveryAddress: dealer.store_address || prev.deliveryAddress,
            requestedDeliveryTime: deliveryTime,
          }));
        }
      } catch (err) {
        console.error("Lỗi khi tải metadata trang Tạo đơn nhập:", err);
        toast.error("Không thể tải danh sách nhà cung cấp.", { position: "top-center", duration: 5000 });
      }
    };

    fetchMeta();
  }, [savedDraft]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productParams = {
          page: currentPage,
          page_size: 9,
        };
        if (selectedCategory) {
          productParams.category = selectedCategory;
        }
        if (debouncedSearchQuery) {
          productParams.search = debouncedSearchQuery;
        }
        const response = await supplierService.getSupplierProducts(
          selectedSupplier,
          productParams,
        );
        const results = response?.results || (Array.isArray(response) ? response : []);
        const total = response?.count || results.length;
        setProducts(results.map(formatPurchaseProduct));
        setTotalProductsCount(total);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
        toast.error("Không thể tải danh sách sản phẩm.", { position: "top-center", duration: 5000 });
        setProducts([]);
        setTotalProductsCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedSupplier, selectedCategory, debouncedSearchQuery, currentPage]);




  /**
   * Cập nhật số lượng nhập trực tiếp từ ô input của thẻ sản phẩm.
   * prev là dự liệu trước đó, ...prev --> sao chép dữ liệu trước đó
   * [productId]: num --> gán dữ liệu mới vào hoặc cập nhật lại số lượng
   */
  const handleCardQtyChange = (productId, val) => {
    // Cho phép nhập số lượng lẻ (thập phân, tối đa 2 chữ số sau dấu phẩy)
    let sanitized = val.replace(/[^0-9.]/g, "");

    // Đảm bảo chỉ có tối đa một dấu chấm
    const parts = sanitized.split(".");
    if (parts.length > 2) {
      sanitized = parts[0] + "." + parts.slice(1).join("");
    }

    // Giới hạn tối đa 2 chữ số thập phân
    if (parts.length === 2 && parts[1].length > 2) {
      sanitized = parts[0] + "." + parts[1].slice(0, 2);
    }

    setCardQuantities((prev) => ({
      ...prev,
      [productId]: sanitized,
    }));
  };

  /**
   * Tăng hoặc giảm số lượng thông qua nút cộng/trừ của thẻ sản phẩm.
   */
  const adjustCardQty = (productId, delta) => {
    const current = parseFloat(cardQuantities[productId]) || 0;
    const nextVal = Math.max(0, current + delta);
    // Làm tròn tối đa 2 chữ số thập phân và chuyển về string
    const formattedVal = Number(nextVal.toFixed(2)).toString();
    setCardQuantities((prev) => ({
      ...prev,
      [productId]: formattedVal,
    }));
  };

  /**
   * Thêm sản phẩm vào phiếu nhập nháp với số lượng đã chọn.
   */
  const handleAddToCart = (product) => {
    const qtyToAdd = parseFloat(cardQuantities[product.id]) || 0;
    if (qtyToAdd <= 0) {
      toast.warning(
        `Vui lòng chọn số lượng lớn hơn 0 để thêm sản phẩm ${product.name}.`,
        {
          position: "top-center",
          duration: 3000,
        },
      );
      return;
    }

    setCart((prev) => {
      const existingQty = prev[product.id]?.quantity || 0;
      const newQty = parseFloat((existingQty + qtyToAdd).toFixed(2));
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: newQty,
        },
      };
    });

    toast.success(
      `Đã thêm ${qtyToAdd} ${product.unit} ${product.name} vào phiếu nháp.`,
      { position: "top-center", duration: 3000 },
    );
    // Reset lại ô số lượng trên card sản phẩm về "0"
    setCardQuantities((prev) => ({
      ...prev,
      [product.id]: "0",
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

  // --- PHÂN TRANG CHO LƯỚI SẢN PHẨM ---
  const ITEMS_PER_PAGE = 9;
  const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
  const paginatedProducts = products;

  const getLinePricing = (product, quantity) => {
    const pricing = computeDiscountedUnitPrice(
      product.basePrice ?? product.price,
      quantity,
      product.quantityDiscountTiers,
    );
    return {
      unitPrice: pricing.unitPrice,
      basePrice: pricing.basePrice,
      discountPerUnit: pricing.discountPerUnit,
      tier: pricing.tier,
      subtotal: pricing.unitPrice * quantity,
    };
  };

  // --- TÍNH TOÁN CHI TIẾT ĐƠN HÀNG NHÁP ---
  const cartItems = Object.entries(cart)
    .map(([id, cartItem]) => {
      const prod = cartItem.product;
      const qty = cartItem.quantity;
      if (!prod) return null;
      const line = getLinePricing(prod, qty);
      return {
        product: {
          ...prod,
          price: line.unitPrice,
          basePrice: line.basePrice,
          appliedTier: line.tier,
        },
        quantity: qty,
        subtotal: line.subtotal,
        discountAmount: line.discountPerUnit * qty,
      };
    })
    .filter(Boolean);

  //Tổng số lượng sản phẩm
  const totalItemsCount = cartItems.length;
  //Tổng tiền
  const rawSubtotal = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalDiscount = cartItems.reduce((acc, curr) => acc + (curr.discountAmount || 0), 0);
  const finalTotal = rawSubtotal;
  /**
   * Gửi yêu cầu tạo đơn nhập hàng mới từ danh sách nháp.
   */
  const handleCreateOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm vào phiếu nhập!", { position: "top-center", duration: 5000 },);
      return;
    }

    if (!deliveryInfo.receiverName?.trim() || !deliveryInfo.receiverPhone?.trim() || !deliveryInfo.deliveryAddress?.trim() || !deliveryInfo.requestedDeliveryTime) {
      toast.error("Vui lòng nhập đầy đủ Thông tin giao hàng trước khi tạo phiếu!", { position: "top-center", duration: 5000 });
      return;
    }

    // Validate tên người nhận tối đa 255 ký tự
    if (deliveryInfo.receiverName.trim().length > 255) {
      toast.error("Tên người nhận không được vượt quá 255 ký tự!", { position: "top-center", duration: 5000 });
      return;
    }

    // Validate số điện thoại Việt Nam hợp lệ (cả di động và cố định)
    const phoneRegex = /^(0|\+84)(2[0-9]{9}|[35789][0-9]{8})$/;
    if (!phoneRegex.test(deliveryInfo.receiverPhone.trim())) {
      toast.error("Số điện thoại không đúng định dạng! Vui lòng nhập số điện thoại hợp lệ (ví dụ: 0912345678 hoặc +842412345678).", { position: "top-center", duration: 5000 });
      return;
    }

    // Validate thời gian giao dự kiến không được chọn ngày đã qua (ở quá khứ)
    const requestedTime = new Date(deliveryInfo.requestedDeliveryTime);
    const now = new Date();
    // Reset giây và mili giây để so sánh chính xác theo phút
    now.setSeconds(0);
    now.setMilliseconds(0);
    if (requestedTime < now) {
      toast.error("Thời gian giao dự kiến phải ở trong tương lai!", { position: "top-center", duration: 5000 });
      return;
    }

    // Nhóm sản phẩm theo nhà cung cấp
    //ac là biến tích luỹ (accumulator)
    //item là phần tử hiện tại đang được xử lý 
    //{} là giá trị ban đầu của ac (một object rỗng)
    const groupedItems = cartItems.reduce((acc, item) => {
      const supplierId = item.product.supplier?.id || 1;
      if (!acc[supplierId]) acc[supplierId] = [];
      acc[supplierId].push(item);
      return acc;
    }, {});

    const supplierIds = Object.keys(groupedItems);//lấy danh sách các supplierId

    // Kiểm tra tổng hoá đơn của từng nhà cung cấp có trên 500.000đ hay không
    for (const supplierId of supplierIds) {
      const items = groupedItems[supplierId];
      const supplierName = items[0]?.product?.supplier?.company_name || "Nhà cung cấp";
      const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

      if (totalAmount < 500000) {
        toast.error(`Tổng hoá đơn của ${supplierName} phải đạt tối thiểu 500.000đ (hiện tại: ${totalAmount.toLocaleString("vi-VN")}đ)`, { position: "top-center", duration: 5000 });
        return;
      }
    }

    const draftDataList = supplierIds.map(supplierId => {
      const items = groupedItems[supplierId];
      const firstProduct = items[0]?.product;

      return {
        isDraft: true,
        supplier_id: Number(supplierId),
        supplier_name: firstProduct?.supplier?.company_name || "Nhà cung cấp",
        delivery_address: deliveryInfo.deliveryAddress,
        requested_delivery_time: new Date(deliveryInfo.requestedDeliveryTime).toISOString(),
        receiver_name: deliveryInfo.receiverName,
        receiver_phone: deliveryInfo.receiverPhone,
        note: orderNote.trim() !== "" ? orderNote.trim() : "Yêu cầu giao hàng cẩn thận, sản phẩm đạt chuẩn.",
        items: items.map((item) => {
          let productId = item.product.id;
          if (typeof productId === "string" && productId.startsWith("def-")) {
            productId = productId === "def-1" ? 1 : productId === "def-2" ? 2 : 3;
          }
          const tier = item.product.appliedTier;
          const unitPrice = Number(item.product.price);
          const basePrice = Number(item.product.basePrice ?? item.product.price);
          const lineDiscount = Number(item.discountAmount || 0);
          return {
            supplier_product_id: Number(productId),
            name: item.product.name,
            unit: item.product.unit || "Kg",
            quantity: Number(item.quantity),
            price: unitPrice,
            unit_price: unitPrice,
            base_price: basePrice,
            base_unit_price: basePrice,
            discount_type: tier?.discount_type || "",
            discount_value: tier?.discount_value ?? null,
            discount_min_quantity: tier?.min_quantity ?? null,
            discount_label: tier
              ? formatOrderItemDiscountLabel(
                {
                  discount_type: tier.discount_type,
                  discount_value: tier.discount_value,
                  discount_min_quantity: tier.min_quantity,
                },
                item.product.unit,
              )
              : "",
            has_quantity_discount: lineDiscount > 0,
            line_discount_amount: lineDiscount,
            discount_amount: lineDiscount,
            subtotal: Number(item.subtotal),
            product_thumbnail_url: item.product.image_url,
            note: "",
            supplier: item.product.supplier,
          };
        }),
        // Gửi các giá trị tài chính dưới dạng raw
        gross_subtotal: items.reduce(
          (sum, i) => sum + Number(i.product.basePrice ?? i.product.price) * Number(i.quantity),
          0,
        ),
        total_discount_amount: items.reduce(
          (sum, i) => sum + Number(i.discountAmount || 0),
          0,
        ),
        total_amount: items.reduce((sum, i) => sum + i.subtotal, 0),
      };
    });

    if (onSuccess) {
      onSuccess(draftDataList);
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
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
        <button
          type="button"
          onClick={() => setWaitingStockOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 px-4 py-2.5 text-xs font-bold text-stone-700 transition-all shadow-xs self-start sm:self-auto"
        >
          <PackageSearch className="w-4 h-4 text-emerald-600 animate-pulse" />
          Xem sản phẩm đặt trước
        </button>
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
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100 text-neutral-400 font-medium">
              Không tìm thấy sản phẩm nào khớp với bộ lọc.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    inputQty={cardQuantities[p.id] ?? "0"}
                    previewPricing={getLinePricing(p, parseFloat(cardQuantities[p.id]) || 0)}
                    onQtyChange={(val) => handleCardQtyChange(p.id, val)}
                    onQtyAdjust={(delta) => adjustCardQty(p.id, delta)}
                    onAddToCart={() => handleAddToCart(p)}
                  />
                ))}
              </div>

              {/* Phân trang */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
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
            discountAmount={totalDiscount}
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
      <WaitingStockModal
        isOpen={waitingStockOpen}
        onClose={() => setWaitingStockOpen(false)}
        dealerId={user?.dealer_profile?.id}
      />
    </div>
  );
}
