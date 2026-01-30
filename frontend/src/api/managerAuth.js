// src/api/managerAuth.js
import axios from "./axios";

const managerAuthApi = {
  async listManagers() { const { data } = await axios.get("/manager-auth/managers"); return data; },
  async getManagerAuth(id) { const { data } = await axios.get(`/manager-auth/${id}`); return data; },
  async updateManagerAuth(id, payload) { const { data } = await axios.put(`/manager-auth/${id}`, payload); return data; },
  async createManager(payload) { const { data } = await axios.post("/manager-auth/managers", payload); return data; },

  // NEW:
  async verifyReturnAuth(payload) {
    const { data } = await axios.post("/manager-auth/verify", payload);
    return data; // { ok, message, user: { id, fullName, username } }
  },
};

export const {
  listManagers,
  getManagerAuth,
  updateManagerAuth,
  createManager,
  verifyReturnAuth,       // <— export it
} = managerAuthApi;

export default managerAuthApi;
