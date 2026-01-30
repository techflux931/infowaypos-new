// src/components/DeliveryChallanForm.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import {
  FaPlus,
  FaTrash,
  FaTimes,
  FaSave,
  FaPrint,
  FaHome,
} from "react-icons/fa";
import "./DeliveryChallanForm.css";

const DeliveryChallanForm = ({ onClose }) => {
  const navigate = useNavigate();

  const [challanNumber, setChallanNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [customerList, setCustomerList] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerTRN, setCustomerTRN] = useState("");
  const [salesman, setSalesman] = useState("");
  const [status, setStatus] = useState("ON PROCESS");
  const [manualNo, setManualNo] = useState("");
  const [project, setProject] = useState("GENERAL");
  const [remarks, setRemarks] = useState("");
  const [quotation, setQuotation] = useState("");

  const [items, setItems] = useState([
    {
      itemCode: "",
      itemName: "",
      description: "",
      qty: 1,
      price: 0,
      unit: "PCS",
      location: "MAIN",
      total: 0,
    },
  ]);

  // Auto-generate challan number & load customers
  useEffect(() => {
    setChallanNumber(`CHLN-${Date.now().toString().slice(-6)}`);
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("/customers");
      setCustomerList(res.data);
    } catch (err) {
      console.error("❌ Failed to load customers", err);
    }
  };

  // Auto-fill TRN when customer selected
  useEffect(() => {
    const selected = customerList.find((c) => c.name === customerName);
    setCustomerTRN(selected ? selected.trn : "");
  }, [customerName, customerList]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] =
      ["qty", "price"].includes(field) ? parseFloat(value) || 0 : value;
    updated[index].total = updated[index].qty * updated[index].price;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemCode: "",
        itemName: "",
        description: "",
        qty: 1,
        price: 0,
        unit: "PCS",
        location: "MAIN",
        total: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      challanNumber,
      date,
      customer: customerName,
      trn: customerTRN,
      salesman,
      status,
      manualDnNo: manualNo,
      project,
      remarks,
      quotation,
      items,
      total: items.reduce((sum, i) => sum + i.total, 0),
    };

    try {
      await axios.post("/deliverychallans", payload);
      alert("✅ Delivery Challan saved successfully!");
      onClose();
    } catch (err) {
      console.error("❌ Save failed", err);
      alert("❌ Failed to save challan");
    }
  };

  return (
    <div className="challan-overlay">
      <div className="challan-container">
        {/* Header */}
        <div className="challan-header">
          <h2>
            <FaHome
              onClick={() => navigate("/dashboard")}
              className="home-icon"
            />{" "}
            Delivery Challan
          </h2>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="challan-grid">
            <div>
              <label>Customer:</label>
              <select
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              >
                <option value="">--Select--</option>
                {customerList.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label>TRN:</label>
              <input value={customerTRN} readOnly />

              <label>Salesman:</label>
              <input
                value={salesman}
                onChange={(e) => setSalesman(e.target.value)}
              />

              <label>Status:</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>ON PROCESS</option>
                <option>DELIVERED</option>
              </select>

              <label>Project:</label>
              <input
                value={project}
                onChange={(e) => setProject(e.target.value)}
              />
            </div>

            <div>
              <label>Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              <label>Manual DN No:</label>
              <input
                value={manualNo}
                onChange={(e) => setManualNo(e.target.value)}
              />

              <label>Quotation:</label>
              <input
                value={quotation}
                onChange={(e) => setQuotation(e.target.value)}
              />

              <label>Remarks:</label>
              <input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Items Table */}
          <table className="challan-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Location</th>
                <th>Total</th>
                <th>
                  <FaPlus onClick={addItem} style={{ cursor: "pointer" }} />
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>
                    <input
                      value={item.itemCode}
                      onChange={(e) =>
                        handleItemChange(i, "itemCode", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={item.itemName}
                      onChange={(e) =>
                        handleItemChange(i, "itemName", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(i, "description", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        handleItemChange(i, "qty", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(i, "price", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={item.unit}
                      onChange={(e) =>
                        handleItemChange(i, "unit", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={item.location}
                      onChange={(e) =>
                        handleItemChange(i, "location", e.target.value)
                      }
                    />
                  </td>
                  <td>{item.total.toFixed(2)}</td>
                  <td>
                    <FaTrash
                      onClick={() => removeItem(i)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="challan-footer">
            <span>Total Qty: {items.reduce((sum, i) => sum + i.qty, 0)}</span>
            <span>
              Total: AED {items.reduce((sum, i) => sum + i.total, 0).toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="challan-actions">
            <button
              type="button"
              className="challan-list-button"
              onClick={() => navigate("/sales/delivery/list")}
            >
              📋 Challan List
            </button>
            <button type="submit" className="save-btn">
              <FaSave /> Save
            </button>
            <button
              type="button"
              className="print-btn"
              onClick={() => window.print()}
            >
              <FaPrint /> Print
            </button>
            <button type="button" className="close-btn" onClick={onClose}>
              <FaTimes /> X
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryChallanForm;
