// src/common/formatDateTime.js

export const formatDateTime = (value) => {
  if (!value) return "Chưa có";

  const date = new Date(value);

  if (isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
