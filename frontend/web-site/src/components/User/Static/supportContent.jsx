import { Link } from "react-router-dom";

export function getSupportSections(policiesPath) {
    return [
        {
            id: "hotline",
            title: "Hotline CSKH",
            content: (
                <>
                    <p>Đội ngũ chăm sóc khách hàng sẵn sàng hỗ trợ bạn:</p>
                    <div className="rounded-xl bg-emerald-50 px-5 py-4">
                        <p className="text-lg font-bold text-emerald-900">1900 6868</p>
                        <p className="mt-1 text-sm text-emerald-800">
                            Thứ 2 – Chủ nhật: 7:00 – 21:00
                        </p>
                        <p className="mt-2 text-sm text-neutral-600">
                            Email: support@smartgreenmarket.vn
                        </p>
                    </div>
                    <p>
                        Vui lòng cung cấp mã đơn hàng và số điện thoại đặt hàng để được xử lý
                        nhanh hơn.
                    </p>
                </>
            ),
        },
        {
            id: "huong-dan-mua-hang",
            title: "Hướng dẫn mua hàng",
            content: (
                <>
                    <ol className="list-decimal space-y-3 pl-5">
                        <li>Truy cập cửa hàng đại lý qua link hoặc mã slug.</li>
                        <li>Chọn sản phẩm, xem chi tiết và thêm vào giỏ hàng (cần đăng nhập).</li>
                        <li>Vào Giỏ hàng, chọn sản phẩm cần mua và nhấn Đặt hàng.</li>
                        <li>Chọn địa chỉ giao hàng, khung giờ giao và xác nhận đơn.</li>
                        <li>Thanh toán COD khi nhận hàng và theo dõi trạng thái trong mục Đơn hàng.</li>
                    </ol>
                    <p>
                        Phí vận chuyển và khung giờ giao được hiển thị rõ tại bước xác nhận đơn
                        hàng trước khi bạn đặt mua.
                    </p>
                </>
            ),
        },
        {
            id: "faq",
            title: "FAQ — Câu hỏi thường gặp",
            content: (
                <>
                    <div className="space-y-5">
                        <div>
                            <p className="font-semibold text-emerald-950">
                                Tôi có cần đăng ký tài khoản không?
                            </p>
                            <p className="mt-1">
                                Bạn có thể xem sản phẩm mà không cần đăng nhập. Để thêm giỏ
                                hàng, đặt hàng và theo dõi đơn, vui lòng đăng ký/đăng nhập tài
                                khoản buyer.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-emerald-950">
                                Làm sao để đổi khung giờ giao?
                            </p>
                            <p className="mt-1">
                                Khung giờ giao được chọn khi đặt hàng. Nếu cần thay đổi sau khi
                                đặt, liên hệ hotline CSKH càng sớm càng tốt.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-emerald-950">
                                Sản phẩm không tươi thì xử lý thế nào?
                            </p>
                            <p className="mt-1">
                                Liên hệ CSKH trong vòng 2 giờ kể từ khi nhận hàng. Xem thêm{" "}
                                <Link
                                    to={`${policiesPath}#doi-tra`}
                                    className="font-medium text-emerald-800 no-underline hover:underline"
                                >
                                    Chính sách đổi trả
                                </Link>
                                .
                            </p>
                        </div>
                    </div>
                </>
            ),
        },
    ];
}
