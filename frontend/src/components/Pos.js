// src/components/Pos.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_ORIGIN } from "../api/axios";

import "./Pos.css";
import "./ViewSales.css";

import { FaWindowMinimize, FaTimes, FaPowerOff, FaCog, FaCalculator } from "react-icons/fa";
import homeIcon from "../assets/Home.png";

import PoleScalePrint from "./PoleScalePrint";
import SalesTypeModal from "./SalesTypeModal";
import QuantityModal from "./QuantityModal";
import PriceModal from "./PriceModal";
import PosCustomerModal from "./PosCustomerModal";
import HoldModal from "./HoldModal";
import Options from "./Options";
import ProductListModal from "./ProductListModal";
import ProductForm from "./ProductForm";
import ViewSales from "./ViewSales";
import ReturnModal from "./ReturnModal";
import Remove from "./Remove";
import LogoutModal from "./LogoutModal";
import ExitModal from "./ExitModal";
import CalculatorModal from "./CalculatorModal";
import PosThermalPrint from "./PosThermalPrint";
import Payment from "./Payment";

/* -------------------- constants & helpers -------------------- */
const API = {
  PRODUCTS: "/products",
  SALES: "/sales",
  HOLDS: "/pos/holds",
  RETURNS: "/return",
  CASH_DRAWER: "/devices/cashdrawer/open",
};

const GRID_COLS = "60px 1.7fr 80px 80px 110px 90px 120px 120px";

const toN = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const r2 = (v) => Number((toN(v) || 0).toFixed(2));
const uuid =
  () =>
    (typeof window !== "undefined" && window.crypto?.randomUUID?.()) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const isPoleScaleBarcode = (barcode = "") => barcode.startsWith("28") && barcode.length === 13;

function calcTotals(items, discountValue, discountMode, manualTax) {
  let subTotal = 0;
  let tax = 0;

  for (const it of items) {
    const qty = toN(it.quantity || 1);
    subTotal += toN(it.price) * qty;
    tax += toN(it.tax) * qty;
  }

  const usedTax = toN(manualTax) > 0 ? toN(manualTax) : tax;
  const beforeDiscount = subTotal + usedTax;
  const discountAmt =
    discountMode === "percent"
      ? (toN(discountValue) / 100) * beforeDiscount
      : Math.min(toN(discountValue), beforeDiscount);

  return {
    subTotal: r2(subTotal),
    vat: r2(usedTax),
    discountAmt: r2(discountAmt),
    total: r2(beforeDiscount - discountAmt),
  };
}

// image helper (absolute/relative/data)
const getImageSrc = (p) => {
  const raw =
    [p.imageUrl, p.photo, p.thumbnail, p.image, p.img, p.picture, p.imageBase64].find(Boolean) || "";
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s) || s.startsWith("data:image")) return s;
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  if (s.startsWith("uploads/")) return `${API_ORIGIN}/${s}`;
  return s;
};

