export default function NotFound({ title = "Trang này" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
          padding: "40px 24px",
        }}
      >
        {/* Icon */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c7cdd6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>

        {/* Title */}
        <p
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "#565f6b",
            margin: 0,
          }}
        >
          Chức năng này đang được xây dựng
        </p>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 13,
            color: "#9ca3af",
            margin: 0,
            maxWidth: 360,
          }}
        >
          Quay lại Dashboard hoặc Sản phẩm để xem nội dung đã hoàn thiện.
        </p>
      </div>
    </div>
  );
}