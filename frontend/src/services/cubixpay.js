import api from "./api";

export const createPayout = (data) =>
  api.post("/payout/transfer", data).then((r) => r.data);
export const fetchPayoutStatus = (id) =>
  api.get(`/payout/status/${id}`).then((r) => r.data);
export const fetchPayoutList = () =>
  api.get("/payout/list").then((r) => r.data);
export const fetchProviders = () => api.get("/providers").then((r) => r.data);
