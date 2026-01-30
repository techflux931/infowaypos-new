// src/components/tabs/GeneralTab.js
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import "./GeneralTab.css"; // optional

const DEFAULTS = {
  // column 1
  autoIncrementCustomerCode: false,
  showStockInSales: false,
  showCostInSales: false,
  showStockInPurchase: false,
  dotMatrixInvoicePrint: false,
  dotMatrixPrintFormat: "Format 1",
  invoiceFormat: "Format 1",
  quotationFormat: "Format 1",
  accountPostingMethod: "Single Entry",
  accountPurchaseItem: "",
  // column 2
  purchaseRateMode: "Last Rate",
  localBarcodeMethod: "Disable",
  barcodeAutoIncrement: false,
  barcodeGenerationMode: "By Quantity",
  enableIMEI2: false,
  enableIMEI3: false,
  enableIMEI4: false,
  barcodePrintInPurchase: false,
  barcodePrintAllFromPurchase: false,
  showSalePriceInPurchase: false,
  updateSalePriceFromPurchase: false,
  // column 3
  updateCostFromPurchase: false,
  expiryInPurchase: false,
  enableLogoAsTitle: false,
  enableColor: false,
  defaultSaleMode: "Cash",
  discountAllowedAccount: "",
  discountReceivedAccount: "",
  itemcodeInPurchase: false,
  descriptionInPurchase: false,
  purchaseAccInPurchase: false,
  locationInPurchase: false,
  projectInPurchase: false,
  // column 4
  sizeInPurchase: false,
  designInPurchase: false,
  slNoInPurchase: false,
  detailedBarcodePrint: false,
  priceInBarcode: false,
  costInBarcode: false,
  dockItemList: false,
  itemFilterInPurchase: false,
  barcodePrinter: "",
  itemListExportLocation: "",
  returnWithPurchase: false,
  masterLocationInSales: false,
};

