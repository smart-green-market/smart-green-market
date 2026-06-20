import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
    {
        id: 1,
        image: "../../public/images/banner1.jpg",
        title: "Mua rau tại vườn",
        subtitle: "Rau sạch tươi ngon, thu hoạch mỗi ngày từ nông trại của chúng tôi.",
    },
    {
        id: 2,
        image: "../../public/images/banner2.jpg",
        title: "Giảm giá cuối tuần",
        subtitle: "100% không thuốc trừ sâu, an toàn cho cả gia đình bạn.",
    },
];

export default function Banner() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
    const next = () => setCurrent((c) => (c + 1) % SLIDES.length);

    return (
        <div className="relative w-full h-[420px] overflow-hidden group">
            {SLIDES.map((slide, i) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
                >
                    <img
                        src={slide.image}
                        alt={slide.title}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/65 via-emerald-950/30 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24">
                        <h1
                            className="mb-4 text-4xl font-normal leading-[1.2] text-white md:text-5xl"
                            style={{ fontFamily: "'Pacifico', cursive" }}
                        >
                            {slide.title}
                        </h1>
                        <p className="mb-8 max-w-sm text-lg leading-7 text-white/85">
                            {slide.subtitle}
                        </p>
                        <button
                            type="button"
                            className="hover:scale-105 cursor-pointer w-fit rounded-xl bg-emerald-800 px-7 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
                        >
                            Mua ngay
                        </button>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={prev}
                className="cursor-pointer absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-white/40 group-hover:opacity-100"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            <button
                type="button"
                onClick={next}
                className="cursor-pointer absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-white/40 group-hover:opacity-100"
            >
                <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {SLIDES.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setCurrent(i)}
                        className={`rounded-full transition-all ${i === current ? "h-2.5 w-5 bg-white" : "h-2.5 w-2.5 bg-white/50"}`}
                    />
                ))}
            </div>
        </div>
    );
}
