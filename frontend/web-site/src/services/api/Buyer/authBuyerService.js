import axiosClient from "../axiosClient";
import { refreshAccessToken } from "../../token/refreshTokenManager";

export const authBuyerService = {
    login: (dealer_slug, data) => axiosClient.post(`/storefronts/${dealer_slug}/login/`, data).then((res) => res.data),

    // Chỉ tài khoản đã đăng ký tại đúng đại lý mới đăng nhập được. Token đại lý A không dùng được tại đại lý B.
    // in dealer_slug: string
    // data{
    //     "email": "buyer@gmail.com",
    //     "password": "12345678"
    //   }

    register: (dealer_slug, data) => axiosClient.post(`/storefronts/${dealer_slug}/register/`, data).then((res) => res.data),

    // Mỗi đại lý có tệp buyer riêng. Cùng email có thể đăng ký lại tại đại lý khác.
    // Trả JWT kèm claim store_dealer_id, store_dealer_slug, auth_scope=storefront.
    // in dealer_slug: string
    // {
    //     "email": "buyer@gmail.com",
    //     "password": "12345678",
    //     "repassword": "12345678",
    //     "full_name": "Nguyen Van A",
    //     "phone": "0901234567"
    //   }


    logout: () => axiosClient.post("/logout/").then((res) => res.data),
    
    refresh: () => refreshAccessToken(),

};