export default function GeneralTab() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/settings/general"); // baseURL has /api
        if (mounted && data) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Failed to load general settings:", err);
        alert("❌ Failed to load general settings");
      } finally {
        mounted = false;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setField = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await api.put("/settings/general", settings);
      alert("✅ Settings updated successfully");
    } catch (e) {
      console.error(e);
      alert("❌ Failed to update settings");
    }
  };

  const handleClose = () => window.history.back();

  if (loading) {
    return <div className="general-tab-container">Loading…</div>;
  }

  return (
    <div className="general-tab-container">
      <h3>General Settings</h3>

      <div className="settings-columns">
        {/* Column 1 */}
        <div className="settings-column">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.autoIncrementCustomerCode}
              onChange={() =>
                setField(
                  "autoIncrementCustomerCode",
                  !settings.autoIncrementCustomerCode
                )
              }
            />
            <span>Customer code Auto increment</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.showStockInSales}
              onChange={() =>
                setField("showStockInSales", !settings.showStockInSales)
              }
            />
            <span>Show Stock in Sales</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.showCostInSales}
              onChange={() =>
                setField("showCostInSales", !settings.showCostInSales)
              }
            />
            <span>Show Cost in Sales</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.showStockInPurchase}
              onChange={() =>
                setField("showStockInPurchase", !settings.showStockInPurchase)
              }
            />
            <span>Show Stock in Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.dotMatrixInvoicePrint}
              onChange={() =>
                setField(
                  "dotMatrixInvoicePrint",
                  !settings.dotMatrixInvoicePrint
                )
              }
            />
            <span>DotMatrix Invoice Print</span>
          </label>

          <label>
            Dot Matrix Print Format
            <select
              value={settings.dotMatrixPrintFormat}
              onChange={(e) => setField("dotMatrixPrintFormat", e.target.value)}
            >
              <option value="Format 1">Format 1</option>
              <option value="Format 2">Format 2</option>
              <option value="Format 3">Format 3</option>
            </select>
          </label>

          <label>
            Invoice Print Format
            <select
              value={settings.invoiceFormat}
              onChange={(e) => setField("invoiceFormat", e.target.value)}
            >
              <option value="Format 1">Format 1</option>
              <option value="Format 2">Format 2</option>
              <option value="Format 3">Format 3</option>
            </select>
          </label>

          <label>
            Quotation Print Format
            <select
              value={settings.quotationFormat}
              onChange={(e) => setField("quotationFormat", e.target.value)}
            >
              <option value="Format 1">Format 1</option>
              <option value="Format 2">Format 2</option>
              <option value="Format 3">Format 3</option>
            </select>
          </label>

          <label>
            Account Posting Method
            <select
              value={settings.accountPostingMethod}
              onChange={(e) =>
                setField("accountPostingMethod", e.target.value)
              }
            >
              <option value="Single Entry">Single Entry</option>
              <option value="Double Entry">Double Entry</option>
            </select>
          </label>

          <label>
            Account Purchase Item
            <input
              type="text"
              placeholder="Enter account purchase item"
              value={settings.accountPurchaseItem}
              onChange={(e) => setField("accountPurchaseItem", e.target.value)}
            />
          </label>
        </div>

        {/* Column 2 */}
        <div className="settings-column">
          <label>
            Purchase Rate
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="purchaseRate"
                  checked={settings.purchaseRateMode === "Last Rate"}
                  onChange={() => setField("purchaseRateMode", "Last Rate")}
                />
                Last Purchase Rate
              </label>
              <label>
                <input
                  type="radio"
                  name="purchaseRate"
                  checked={settings.purchaseRateMode === "Base Cost"}
                  onChange={() => setField("purchaseRateMode", "Base Cost")}
                />
                Base Cost
              </label>
            </div>
          </label>

          <label>
            Local Barcode Methode
            <select
              value={settings.localBarcodeMethod}
              onChange={(e) => setField("localBarcodeMethod", e.target.value)}
            >
              <option value="Disable">Disable</option>
              <option value="Enable">Enable</option>
            </select>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.barcodeAutoIncrement}
              onChange={() =>
                setField("barcodeAutoIncrement", !settings.barcodeAutoIncrement)
              }
            />
            <span>Local Barcode Auto increment</span>
          </label>

          <label>
            Local Barcode Generate Methode
            <select
              value={settings.barcodeGenerationMode}
              onChange={(e) =>
                setField("barcodeGenerationMode", e.target.value)
              }
            >
              <option value="By Quantity">By Quantity</option>
              <option value="Fixed">Fixed</option>
            </select>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.enableIMEI2}
              onChange={() => setField("enableIMEI2", !settings.enableIMEI2)}
            />
            <span>Enable IMEI 2</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.enableIMEI3}
              onChange={() => setField("enableIMEI3", !settings.enableIMEI3)}
            />
            <span>Enable IMEI 3</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.enableIMEI4}
              onChange={() => setField("enableIMEI4", !settings.enableIMEI4)}
            />
            <span>Enable IMEI 4</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.barcodePrintInPurchase}
              onChange={() =>
                setField(
                  "barcodePrintInPurchase",
                  !settings.barcodePrintInPurchase
                )
              }
            />
            <span>Barcode print in Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.barcodePrintAllFromPurchase}
              onChange={() =>
                setField(
                  "barcodePrintAllFromPurchase",
                  !settings.barcodePrintAllFromPurchase
                )
              }
            />
            <span>Barcode print All from Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.showSalePriceInPurchase}
              onChange={() =>
                setField(
                  "showSalePriceInPurchase",
                  !settings.showSalePriceInPurchase
                )
              }
            />
            <span>Show SalePrice in purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.updateSalePriceFromPurchase}
              onChange={() =>
                setField(
                  "updateSalePriceFromPurchase",
                  !settings.updateSalePriceFromPurchase
                )
              }
            />
            <span>Update Sale Price from Purchase</span>
          </label>
        </div>

        {/* Column 3 */}
        <div className="settings-column">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.updateCostFromPurchase}
              onChange={() =>
                setField(
                  "updateCostFromPurchase",
                  !settings.updateCostFromPurchase
                )
              }
            />
            <span>Update Cost from Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.expiryInPurchase}
              onChange={() =>
                setField("expiryInPurchase", !settings.expiryInPurchase)
              }
            />
            <span>Expiry in Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.enableLogoAsTitle}
              onChange={() =>
                setField("enableLogoAsTitle", !settings.enableLogoAsTitle)
              }
            />
            <span>Logo as Title image</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.enableColor}
              onChange={() => setField("enableColor", !settings.enableColor)}
            />
            <span>Enable Color</span>
          </label>

          <label className="radio-label">
            Default Sale Mode
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="defaultSaleMode"
                  checked={settings.defaultSaleMode === "Cash"}
                  onChange={() => setField("defaultSaleMode", "Cash")}
                />
                Cash
              </label>
              <label>
                <input
                  type="radio"
                  name="defaultSaleMode"
                  checked={settings.defaultSaleMode === "Credit"}
                  onChange={() => setField("defaultSaleMode", "Credit")}
                />
                Credit
              </label>
            </div>
          </label>

          <label>
            Discount Allowed
            <select
              value={settings.discountAllowedAccount}
              onChange={(e) =>
                setField("discountAllowedAccount", e.target.value)
              }
            >
              <option value="">Select Discount Allowed</option>
              <option value="DISCOUNT ALLOWED">DISCOUNT ALLOWED</option>
            </select>
          </label>

          <label>
            Discount Received
            <select
              value={settings.discountReceivedAccount}
              onChange={(e) =>
                setField("discountReceivedAccount", e.target.value)
              }
            >
              <option value="">Select Discount Received</option>
              <option value="DISCOUNT RECEIVED">DISCOUNT RECEIVED</option>
            </select>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.itemcodeInPurchase}
              onChange={() =>
                setField("itemcodeInPurchase", !settings.itemcodeInPurchase)
              }
            />
            <span>Itemcode in Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.descriptionInPurchase}
              onChange={() =>
                setField(
                  "descriptionInPurchase",
                  !settings.descriptionInPurchase
                )
              }
            />
            <span>Description in Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.purchaseAccInPurchase}
              onChange={() =>
                setField(
                  "purchaseAccInPurchase",
                  !settings.purchaseAccInPurchase
                )
              }
            />
            <span>Purchase Acc in Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.locationInPurchase}
              onChange={() =>
                setField("locationInPurchase", !settings.locationInPurchase)
              }
            />
            <span>Location in Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.projectInPurchase}
              onChange={() =>
                setField("projectInPurchase", !settings.projectInPurchase)
              }
            />
            <span>Project in Purchase</span>
          </label>
        </div>

        {/* Column 4 */}
        <div className="settings-column">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.sizeInPurchase}
              onChange={() =>
                setField("sizeInPurchase", !settings.sizeInPurchase)
              }
            />
            <span>Size in Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.designInPurchase}
              onChange={() =>
                setField("designInPurchase", !settings.designInPurchase)
              }
            />
            <span>Design in Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.slNoInPurchase}
              onChange={() =>
                setField("slNoInPurchase", !settings.slNoInPurchase)
              }
            />
            <span>SL No in Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.detailedBarcodePrint}
              onChange={() =>
                setField("detailedBarcodePrint", !settings.detailedBarcodePrint)
              }
            />
            <span>Detailed Barcode Print</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.priceInBarcode}
              onChange={() =>
                setField("priceInBarcode", !settings.priceInBarcode)
              }
            />
            <span>Price In Barcode</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.costInBarcode}
              onChange={() => setField("costInBarcode", !settings.costInBarcode)}
            />
            <span>Cost In Barcode</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.dockItemList}
              onChange={() => setField("dockItemList", !settings.dockItemList)}
            />
            <span>Dock Item List</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.itemFilterInPurchase}
              onChange={() =>
                setField(
                  "itemFilterInPurchase",
                  !settings.itemFilterInPurchase
                )
              }
            />
            <span>Item Filter(2) in Purchase</span>
          </label>

          <label>
            Barcode Printer
            <input
              type="text"
              placeholder="Enter barcode printer"
              value={settings.barcodePrinter}
              onChange={(e) => setField("barcodePrinter", e.target.value)}
            />
          </label>

          <label>
            Item List Export Location
            <input
              type="text"
              placeholder="Enter item list export location"
              value={settings.itemListExportLocation}
              onChange={(e) =>
                setField("itemListExportLocation", e.target.value)
              }
            />
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.returnWithPurchase}
              onChange={() =>
                setField("returnWithPurchase", !settings.returnWithPurchase)
              }
            />
            <span>Return With Purchase</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={settings.masterLocationInSales}
              onChange={() =>
                setField("masterLocationInSales", !settings.masterLocationInSales)
              }
            />
            <span>Master location in Sales</span>
          </label>
        </div>
      </div>

      <div className="buttons-row">
        <button className="save-btn" onClick={handleSave}>
          Save
        </button>
        <button className="close-btn" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );
}
