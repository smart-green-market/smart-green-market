import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
    {
        id: 1,
        image: "./public/images/banner1.jpg",
        title: "Mua rau tại vườn",
        subtitle: "Rau sạch tươi ngon, thu hoạch mỗi ngày từ nông trại của chúng tôi.",
    },
    {
        id: 2,
        image: "./public/images/banner2.jpg",
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
        <div className="w-full px-10 pt-6">
            <div className="relative w-full max-w-[1200px] mx-auto h-[400px] rounded-2xl overflow-hidden group">
                {/* Slides */}
                {SLIDES.map((slide, i) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
                    >
                        <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/65 via-emerald-950/30 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-center px-14">
                            <h1 className="text-white text-5xl font-normal leading-[1.2] mb-4" style={{ fontFamily: "'Pacifico', cursive" }}>
                                {slide.title}
                            </h1>
                            <p className="text-white/85 text-lg max-w-sm mb-8 leading-7">
                                {slide.subtitle}
                            </p>
                            <button className="w-fit px-7 py-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors">
                                Mua ngay
                            </button>
                        </div>
                    </div>
                ))}

                {/* Arrow buttons */}
                <button
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`rounded-full transition-all ${i === current ? "w-5 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/50"}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}