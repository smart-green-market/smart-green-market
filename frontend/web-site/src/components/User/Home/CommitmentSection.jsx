import {
    Headphones,
    ShieldCheck,
    Sprout,
    Trophy,
    Truck,
    Wallet,
} from "lucide-react";

const COMMITMENTS = [
    {
        icon: Sprout,
        title: "100% Hữu cơ",
        description:
            "Tất cả sản phẩm đều được trồng theo phương pháp hữu cơ, không sử dụng hóa chất độc hại.",
        color: "bg-emerald-100 text-emerald-700",
    },
    {
        icon: Truck,
        title: "Giao hàng nhanh",
        description:
            "Giao hàng trong ngày tại TP.HCM, đảm bảo sản phẩm luôn tươi ngon nhất.",
        color: "bg-sky-100 text-sky-700",
    },
    {
        icon: ShieldCheck,
        title: "Cam kết chất lượng",
        description:
            "Hoàn tiền 100% nếu sản phẩm không đạt chất lượng như cam kết.",
        color: "bg-teal-100 text-teal-700",
    },
    {
        icon: Trophy,
        title: "Nguồn gốc rõ ràng",
        description:
            "Truy xuất nguồn gốc từ vườn đến bàn ăn, minh bạch về quy trình sản xuất.",
        color: "bg-amber-100 text-amber-700",
    },
    {
        icon: Wallet,
        title: "Giá cả hợp lý",
        description:
            "Giá trực tiếp từ nông dân, không qua trung gian, tiết kiệm chi phí cho khách hàng.",
        color: "bg-lime-100 text-lime-700",
    },
    {
        icon: Headphones,
        title: "Hỗ trợ 24/7",
        description:
            "Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ mọi lúc, mọi nơi.",
        color: "bg-violet-100 text-violet-700",
    },
];

export default function CommitmentSection() {
    return (
        <section className="bg-stone-50 py-14 sm:py-16">
            <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
                <div className="mb-10 text-center">
                    <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">
                        Tại sao chọn Smart Green Market?
                    </h2>
                    <p className="mt-2 text-sm text-neutral-500 sm:text-base">
                        6 lý do khách hàng tin tưởng và lựa chọn chúng tôi
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {COMMITMENTS.map(({ icon: Icon, title, description, color }) => (
                        <article
                            key={title}
                            className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div
                                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${color}`}
                            >
                                <Icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-emerald-950">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                                {description}
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
