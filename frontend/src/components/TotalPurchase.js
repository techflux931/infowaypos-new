// src/components/TotalPurchase.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";

import vendorIcon from "../assets/vendor.png";
import expenseIcon from "../assets/expense.png";
import purchaseIcon from "../assets/purchase.png"; // ✅ new image

import "./TotalPurchase.css";

const TotalPurchase = () => {
  const navigate = useNavigate();

  return (
    <div className="total-purchase-wrapper">
      {/* Top Bar with Home Button */}
      <div className="top-bar">
        <button
          className="home-btn"
          onClick={() => navigate("/dashboard")}
          title="Go Home"
        >
          <FaHome />
        </button>
        <h2 className="page-title">Total Purchase</h2>
      </div>

      {/* Card Section */}
      <div className="cards-container">
        <div
          className="card"
          onClick={() => navigate("/total-purchase/purchase")}
        >
          <img src={purchaseIcon} alt="Purchase" />
          <span>Purchase</span>
        </div>

        <div
          className="card"
          onClick={() => navigate("/total-purchase/vendor")}
        >
          <img src={vendorIcon} alt="Vendor" />
          <span>Vendor</span>
        </div>

        <div
          className="card"
          onClick={() => navigate("/total-purchase/expense")}
        >
          <img src={expenseIcon} alt="Expense" />
          <span>Expense</span>
        </div>
      </div>
    </div>
  );
};

export default TotalPurchase;
