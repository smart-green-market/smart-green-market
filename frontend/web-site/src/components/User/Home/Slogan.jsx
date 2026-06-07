// components/User/Home/VegetableSidebar.jsx
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import {
  Leaf
} from "lucide-react";

const slogans = [
  { id: 1, text: "100% hữu cơ - An toàn cho sức khỏe", icon: Leaf, color: "text-green-600" },
  { id: 2, text: "Không thuốc trừ sâu - Rau sạch từ gốc", icon: Leaf, color: "text-green-600" },
  { id: 3, text: "Rau tươi mỗi ngày - Giàu dinh dưỡng", icon: Leaf, color: "text-green-600" },
  { id: 5, text: "Kiểm định nghiêm ngặt - Chất lượng hàng đầu", icon: Leaf, color: "text-green-600" },
  { id: 8, text: "Không hóa chất bảo quản - Tinh khiết từ đất", icon: Leaf, color: "text-green-600" },
];

export default function Slogan() {
  return (
    <div className="w-full bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <Swiper
        modules={[Autoplay, FreeMode]}
        spaceBetween={24}
        slidesPerView="auto"
        loop={true}
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          stopOnLastSlide: false,
        }}
        speed={5000}
        breakpoints={{
          320: { slidesPerView: 1.5 },
          640: { slidesPerView: 2.5 },
          768: { slidesPerView: 3.5 },
          1024: { slidesPerView: 4.5 },
        }}
        className="py-3"
      >
        {[...slogans, ...slogans].map((item, idx) => {
          const Icon = item.icon;
          return (
            <SwiperSlide key={idx} className="!w-auto">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full whitespace-nowrap">
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-sm font-medium text-gray-700">
                  {item.text}
                </span>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}