/* ============================= Component ============================= */
export default function Pos() {
  const navigate = useNavigate();

  /* ---------- header/time ---------- */
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  /* ---------- cart ---------- */
  const [itemList, setItemList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [saleType, setSaleType] = useState(() => localStorage.getItem("saleType") || "RETAIL");

  /* ---------- modals visibility ---------- */
  const [showSaleType, setShowSaleType] = useState(false);
  const [showQuantity, setShowQuantity] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showViewSales, setShowViewSales] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showLineClear, setShowLineClear] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  /* ---------- printing overlays ---------- */
  const [showPosInvoice, setShowPosInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showPoleLabel, setShowPoleLabel] = useState(false);
  const [poleLabelData, setPoleLabelData] = useState(null);

  /* ---------- product form state ---------- */
  const [formMode, setFormMode] = useState("add");
  const [selectedProduct, setSelectedProduct] = useState(null);

  /* ---------- customer ---------- */
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");

  /* ---------- keypad/inputs ---------- */
  const [keyboardInputs, setKeyboardInputs] = useState({
    barcode: "",
    discount: "",
    paid: "",
    tax: "",
    change: "",
    subTotal: "0.00",
    total: "0.00",
  });
  const [discountMode, setDiscountMode] = useState("percent");

  /* ---------- quick items ---------- */
  const [quickProducts, setQuickProducts] = useState([]);
  const [quickSearch, setQuickSearch] = useState("");

  /* ---------- payment modal ---------- */
  const [payOpen, setPayOpen] = useState(false);
  const [payMode, setPayMode] = useState("card-print");

  /* ---------- refs ---------- */
  const barcodeRef = useRef(null);
  const discountRef = useRef(null);
  const paidRef = useRef(null);
  const quickTilesRef = useRef(null);

  /* -------------------- handlers -------------------- */
  const handleMinimize = () => setIsMinimized((p) => !p);
  const handleSettingsClick = () => navigate("/dashboard");
  const handleLogoutConfirm = () => {
    setShowLogout(false);
    window.location.href = "/";
  };

  const resetPos = useCallback(() => {
    setItemList([]);
    setSelectedIndex(null);
    setCustomerId("");
    setCustomerName("");
    setKeyboardInputs({
      barcode: "",
      discount: "",
      paid: "",
      tax: "",
      change: "",
      subTotal: "0.00",
      total: "0.00",
    });
  }, []);

  const removeSelectedLine = useCallback(() => {
    if (selectedIndex === null) return null;
    const updated = [...itemList];
    const line = updated[selectedIndex];
    updated.splice(selectedIndex, 1);
    setItemList(updated);
    setSelectedIndex(null);
    return line;
  }, [itemList, selectedIndex]);

  const priceFor = useCallback(
    (p) => {
      const retail = toN(p.retail ?? p.price ?? 0);
      const wholesale = toN(p.wholesale ?? p.wsRate ?? retail);
      return saleType === "WHOLESALE" ? wholesale : retail;
    },
    [saleType]
  );

  const cartTotal = useMemo(() => {
    const { total } = calcTotals(itemList, keyboardInputs.discount, discountMode, toN(keyboardInputs.tax));
    return total;
  }, [itemList, keyboardInputs.discount, keyboardInputs.tax, discountMode]);

  const buildSalePayload = useCallback(
    (payTypeArg) => {
      const { subTotal, vat, discountAmt, total } = calcTotals(
        itemList,
        keyboardInputs.discount,
        discountMode,
        toN(keyboardInputs.tax)
      );

      const items = itemList.map((it) => ({
        productId: (it.id ?? "").toString(),
        productCode: it.code || "",
        name: it.name,
        nameAr: it.nameAr,
        unit: it.unit,
        qty: toN(it.quantity || 1),
        unitPrice: toN(it.price),
        vatPercent: 5,
        amount: r2(toN(it.price) * toN(it.quantity || 1)),
        vat: r2(toN(it.tax) * toN(it.quantity || 1)),
      }));

      return {
        date: new Date().toISOString(),
        shift: "A",
        cashier: "Admin",
        customerId,
        customerName,
        saleType,
        grossTotal: subTotal,
        discount: discountAmt,
        vat,
        netTotal: total,
        paymentType: (payTypeArg || "cash").toUpperCase(),
        returnAmount: 0,
        items,
      };
    },
    [itemList, keyboardInputs.discount, keyboardInputs.tax, discountMode, customerId, customerName, saleType]
  );

  const saveSale = useCallback(
    async (payTypeArg) => {
      const payload = buildSalePayload(payTypeArg);
      const { data } = await api.post(API.SALES, payload);
      return data;
    },
    [buildSalePayload]
  );

  const buildHoldPayload = useCallback(() => {
    const subTotal = itemList.reduce((s, it) => s + toN(it.price) * toN(it.quantity || 1), 0);
    const tax = itemList.reduce((s, it) => s + toN(it.tax) * toN(it.quantity || 1), 0);
    const netAmount = subTotal + tax;

    return {
      date: new Date().toISOString(),
      serialNo: `HOLD-${Date.now()}`,
      customer: customerName ? { id: customerId, name: customerName } : null,
      items: itemList.map((it) => ({
        barcode: it.barcode || it.code || "",
        code: it.code || "",
        name: it.name,
        nameAr: it.nameAr,
        unit: it.unit,
        qty: toN(it.qty || it.quantity || 1),
        price: toN(it.price),
        tax: toN(it.tax),
        total: toN(it.total),
      })),
      subTotal: r2(subTotal),
      tax: r2(tax),
      netAmount: r2(netAmount),
    };
  }, [itemList, customerId, customerName]);

  const saveHold = useCallback(async () => {
    if (!itemList.length) {
      alert("No items to hold.");
      return;
    }
    try {
      await api.post(API.HOLDS, buildHoldPayload());
      resetPos();
      alert("🟢 Bill moved to HOLD.");
    } catch (e) {
      console.error("HOLD save failed:", e?.response?.data || e.message);
      alert(`Hold failed: ${e?.response?.data?.message || e.message}`);
    }
  }, [itemList, buildHoldPayload, resetPos]);

  const recallHold = useCallback(async (hold) => {
    const items = (hold?.items || []).map((it) => ({
      id: uuid(),
      code: it.code,
      name: it.name,
      nameAr: it.nameAr,
      unit: it.unit,
      quantity: toN(it.qty || it.quantity || 1),
      price: toN(it.price || 0),
      tax: toN(it.tax || 0),
      total: toN(it.total || 0),
    }));
    setItemList(items);
    setCustomerId(hold?.customer?.id || "");
    setCustomerName(hold?.customer?.name || "");
    setShowHoldModal(false);

    const id = hold?.id || hold?._id;
    if (id) {
      try {
        await api.delete(`${API.HOLDS}/${id}`);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const openCashDrawer = useCallback(async (silent = false) => {
    try {
      await api.post(API.CASH_DRAWER);
    } catch (e) {
      console.warn("Drawer API not reachable:", e?.message);
    } finally {
      if (!silent) alert("🟢 Drawer trigger sent");
    }
  }, []);

  /* -------------------- PRINT: mutual exclusivity + afterprint auto-close -------------------- */
  useEffect(() => {
    const onAfter = () => {
      setShowPosInvoice(false);
      setShowPoleLabel(false);
    };
    window.addEventListener("afterprint", onAfter);
    return () => window.removeEventListener("afterprint", onAfter);
  }, []);

  const openPoleLabel = useCallback((payload) => {
    setInvoiceData(null);
    setShowPosInvoice(false);
    setPoleLabelData(payload);
    setShowPoleLabel(true);
  }, []);

  const closePrints = useCallback(() => {
    setShowPosInvoice(false);
    setShowPoleLabel(false);
  }, []);

  /* CASH quick pay + Save & Print */
  const handlePrintInvoice = useCallback(
    async (paidAmount, method) => {
      const payType = (method || "cash").toLowerCase();
      const { subTotal, vat, discountAmt, total } = calcTotals(
        itemList,
        keyboardInputs.discount,
        discountMode,
        toN(keyboardInputs.tax)
      );
      const paid = toN(paidAmount ?? 0);
      if (payType === "cash" && paid < total) {
        alert(`Cash sale requires full amount. Paid ${paid.toFixed(2)} < Total ${total.toFixed(2)}.`);
        return;
      }

      let saved = null;
      try {
        saved = await saveSale(payType);
      } catch (err) {
        console.warn("Sale save failed, printing DRAFT instead:", err?.message);
      }

      const balance = Math.max(total - paid, 0);
      const change = Math.max(paid - total, 0);

      setInvoiceData({
        invoiceNo: saved?.id || `DRAFT-${Date.now()}`,
        date: currentDate,
        time: currentTime,
        cashier: "Admin",
        items: itemList,
        subTotal,
        discount: discountAmt,
        tax: vat,
        total,
        paid,
        balance: r2(balance),
        change: r2(change),
        paymentMethod: payType,
        shopName: "JABAL AL RAHMAH GROCERY L.L.C",
        address: "RAS AL KHOR DUBAI UAE",
        phone: "0569304466",
        footerNote: "Thank you! Visit Again.",
        saleType,
      });

      setShowPoleLabel(false);
      setShowPosInvoice(true);

      if (payType === "cash") openCashDrawer(true);
      resetPos();
    },
    [
      itemList,
      keyboardInputs.discount,
      keyboardInputs.tax,
      discountMode,
      currentDate,
      currentTime,
      saleType,
      saveSale,
      openCashDrawer,
      resetPos,
    ]
  );

  /* CARD/CREDIT via Payment modal */
  const commitSale = useCallback(
    async (payTypeArg) => {
      try {
        await saveSale(payTypeArg || "cash");
        alert("✅ Sale saved.");
        resetPos();
      } catch (e) {
        console.error(e);
        alert("Save failed (server unreachable).");
      }
    },
    [saveSale, resetPos]
  );

  const quickPay = useCallback(() => {
    handlePrintInvoice(toN(keyboardInputs.total || 0), "cash");
  }, [keyboardInputs.total, handlePrintInvoice]);

  const cardPay = useCallback(() => {
    closePrints();
    setPayMode("card-print");
    setPayOpen(true);
  }, [closePrints]);

  const cardPayNoPrint = useCallback(() => {
    closePrints();
    setPayMode("card-noprint");
    setPayOpen(true);
  }, [closePrints]);

  const creditSale = useCallback(() => {
    closePrints();
    setPayMode("credit");
    setPayOpen(true);
  }, [closePrints]);

  const onPaymentSuccess = useCallback(
    (savedSale, { print, method }) => {
      const { subTotal, vat, discountAmt, total } = calcTotals(
        itemList,
        keyboardInputs.discount,
        discountMode,
        toN(keyboardInputs.tax)
      );

      setInvoiceData({
        invoiceNo: savedSale?.id || `DRAFT-${Date.now()}`,
        date: currentDate,
        time: currentTime,
        cashier: "Admin",
        items: itemList,
        subTotal,
        discount: discountAmt,
        tax: vat,
        total,
        paid: total,
        balance: 0,
        change: 0,
        paymentMethod: method,
        shopName: "JABAL AL RAHMAH GROCERY L.L.C",
        address: "RAS AL KHOR DUBAI UAE",
        phone: "0569304466",
        footerNote: "Thank you! Visit Again.",
        saleType,
      });

      setPayOpen(false);
      resetPos();

      if (print && method === "card") {
        setShowPoleLabel(false);
        setShowPosInvoice(true);
      }
    },
    [
      itemList,
      keyboardInputs.discount,
      keyboardInputs.tax,
      discountMode,
      currentDate,
      currentTime,
      saleType,
      resetPos,
    ]
  );

  /* -------------------- barcode / add to cart -------------------- */
  const addItemToCart = useCallback(
    (product) => {
      const quantity = product.quantity || 1;
      const price = priceFor(product);
      const tax = r2(price * 0.05);
      const total = r2((price + tax) * quantity);

      setItemList((prev) => [
        ...prev,
        {
          id: Date.now(),
          code: product.code,
          name: product.itemNameEn || product.name,
          nameAr: product.itemNameAr || product.nameAr || "",
          unit: product.unit,
          quantity,
          price,
          tax,
          total,
        },
      ]);
    },
    [priceFor]
  );

  const handleBarcodeEntry = useCallback(
    async (value) => {
      try {
        const { data: products } = await api.get(API.PRODUCTS);
        const v = (value || "").trim();
        if (!v) return;

        if (isPoleScaleBarcode(v)) {
          const priceOrWeight = parseFloat(v.substring(2, 7)) / 100;
          const productCode = v.substring(7, 12);
          const found = products.find((p) => p.productCode === productCode || p.code === productCode);
          if (found) {
            const weightKg = priceOrWeight;
            openPoleLabel({
              shopName: "SuperMart UAE",
              shopNameAr: "سوبر ماركت الإمارات",
              itemNameEn: found.name,
              itemNameAr: found.nameAr,
              packedDate: currentDate,
              saleTime: currentTime,
              unitPrice: priceFor(found),
              weight: weightKg,
              expiryDate: "",
              barcode: v,
              totalPrice: (weightKg * priceFor(found)).toFixed(2),
            });
            addItemToCart({ ...found, retail: priceFor(found), quantity: weightKg });
          }
          return;
        }

        const found = products.find((p) => p.barcode === v || p.code === v || p.productCode === v);
        if (found) addItemToCart(found);
        else alert("Matching product not found");
      } catch (error) {
        console.error("Error fetching products:", error);
        alert("Error reading product details");
      } finally {
        setKeyboardInputs((p) => ({ ...p, barcode: "" }));
      }
    },
    [currentDate, currentTime, addItemToCart, openPoleLabel, priceFor]
  );

  /* -------------------- effects -------------------- */
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("en-GB"));
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: products } = await api.get(API.PRODUCTS);
        const allowedCats = new Set(["Vegetables", "Fruits", "Grocery", "Baqala"]);
        const hasImg = (p) => !!getImageSrc(p);
        const direct = (products || []).filter(
          (p) =>
            (p.directSale === true || p.directSaleItem === true) &&
            (allowedCats.has(p.category) ||
              allowedCats.has(p.categoryName) ||
              allowedCats.has(p.categoryNameEn)) &&
            hasImg(p)
        );
        const base = direct.length ? direct : (products || []).filter(hasImg);
        const list = base
          .slice(0, 100)
          .sort((a, b) => (a.name || a.itemNameEn || "").localeCompare(b.name || b.itemNameEn || ""));
        setQuickProducts(list);
      } catch {
        setQuickProducts([]);
      }
    })();
  }, []);

  useEffect(() => {
    const keys = new Set([
      "F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","Escape","Enter","d","D"
    ]);
    const onKey = (e) => {
      if (!keys.has(e.key)) return;
      e.preventDefault();
      switch (e.key) {
        case "F1":  closePrints(); setShowProductList(true); break;
        case "F2":  setShowRemoveModal(true); break;
        case "F3":  closePrints(); setShowViewSales(true); break;
        case "F4":  saveHold(); break;
        case "F5":  closePrints(); setShowHoldModal(true); break;
        case "F6":  cardPay(); break;
        case "F7":  cardPayNoPrint(); break;
        case "F8":  creditSale(); break;
        case "F9":  commitSale(); break;
        case "F10": discountRef.current?.focus(); break;
        case "F11": setShowReturn(true); break;
        case "F12": setShowOptions(true); break;
        case "d":
        case "D":
          if (e.ctrlKey) {
            setDiscountMode((m) => (m === "percent" ? "amount" : "percent"));
            discountRef.current?.focus();
          }
          break;
        case "Escape": setShowExit(true); break;
        case "Enter":
          if (document.activeElement === barcodeRef.current) {
            const v = (keyboardInputs.barcode || "").trim();
            if (v) handleBarcodeEntry(v);
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    keyboardInputs.barcode,
    handleBarcodeEntry,
    cardPay,
    cardPayNoPrint,
    creditSale,
    commitSale,
    saveHold,
    closePrints,
  ]);

  useEffect(() => {
    const { subTotal, total } = calcTotals(
      itemList,
      keyboardInputs.discount,
      discountMode,
      toN(keyboardInputs.tax)
    );
    const paid = toN(keyboardInputs.paid);
    const change = Math.max(paid - total, 0);
    setKeyboardInputs((p) => ({
      ...p,
      subTotal: subTotal.toFixed(2),
      total: total.toFixed(2),
      change: change.toFixed(2),
    }));
  }, [itemList, keyboardInputs.discount, keyboardInputs.paid, keyboardInputs.tax, discountMode]);

  /* -------------------- quick tiles scroll -------------------- */
  const scrollQuickTiles = useCallback((delta) => {
    const el = quickTilesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollTop + delta, behavior: "smooth" });
  }, []);

  const filteredQuick = useMemo(() => {
    const q = (quickSearch || "").toLowerCase();
    return quickProducts.filter((p) => {
      const en = (p.name || p.itemNameEn || "").toLowerCase();
      const ar = (p.nameAr || p.itemNameAr || "").toLowerCase();
      return en.includes(q) || ar.includes(q);
    });
  }, [quickProducts, quickSearch]);

  /* ============================= UI ============================= */
  return (
    <div className={`pos-container ${isMinimized ? "minimized" : ""}`}>
      {/* Header */}
      <div className="pos-header">
        <div className="header-left">
          <img src={homeIcon} alt="Home" className="home-icon" onClick={() => navigate("/dashboard")} />
          <span className="top-title">SALES</span>
        </div>
        <div className="header-center">
          <span>{currentTime}</span>
          <span>{currentDate}</span>
          <span>Admin</span>
          <span>Main</span>
          <span style={{ fontWeight: 700, color: "#ffd54f" }}>{saleType}</span>
        </div>
        <div className="header-right">
          {/* Round white calculator badge (fills the empty circle) */}
          <button
            className="icon-round"
            title="Calculator"
            aria-label="Calculator"
            onClick={() => setShowCalc(true)}
          >
            <FaCalculator size={14} />
          </button>
          <FaCog
            onClick={handleSettingsClick}
            title="Settings"
            style={{ cursor: "pointer", fontSize: 20, color: "white", marginRight: 10 }}
          />
          <FaWindowMinimize
            onClick={handleMinimize}
            title="Minimize"
            style={{ cursor: "pointer", fontSize: 20, color: "white", marginRight: 10 }}
          />
          <FaPowerOff onClick={() => setShowLogout(true)} style={{ cursor: "pointer" }} />
          <FaTimes onClick={() => setShowExit(true)} />
        </div>
      </div>

      {/* Main */}
      <div className="pos-main">
        {/* Left */}
        <div className="pos-left">
          <input
            ref={barcodeRef}
            type="text"
            name="barcode"
            placeholder="Scan or Type Barcode"
            className="barcode-input"
            value={keyboardInputs.barcode || ""}
            onChange={(e) => setKeyboardInputs((p) => ({ ...p, barcode: e.target.value }))}
          />

          <div className="item-block">
            {/* aligned grid headers/rows */}
            <div className="item-table-header" style={{ display: "grid", gridTemplateColumns: GRID_COLS, gap: 6 }}>
              <span>No</span>
              <span>Item (EN/AR)</span>
              <span>Unit</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Tax</span>
              <span>Full Price</span>
              <span>Total</span>
            </div>

            <div className="item-list">
              {itemList.map((it, i) => (
                <div
                  key={it.id || `${it.code}-${i}`}
                  className={`item-row ${selectedIndex === i ? "selected" : ""}`}
                  style={{ display: "grid", gridTemplateColumns: GRID_COLS, gap: 6 }}
                  onClick={() => setSelectedIndex(i)}
                >
                  <span>{i + 1}</span>
                  <span>
                    {it.name} / {it.nameAr}
                  </span>
                  <span>{it.unit}</span>
                  <span>{it.quantity}</span>
                  <span>{toN(it.price).toFixed(2)}</span>
                  <span>{toN(it.tax).toFixed(2)}</span>
                  <span>{(toN(it.price) + toN(it.tax)).toFixed(2)}</span>
                  <span>{toN(it.total).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="totals-bar">
              <div className="total-field">
                <label>Sub Total</label>
                <input type="text" readOnly value={keyboardInputs.subTotal || "0.00"} />
              </div>

              <div className="total-field">
                <label>Discount ({discountMode === "percent" ? "%" : "AED"})</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    ref={discountRef}
                    type="number"
                    value={keyboardInputs.discount || ""}
                    onChange={(e) => setKeyboardInputs((p) => ({ ...p, discount: e.target.value }))}
                    style={{ width: 100 }}
                  />
                  <button
                    type="button"
                    onClick={() => setDiscountMode((m) => (m === "percent" ? "amount" : "percent"))}
                    title="Toggle % / AED"
                  >
                    {discountMode === "percent" ? " AED" : " %"}
                  </button>
                </div>
              </div>

              <div className="total-field">
                <label>Tax</label>
                <input
                  type="number"
                  value={keyboardInputs.tax || ""}
                  onChange={(e) => setKeyboardInputs((p) => ({ ...p, tax: e.target.value }))}
                />
              </div>

              <div className="total-field total-highlight">
                <label>Total</label>
                <input type="text" readOnly value={keyboardInputs.total || "0.00"} />
              </div>

              <div className="total-field">
                <label>Paid</label>
                <input
                  ref={paidRef}
                  type="number"
                  value={keyboardInputs.paid || ""}
                  onChange={(e) => setKeyboardInputs((p) => ({ ...p, paid: e.target.value }))}
                />
              </div>

              <div className="total-field change-highlight">
                <label>Change</label>
                <input type="text" readOnly value={keyboardInputs.change || "0.00"} />
              </div>
            </div>
          </div>

          {/* Function Keys */}
          <div className="function-keys">
            <button onClick={() => { closePrints(); setShowProductList(true); }}>F1 Product</button>
            <button onClick={() => setShowRemoveModal(true)}>F2 Clear All</button>
            <button onClick={() => { closePrints(); setShowViewSales(true); }}>F3 View</button>
            <button onClick={saveHold}>F4 Hold</button>
            <button className="green" onClick={() => openCashDrawer(false)}>Open Drawer</button>
            <button onClick={() => { closePrints(); setShowHoldModal(true); }}>F5 Recall</button>
            <button onClick={cardPay}>F6 Card Pay</button>
            <button onClick={cardPayNoPrint}>F7 Card w/o Print</button>
            <button onClick={creditSale}>F8 Credit</button>
            <button className="green" onClick={quickPay}>Quick Pay</button>
            <button onClick={() => commitSale()}>F9 Commit</button>
            <button onClick={() => discountRef.current?.focus()}>F10 Discount</button>
            <button onClick={() => setShowReturn(true)}>F11 Return</button>
            <button onClick={() => setShowOptions(true)}>F12 Options</button>
            <button
              className="green"
              onClick={() => handlePrintInvoice(toN(keyboardInputs.paid || keyboardInputs.total || 0), "cash")}
            >
              Save & Print
            </button>
          </div>
          {/* End Left */}
        </div>

        {/* Right */}
        <div className="pos-right">
          <div className="quick-fields">
            <button onClick={() => { closePrints(); setShowCustomer(true); }}>Customer</button>
            <button onClick={() => setShowSaleType(true)}>Sales Type</button>
            <button onClick={() => setShowQuantity(true)}>Quantity</button>
            <button onClick={() => setShowPrice(true)}>Price</button>
            <button
              className="clear-button"
              onClick={() =>
                (selectedIndex === null ? alert("Select an item row to clear.") : setShowLineClear(true))
              }
            >
              Delete
            </button>
          </div>

          <input
            className="right-search"
            placeholder="Search quick items…"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, minHeight: 0 }}>
            <div ref={quickTilesRef} className="quick-tiles" style={{ maxHeight: 480, overflowY: "auto" }}>
              {filteredQuick.length === 0 ? (
                <div className="quick-empty">
                  <div className="quick-empty-title">No Direct Sale items found.</div>
                  <div className="quick-empty-sub">Mark products with “Direct Sale Item”.</div>
                </div>
              ) : (
                filteredQuick.map((p) => {
                  const src = getImageSrc(p);
                  return (
                    <button
                      type="button"
                      key={p.id || p._id || p.code}
                      className="quick-tile"
                      title={p.name || p.itemNameEn}
                      onClick={() => addItemToCart(p)}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={p.name || p.itemNameEn}
                          className="quick-tile-img"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        <div className="tile-fallback">
                          {(p.name || p.itemNameEn || "P").charAt(0)}
                        </div>
                      )}
                      <div className="tile-label">{p.name || p.itemNameEn}</div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="scroll-stick" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button className="scrollbar-btn" aria-label="Scroll up" onClick={() => scrollQuickTiles(-260)}>
                ▲
              </button>
              <button className="scrollbar-btn" aria-label="Scroll down" onClick={() => scrollQuickTiles(260)}>
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --------- Modals --------- */}
      {showSaleType && (
        <SalesTypeModal
          isOpen={showSaleType}
          defaultType={saleType}
          onSelect={(t) => {
            setSaleType(t);
            localStorage.setItem("saleType", t);
            setShowSaleType(false);
          }}
          onClose={() => setShowSaleType(false)}
        />
      )}

      <CalculatorModal open={showCalc} onClose={() => setShowCalc(false)} />

      {showQuantity && (
        <QuantityModal
          onClose={() => setShowQuantity(false)}
          onSubmit={(newQty) => {
            if (selectedIndex !== null) {
              const updated = [...itemList];
              const it = updated[selectedIndex];
              const newTax = r2(toN(it.price) * 0.05);
              const newTotal = r2((toN(it.price) + newTax) * toN(newQty));
              updated[selectedIndex] = { ...it, quantity: newQty, tax: newTax, total: newTotal };
              setItemList(updated);
            }
            setShowQuantity(false);
          }}
        />
      )}

      {showPrice && (
        <PriceModal
          onClose={() => setShowPrice(false)}
          onSave={({ price, tax, fullPrice }) => {
            if (selectedIndex !== null) {
              const updated = [...itemList];
              const it = updated[selectedIndex];
              updated[selectedIndex] = {
                ...it,
                price: toN(price),
                tax: toN(tax),
                total: r2(toN(fullPrice) * toN(it.quantity)),
              };
              setItemList(updated);
            }
            setShowPrice(false);
          }}
        />
      )}

      {showCustomer && (
        <PosCustomerModal
          onSelect={(cust) => {
            setCustomerId(cust?.id || cust?._id || "");
            setCustomerName(cust?.name || "");
            setShowCustomer(false);
          }}
          onClose={() => setShowCustomer(false)}
        />
      )}

      {showOptions && <Options onClose={() => setShowOptions(false)} />}

      {showProductList && (
        <ProductListModal
          onClose={() => setShowProductList(false)}
          onSelect={(product) => addItemToCart(product)}
          onAddNew={() => {
            setFormMode("add");
            setSelectedProduct(null);
            setShowProductList(false);
            setShowProductForm(true);
          }}
          onEdit={(product) => {
            setFormMode("edit");
            setSelectedProduct(product);
            setShowProductList(false);
            setShowProductForm(true);
          }}
        />
      )}

      {showProductForm && (
        <ProductForm
          onClose={() => setShowProductForm(false)}
          onSave={() => setShowProductForm(false)}
          mode={formMode}
          editData={selectedProduct}
        />
      )}

      {showViewSales && <ViewSales onClose={() => setShowViewSales(false)} />}

      {showReturn && (
        <ReturnModal
          onClose={() => setShowReturn(false)}
          onSubmit={async ({ approver }) => {
            if (selectedIndex === null) {
              alert("Select a line to return (click the item row).");
              return false;
            }
            const line = removeSelectedLine();
            if (!line) return false;
            try {
              await api.post(API.RETURNS, {
                saleId: null,
                customerId,
                customerName,
                reason: "POS line return",
                items: [
                  {
                    productId: (line.code || line.id || "").toString(),
                    name: line.name,
                    qty: toN(line.quantity || 1),
                    amount: r2(toN(line.price) * toN(line.quantity || 1)),
                  },
                ],
                approverId: approver?.id,
                approverName: approver?.fullName || approver?.username,
                approverUsername: approver?.username,
              });
            } catch (e) {
              console.warn("Return save failed (continuing):", e?.response?.data || e.message);
            }
            alert("Return recorded & item removed.");
            return true;
          }}
        />
      )}

      {showLineClear && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(0,0,0,.25)",
              width: 420,
              maxWidth: "90vw",
              padding: 20,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Confirm</div>
            <div style={{ color: "#333", marginBottom: 16 }}>Delete selected item?</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowLineClear(false)} style={{ padding: "8px 14px" }}>
                No
              </button>
              <button
                onClick={() => {
                  removeSelectedLine();
                  setShowLineClear(false);
                }}
                style={{ padding: "8px 14px", background: "#e53935", color: "#fff", borderRadius: 8 }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveModal && (
        <Remove
          onConfirm={() => {
            setItemList([]);
            setSelectedIndex(null);
            setShowRemoveModal(false);
          }}
          onCancel={() => setShowRemoveModal(false)}
        />
      )}

      <Payment
        open={payOpen}
        mode={payMode}
        total={Number.isFinite(Number(cartTotal)) ? Number(cartTotal) : 0}
        saleType={saleType}
        customer={customerId ? { id: customerId, name: customerName } : null}
        items={itemList}
        onClose={() => setPayOpen(false)}
        onSuccess={onPaymentSuccess}
      />

      {/* PRINT ROOT (exclusive) */}
      {showPosInvoice && !showPoleLabel && (
        <div id="print-section">
          <PosThermalPrint invoiceData={invoiceData} />
        </div>
      )}
      {showPoleLabel && !showPosInvoice && (
        <div id="print-section">
          <PoleScalePrint data={poleLabelData} />
        </div>
      )}

      {showHoldModal && <HoldModal onClose={() => setShowHoldModal(false)} onSelect={recallHold} />}

      <LogoutModal show={showLogout} onClose={() => setShowLogout(false)} onConfirm={handleLogoutConfirm} />

      <ExitModal show={showExit} onClose={() => setShowExit(false)} onConfirm={() => setShowExit(false)} />
      {/* To actually close a shell app, call window.close() in onConfirm */}
    </div>
  );
}
