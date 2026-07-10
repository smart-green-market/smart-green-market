import axiosClient from "./axiosClient";

const mapRecommendations = (recommendations) => {
  if (!Array.isArray(recommendations)) return [];
  return recommendations.map(rec => {
    const decision = rec.decision || "";
    const productName = rec.product_name || "Sản phẩm";
    const category = rec.category || "Nông sản";
    
    // Determine title
    let title = `${decision}: ${productName}`;
    
    // Determine type & urgency
    let type = "stable_alert";
    let urgency = "low";
    let action_label = "Xem kho hàng";
    let action_link = "/dai-ly/kho-hang";
    
    if (decision.includes("Khuyến mãi") || decision.includes("khuyen_mai")) {
      type = "discount_alert";
      urgency = "high";
      action_label = "Cấu hình giảm giá";
      action_link = "/dai-ly/giam-gia";
    } else if (decision.includes("gấp") || decision.includes("gap")) {
      type = "import_alert";
      urgency = "high";
      action_label = "Tạo đơn nhập hàng";
      action_link = `/dai-ly/nhap-hang/tao-moi?product_name=${encodeURIComponent(productName)}`;
    } else if (decision.includes("Nhập thêm") || decision.includes("nhap_them")) {
      type = "import_alert";
      urgency = "medium";
      action_label = "Tạo đơn nhập hàng";
      action_link = `/dai-ly/nhap-hang/tao-moi?product_name=${encodeURIComponent(productName)}`;
    } else if (decision.includes("Giảm nhập") || decision.includes("giam_nhap")) {
      type = "stable_alert";
      urgency = "medium";
      action_label = "Xem kho hàng";
      action_link = "/dai-ly/kho-hang";
    }
    
    // Generate detailed description
    const descParts = [];
    descParts.push(`Mặt hàng thuộc danh mục ${category}.`);
    descParts.push(`Lượng bán TB gần đây: ${rec.recent_avg_daily_sales || 0} kg/ngày (${rec.growth_rate_percentage || "0%"}).`);
    if (rec.stock_days_left !== undefined) {
      descParts.push(`Tồn kho đủ dùng trong ${rec.stock_days_left} ngày.`);
    }
    if (rec.days_to_nearest_expiry !== undefined) {
      descParts.push(`Hạn sử dụng còn: ${rec.days_to_nearest_expiry} ngày.`);
    }
    descParts.push(`Độ tin cậy: ${rec.confidence_percentage || "0%"}.`);
    
    const description = descParts.join(" ");
    
    return {
      ...rec,
      title,
      description,
      type,
      urgency,
      action_label,
      action_link
    };
  });
};

const aiPredictionService = {
  getProductPredictions: () => {
    return axiosClient.get("/product-prediction-results/")
      .then(res => {
        if (res && Array.isArray(res.data)) {
          return res.data;
        }
        return [];
      })
      .catch(err => {
        console.warn("Product predictions API not available, returning empty list:", err);
        return [];
      });
  },
  getDecisionRecommendations: (dealerId, category, decisionType) => {
    const params = { dealer_id: dealerId };
    if (category) params.category = category;
    if (decisionType) params.decision_type = decisionType;
    
    return axiosClient.get("/dealer/recommendations/", { params })
      .then(res => {
        if (res && res.data && Array.isArray(res.data.recommendations)) {
          return {
            summary_kpi: res.data.summary_kpi,
            recommendations: mapRecommendations(res.data.recommendations)
          };
        }
        throw new Error("Expected recommendations array inside res.data but got " + typeof res.data);
      });
  },
  trainAiModel: (dealerId) => {
    return axiosClient.post("/dealer/train/", { dealer_id: dealerId })
      .then(res => {
        return res.data;
      });
  },
  analyzeAiData: (dealerId) => {
    return axiosClient.post("/dealer/analyze/", { dealer_id: dealerId })
      .then(res => {
        return res.data;
      });
  }
};

export default aiPredictionService;
export { mapRecommendations };
