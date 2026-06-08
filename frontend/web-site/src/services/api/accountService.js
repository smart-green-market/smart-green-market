import axiosClient from "./axiosClient";

export const accountService = {
  // --- ACCOUNT

  create: (data) =>
    axiosClient.post("/register/", data).then((res) => res.data.data),

// {
//   "username": "supplier01",
//   "email": "supplier01@example.com",
//   "password": "12345678",
//   "repassword": "12345678",
//   "full_name": "Nguyen Van A",
//   "phone": "0901234567",
//   "role": "supplier"
// }
};