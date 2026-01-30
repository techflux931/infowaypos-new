// src/components/PoleScalePrint.js
import React from "react";
import Barcode from "react-barcode";
import "./PoleScalePrint.css";

const PoleScalePrint = ({ data }) => {
  if (!data) return null;

  const { shopName, shopNameAr, itemNameEn, itemNameAr, packedDate, saleTime, unitPrice, weight, expiryDate, barcode, totalPrice } = data;

  return (
    <div className="pole-print-label">
      {/* Store Name */}
      <div className="pole-header">
        <h2>{shopName}</h2>
        <h3>{shopNameAr}</h3>
      </div>

      {/* Item Names */}
      <div className="pole-product-names">
        <strong>{itemNameEn}</strong>
        <div>{itemNameAr}</div>
      </div>

      {/* Table */}
      <table className="pole-label-table">
        <tbody>
          <tr>
            <td>Sale Date</td>
            <td>{packedDate}</td>
            <td>{saleTime}</td>
          </tr>
          <tr>
            <td>Price</td>
            <td colSpan="2">{unitPrice} AED</td>
          </tr>
          <tr>
            <td>Net Wt (kg)</td>
            <td colSpan="2">{weight}</td>
          </tr>
          {expiryDate && (
            <tr>
              <td>Expiry</td>
              <td colSpan="2">{expiryDate}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Barcode */}
      {barcode && (
        <div className="pole-barcode">
          <Barcode value={barcode} format="CODE128" height={40} width={1.5} displayValue={true} />
        </div>
      )}

      {/* Total Price */}
      <div className="pole-total-price">{totalPrice} AED</div>
    </div>
  );
};

export default PoleScalePrint;
