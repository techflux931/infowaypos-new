// src/api/returns.js
import axios from "./axios";
export async function createReturn(txn) {
  const { data } = await axios.post("/return", txn); // hits ReturnController -> ReturnService.create
  return data;
}
