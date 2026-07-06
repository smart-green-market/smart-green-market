import { useNavigate } from "react-router-dom";

// Icon SVG dạng inline (không phụ thuộc thư viện ngoài, dễ chỉnh style)
const IconLeaf = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 21c.5 -4.5 2.5 -8 7 -10" />
    <path d="M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3z" />
  </svg>
);
const IconHome = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
  </svg>
);
const IconArrowLeft = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12l14 0" />
    <path d="M5 12l6 6" />
    <path d="M5 12l6 -6" />
  </svg>
);
const IconCarrot = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 5c1.577 1.688 1.373 4.513 0 6l-9.5 9.5a2.121 2.121 0 0 1 -3 -3l9.5 -9.5c1.487 -1.373 4.313 -1.577 6 0z" />
    <path d="M16 6l2 2" />
    <path d="M18 4c.5 1 1 2 3 2.5c-.5 1.5 -1 2 -3 2.5" />
    <path d="M13 9c.5 1 1 2 3 2.5c-.5 1.5 -1 2 -3 2.5" />
  </svg>
);
const IconApple = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.598 8.416a5 4.5 0 0 0 -2.598 4.084a5 4.5 0 0 0 5 4.5c1 0 2 -.5 3 -1.5c1 1 2 1.5 3 1.5a5 4.5 0 0 0 5 -4.5a5 4.5 0 0 0 -2.598 -4.084" />
    <path d="M12 8v-2" />
    <path d="M10 5c.667 -1.333 2 -2 4 -2" />
  </svg>
);

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f4f6] px-6 py-10 font-['Be_Vietnam_Pro',_sans-serif]">
      {/* glow trang trí */}
      <div className="pointer-events-none absolute -left-24 -top-36 h-[420px] w-[420px] rounded-full bg-[#1a5c2a0f]" />
      <div className="pointer-events-none absolute -right-24 -bottom-40 h-[380px] w-[380px] rounded-full bg-[#6ee7b71a]" />

      <div className="relative z-10 max-w-[440px] text-center">

        {/* logo */}
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0f3d20]">
            <IconLeaf className="h-[18px] w-[18px] text-[#6ee7b7]" />
          </div>
          <div className="text-[15px] font-bold text-gray-900">
            Smart <span className="text-[#1a5c2a]">Green Market</span>
          </div>
        </div>

        {/* minh họa giỏ nông sản bị lật */}
        <div className="relative mx-auto h-[130px] w-[200px]">
          <div className="absolute bottom-1.5 left-2.5 right-2.5 h-2.5 rounded-full bg-gray-200 opacity-60 blur-[3px]" />
          <div className="absolute bottom-3.5 left-3.5 h-[66px] w-[100px] -rotate-[8deg] rounded-t-md rounded-b-2xl border-2 border-[#1a5c2a] bg-[#EAF3DE]" />
          <div className="absolute bottom-[82px] left-[108px] flex h-8 w-8 rotate-[18deg] items-center justify-center rounded-full bg-[#e8763c] text-white">
            <IconCarrot className="h-4 w-4" />
          </div>
          <div className="absolute bottom-1 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#d64545] text-white">
            <IconApple className="h-3.5 w-3.5" />
          </div>
          <div className="absolute -bottom-0.5 right-[42px] flex h-6 w-6 items-center justify-center rounded-full bg-[#4a9b5e] text-white">
            <IconLeaf className="h-3 w-3" />
          </div>
          <div className="absolute bottom-[90px] left-[70px] h-5 w-5 rounded-full bg-[#f0b429]" />
        </div>

        {/* mã lỗi + nội dung */}
        <div className="mt-1.5 text-[76px] font-extrabold leading-none tracking-tight text-gray-900">
          4<span className="text-[#1a5c2a]">0</span>4
        </div>
        <h1 className="mt-3 text-[18px] font-bold text-gray-900">
          Rất tiếc, không tìm thấy trang này
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
          Trang bạn tìm có thể đã bị xóa, đổi tên hoặc đường dẫn không tồn tại.
        </p>
      </div>
    </div>
  );
}