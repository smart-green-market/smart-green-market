import React, { useState } from "react";
import { X, Plus, Trash2, User, Phone, MapPin, Package, CreditCard, Receipt, Calendar, Truck, Store } from "lucide-react";

export default function CreateSalesOrderModal({ isOpen, onClose }) {
    const [customerType, setCustomerType] = useState("existing"); // existing, walk-in
    const [deliveryType, setDeliveryType] = useState("pickup"); // pickup, delivery
    const [orderSource, setOrderSource] = useState("pos"); // pos, web, phone
    const [paymentMethod, setPaymentMethod] = useState("cash"); // cash, transfer, cod
    const [paymentStatus, setPaymentStatus] = useState("unpaid"); // paid, unpaid

    const [products, setProducts] = useState([
        { id: 1, productId: "", quantity: 1, price: 0, batch: "" }
    ]);

    if (!isOpen) return null;

    const handleAddProduct = () => {
        setProducts([...products, { id: Date.now(), productId: "", quantity: 1, price: 0, batch: "" }]);
    };

    const handleRemoveProduct = (id) => {
        setProducts(products.filter(p => p.id !== id));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm overflow-y-auto font-['Geist',sans-serif]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-emerald-100">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-emerald-100 bg-emerald-50/50">
                    <h2 className="text-xl font-bold text-emerald-950 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-600" />
                        Tạo Đơn Bán Mới
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-full text-emerald-700 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Customer Information */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4" /> Thông tin khách hàng
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
                                        <input type="radio" checked={customerType === "existing"} onChange={() => setCustomerType("existing")} className="text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                        Khách hàng có sẵn
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
                                        <input type="radio" checked={customerType === "walk-in"} onChange={() => setCustomerType("walk-in")} className="text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                        Khách lẻ / Mới
                                    </label>
                                </div>
                            </div>

                            {customerType === "existing" ? (
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-xs font-semibold text-neutral-600">Chọn khách hàng</label>
                                    <select className="w-full rounded-xl border-neutral-200 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200/50 text-sm py-2 px-3 outline-none transition-all">
                                        <option value="">-- Chọn khách hàng --</option>
                                        <option value="1">Cửa hàng Rau Sạch Quận 1</option>
                                        <option value="2">Siêu thị mini SafeFood</option>
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-neutral-600">Tên khách hàng</label>
                                        <div className="relative">
                                            <User className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                                            <input type="text" placeholder="Nhập tên khách hàng" className="w-full rounded-xl border-neutral-200 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200/50 text-sm py-2 pl-9 pr-3 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-neutral-600">Số điện thoại</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                                            <input type="text" placeholder="Nhập số điện thoại" className="w-full rounded-xl border-neutral-200 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200/50 text-sm py-2 pl-9 pr-3 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-semibold text-neutral-600">Địa chỉ</label>
                                        <div className="relative">
                                            <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                                            <input type="text" placeholder="Nhập địa chỉ" className="w-full rounded-xl border-neutral-200 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200/50 text-sm py-2 pl-9 pr-3 outline-none transition-all" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    <hr className="border-emerald-100" />

                    {/* Products List */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                                <Package className="w-4 h-4" /> Danh sách sản phẩm
                            </h3>
                            <button onClick={handleAddProduct} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer">
                                <Plus className="w-3.5 h-3.5" /> Thêm sản phẩm
                            </button>
                        </div>
                        
                        <div className="bg-neutral-50/50 rounded-xl border border-neutral-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-100/70 text-neutral-600 font-semibold border-b border-neutral-200">
                                        <tr>
                                            <th className="p-3 w-1/3">Sản phẩm</th>
                                            <th className="p-3 w-24">Số lượng</th>
                                            <th className="p-3">Đơn giá</th>
                                            <th className="p-3">Chọn Lô (Tùy chọn)</th>
                                            <th className="p-3 w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-white transition-colors group">
                                                <td className="p-2">
                                                    <select className="w-full rounded-lg border-neutral-200 focus:border-emerald-500 focus:ring-0 text-sm py-1.5 px-2 outline-none">
                                                        <option value="">Chọn SP...</option>
                                                        <option value="p1">Cải thìa hữu cơ</option>
                                                        <option value="p2">Cà chua bi</option>
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <input type="number" min="1" defaultValue="1" className="w-full rounded-lg border-neutral-200 focus:border-emerald-500 focus:ring-0 text-sm py-1.5 px-2 outline-none" />
                                                </td>
                                                <td className="p-2">
                                                    <div className="relative">
                                                        <input type="text" placeholder="0" className="w-full rounded-lg border-neutral-200 focus:border-emerald-500 focus:ring-0 text-sm py-1.5 px-2 pr-7 outline-none" />
                                                        <span className="absolute right-2 top-1.5 text-xs text-neutral-400">đ</span>
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <select className="w-full rounded-lg border-neutral-200 focus:border-emerald-500 focus:ring-0 text-sm py-1.5 px-2 outline-none">
                                                        <option value="">Tự động (FEFO)</option>
                                                        <option value="b1">Lô B01 (HSD: 15/06)</option>
                                                        <option value="b2">Lô B02 (HSD: 20/06)</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => handleRemoveProduct(product.id)} className="text-neutral-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {products.length === 0 && (
                                <div className="text-center py-6 text-neutral-500 text-sm">
                                    Chưa có sản phẩm nào. Hãy thêm sản phẩm!
                                </div>
                            )}
                        </div>
                    </section>

                    <hr className="border-emerald-100" />

                    {/* Order Details */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left column */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                                    <Store className="w-4 h-4" /> Nguồn đơn & Giao hàng
                                </h3>
                                
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-neutral-600">Nguồn đơn</label>
                                    <div className="flex bg-neutral-100 p-1 rounded-xl">
                                        {['pos', 'web', 'phone'].map(src => (
                                            <button key={src} onClick={() => setOrderSource(src)} className={`flex-1 text-xs py-1.5 rounded-lg transition-all capitalize font-medium cursor-pointer ${orderSource === src ? 'bg-white shadow-sm text-emerald-700' : 'text-neutral-500 hover:text-neutral-700'}`}>
                                                {src === 'pos' ? 'Tại quầy (POS)' : src === 'web' ? 'Website' : 'Điện thoại'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="text-xs font-semibold text-neutral-600">Hình thức giao hàng</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
                                            <input type="radio" checked={deliveryType === "pickup"} onChange={() => setDeliveryType("pickup")} className="text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                            Nhận tại cửa hàng
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
                                            <input type="radio" checked={deliveryType === "delivery"} onChange={() => setDeliveryType("delivery")} className="text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                            Giao tận nơi
                                        </label>
                                    </div>
                                </div>

                                {deliveryType === "delivery" && (
                                    <div className="space-y-3 pt-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-neutral-600">Địa chỉ giao hàng</label>
                                            <div className="relative">
                                                <Truck className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                                                <input type="text" placeholder="Nhập địa chỉ giao" className="w-full rounded-xl border-white shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200/50 text-sm py-2 pl-9 pr-3 outline-none transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-neutral-600">Ngày giao dự kiến</label>
                                            <div className="relative">
                                                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                                                <input type="date" className="w-full rounded-xl border-white shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200/50 text-sm py-2 pl-9 pr-3 outline-none transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right column */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> Thanh toán
                                </h3>
                                
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-neutral-600">Phương thức thanh toán</label>
                                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-xl border-neutral-200 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200/50 text-sm py-2 px-3 outline-none transition-all">
                                        <option value="cash">Tiền mặt</option>
                                        <option value="transfer">Chuyển khoản</option>
                                        <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                                    </select>
                                </div>

                                <div className="space-y-1 pt-1">
                                    <label className="text-xs font-semibold text-neutral-600">Trạng thái thu tiền</label>
                                    <div className="flex bg-neutral-100 p-1 rounded-xl">
                                        <button onClick={() => setPaymentStatus("paid")} className={`flex-1 text-xs py-1.5 rounded-lg transition-all font-medium cursor-pointer ${paymentStatus === "paid" ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                                            Đã thu tiền
                                        </button>
                                        <button onClick={() => setPaymentStatus("unpaid")} className={`flex-1 text-xs py-1.5 rounded-lg transition-all font-medium cursor-pointer ${paymentStatus === "unpaid" ? 'bg-amber-500 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                                            Chưa thu tiền
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-neutral-600">Giảm giá</label>
                                        <div className="relative">
                                            <input type="text" placeholder="0" className="w-full rounded-xl border-neutral-200 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200/50 text-sm py-2 px-3 pr-8 outline-none transition-all" />
                                            <span className="absolute right-3 top-2 text-xs text-neutral-400 font-medium">đ</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-end">
                                        <div className="text-xs font-semibold text-neutral-600 mb-1">Tổng cộng (Dự kiến)</div>
                                        <div className="text-lg font-bold text-emerald-600">0 đ</div>
                                    </div>
                                </div>

                                <div className="space-y-1 pt-2">
                                    <label className="text-xs font-semibold text-neutral-600">Ghi chú</label>
                                    <textarea rows={2} placeholder="Nhập ghi chú đơn hàng..." className="w-full rounded-xl border-neutral-200 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200/50 text-sm py-2 px-3 outline-none transition-all resize-none"></textarea>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-emerald-100 bg-neutral-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer">
                        Hủy
                    </button>
                    <button className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all cursor-pointer">
                        Tạo Đơn Hàng
                    </button>
                </div>
            </div>
        </div>
    );
}
