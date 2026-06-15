export function extractApiError(error, defaultMessage = "Có lỗi xảy ra") {
    const data = error?.response?.data;

    if (typeof data === "string" && data.trim()) {
        return data;
    }

    if (data?.detail) {
        return typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail);
    }

    if (data?.message) {
        return data.message;
    }

    if (data && typeof data === "object") {
        const parts = Object.entries(data).map(([key, value]) => {
            const text = Array.isArray(value) ? value.join(", ") : String(value);
            return `${key}: ${text}`;
        });

        if (parts.length > 0) {
            return parts.join("; ");
        }
    }

    if (error?.message) {
        return error.message;
    }

    return defaultMessage;
}
