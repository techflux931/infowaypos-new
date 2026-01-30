// src/components/DeliveryChallanModal.js
import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import "./DeliveryChallanModal.css";
import { FaTimes, FaEye } from "react-icons/fa";

const DeliveryChallanModal = ({ onClose }) => {
  const [challans, setChallans] = useState([]);

  useEffect(() => {
    const fetchChallans = async () => {
      try {
        const res = await axios.get("/deliverychallans");
        setChallans(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch delivery challans:", err);
      }
    };
    fetchChallans();
  }, []);

  return (
    <div className="challan-modal-overlay">
      <div className="challan-modal-container">
        <div className="modal-header">
          <h2>📋 Delivery Challan List</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes /> X
          </button>
        </div>

        <table className="challan-list-table">
          <thead>
            <tr>
              <th>Challan No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Salesman</th>
              <th>Status</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {challans.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No challans found
                </td>
              </tr>
            ) : (
              challans.map((challan) => (
                <tr key={challan.id || challan.challanNumber}>
                  <td>{challan.challanNumber}</td>
                  <td>{new Date(challan.date).toLocaleDateString()}</td>
                  <td>{challan.customer || "-"}</td>
                  <td>{challan.salesman || "-"}</td>
                  <td>{challan.status}</td>
                  <td>{challan.total?.toFixed(2)}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() =>
                        alert(`🧾 View Challan: ${challan.challanNumber}`)
                      }
                    >
                      <FaEye /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeliveryChallanModal;
