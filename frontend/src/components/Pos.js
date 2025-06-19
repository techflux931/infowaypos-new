import React, { useState, useEffect } from 'react';
import './Pos.css';
import './ViewSales.css';

import SalesTypeModal from './SalesTypeModal';
import QuantityModal from './QuantityModal';
import PriceModal from './PriceModal';
import CstModel from './cstmodel';
import Options from './Options';
import ProductListModal from './ProductListModal';
import ProductForm from './ProductForm';
import ViewSales from './ViewSales';
import RecallModal from './RecallModal';
import ReturnModal from './ReturnModal';
import ClearConfirm from './ClearConfirm';
import PosInvoice from './PosInvoice';
import { FaPowerOff, FaWindowMinimize, FaTimes } from 'react-icons/fa';
import { evaluate } from 'mathjs';

const Pos = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [input, setInput] = useState('');
  const [itemList, setItemList] = useState([]);

  const [showSaleType, setShowSaleType] = useState(false);
  const [showQuantity, setShowQuantity] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showViewSales, setShowViewSales] = useState(false);
  const [showRecall, setShowRecall] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPosInvoice, setShowPosInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const [formMode, setFormMode] = useState('add');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [keyboardInputs, setKeyboardInputs] = useState({
    barcode: '', discount: '', paid: '', tax: '', change: ''
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-GB'));
    };
    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleCalcClick = (value) => {
    if (value === 'C') setInput('');
    else if (value === '←') setInput(input.slice(0, -1));
    else if (value === 'Enter') {
      try {
        const result = evaluate(input.replace('×', '*').replace('÷', '/'));
        setInput(result.toString());
      } catch {
        setInput('Error');
      }
    } else {
      setInput(input + value);
    }
  };

  const handleSaveProduct = (product) => {
    console.log('Saved product:', product);
    setShowProductForm(false);
  };

  const handleAddNew = () => {
    setFormMode('add');
    setSelectedProduct(null);
    setShowProductList(false);
    setShowProductForm(true);
  };

  const handleClearAll = () => {
    setItemList([]);
    setKeyboardInputs({ barcode: '', discount: '', paid: '', tax: '', change: '' });
    setInput('');
  };

  const handlePrintInvoice = () => {
    const dummyData = {
      invoiceNo: '100362269100003',
      date: currentDate,
      time: currentTime,
      cashier: 'Admin',
      items: itemList,
      subTotal: 19.02,
      discount: 0.00,
      tax: 0.97,
      total: 19.99,
      paid: 19.99,
      change: 0.00,
      shopName: 'JABAL AL RAHMAH GROCERY L.L.C',
      address: 'RAS AL KHOR DUBAI UAE',
      phone: '0569304466',
      footerNote: 'Thank you! Visit Again.',
    };
    setInvoiceData(dummyData);
    setShowPosInvoice(true);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'F1') setShowProductList(true);
      else if (e.key === 'F3') setShowViewSales(true);
      else if (e.key === 'F4') alert('F4 - Hold modal open');
      else if (e.key === 'F5') setShowRecall(true);
      else if (e.key === 'F6') alert('F6 - Card Pay');
      else if (e.key === 'F7') alert('F7 - Card w/o Print');
      else if (e.key === 'F8') alert('F8 - Quick Pay');
      else if (e.key === 'F9') alert('F9 - Commit');
      else if (e.key === 'F11') setShowReturn(true);
      else if (e.key === 'F12') setShowOptions(true);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const buttons = ['1','2','3','4','5','6','7','8','9','0','00','.', '+','-','×','÷','C','←'];

  return (
    <div className="pos-container">
      {/* Header */}
      <div className="pos-header">
        <div className="pos-title">SALES</div>
        <div className="pos-meta">
          <span>{currentTime}</span>
          <span>{currentDate}</span>
          <span>Admin</span>
          <span>Main</span>
        </div>
        <div className="pos-controls">
          <FaPowerOff title="Logout" />
          <FaWindowMinimize title="Minimize" />
          <FaTimes title="Close" />
        </div>
      </div>

      {/* Main Body */}
      <div className="pos-main">
        {/* Left Section */}
        <div className="pos-left">
          <input
            type="text"
            name="barcode"
            placeholder="Scan or Type Barcode"
            className="barcode-input"
            value={keyboardInputs.barcode}
            onChange={(e) => setKeyboardInputs(prev => ({ ...prev, [e.target.name]: e.target.value }))}
          />

          <div className="item-table-header">
            <span>Sl.No</span><span>Item (EN/AR)</span><span>Unit</span><span>Qty</span>
            <span>Price</span><span>Tax</span><span>Full Price</span><span>Total</span>
          </div>
          <div className="item-list">
            {itemList.map((item, index) => (
              <div key={item.id || index} className="item-row">
                {/* Item rendering */}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="totals-section">
            <div className="totals-row">
              <div className="totals-label">Sub Total</div>
              <div className="totals-value">0.00</div>
              <div className="totals-label">Total</div>
              <div className="totals-value highlight-total">0.00</div>
            </div>
            <div className="totals-row">
              <div className="totals-label">Discount</div>
              <input name="discount" value={keyboardInputs.discount} onChange={(e) => setKeyboardInputs(prev => ({ ...prev, discount: e.target.value }))} />
              <div className="totals-label">Paid</div>
              <input name="paid" value={keyboardInputs.paid} onChange={(e) => setKeyboardInputs(prev => ({ ...prev, paid: e.target.value }))} />
            </div>
            <div className="totals-row">
              <div className="totals-label">Tax</div>
              <input name="tax" value={keyboardInputs.tax} onChange={(e) => setKeyboardInputs(prev => ({ ...prev, tax: e.target.value }))} />
              <div className="totals-label">Change</div>
              <input name="change" value={keyboardInputs.change} onChange={(e) => setKeyboardInputs(prev => ({ ...prev, change: e.target.value }))} />
            </div>
          </div>

          {/* Function Keys */}
          <div className="function-keys">
            <button onClick={() => setShowProductList(true)}>F1 Product</button>
            <button>F2 Remove</button>
            <button onClick={() => setShowViewSales(true)}>F3 View</button>
            <button>F4 Hold</button>
            <button className="green">Open Drawer</button>
            <button onClick={() => setShowRecall(true)}>F5 Recall</button>
            <button>F6 Card Pay</button>
            <button>F7 Card w/o Print</button>
            <button>F8 Credit</button>
            <button className="green">Quick Pay</button>
            <button>F9 Commit</button>
            <button>F10 Discount</button>
            <button onClick={() => setShowReturn(true)}>F11 Return</button>
            <button onClick={() => setShowOptions(true)}>F12 Options</button>
            <button className="green" onClick={handlePrintInvoice}>Save & Print</button>
          </div>
        </div>

        {/* Right Section */}
        <div className="pos-right">
          <div className="quick-fields">
            <button onClick={() => setShowQuantity(true)}>Quantity</button>
            <button onClick={() => setShowPrice(true)}>Price</button>
            <button onClick={() => setShowCustomer(true)}>Customer</button>
            <button onClick={() => setShowSaleType(true)}>Sales Type</button>
            <button className="clear-button" onClick={() => setShowClearConfirm(true)}>Clear</button>
          </div>

          <div className="calculator">
            <input type="text" className="calc-display" value={input} readOnly />
            <div className="calc-body">
              <div className="calc-buttons">
                {buttons.map((btn) => (
                  <button key={btn} onClick={() => handleCalcClick(btn)}>{btn}</button>
                ))}
              </div>
              <button className="enter-button" onClick={() => handleCalcClick('Enter')}>Enter</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSaleType && <SalesTypeModal onSelect={() => setShowSaleType(false)} onClose={() => setShowSaleType(false)} />}
      {showQuantity && <QuantityModal onSubmit={() => setShowQuantity(false)} onClose={() => setShowQuantity(false)} />}
      {showPrice && <PriceModal onSubmit={() => setShowPrice(false)} onClose={() => setShowPrice(false)} />}
      {showCustomer && <CstModel onSelect={() => setShowCustomer(false)} onClose={() => setShowCustomer(false)} />}
      {showOptions && <Options onClose={() => setShowOptions(false)} />}
      {showProductList && <ProductListModal onClose={() => setShowProductList(false)} onSelect={() => setShowProductList(false)} onAddNew={handleAddNew} onEdit={(product) => {
        setFormMode('edit');
        setSelectedProduct(product);
        setShowProductList(false);
        setShowProductForm(true);
      }} />}
      {showProductForm && <ProductForm onClose={() => setShowProductForm(false)} onSave={handleSaveProduct} mode={formMode} editData={selectedProduct} />}
      {showViewSales && <ViewSales onClose={() => setShowViewSales(false)} />}
      {showRecall && <RecallModal onClose={() => setShowRecall(false)} />}
      {showReturn && <ReturnModal onClose={() => setShowReturn(false)} onConfirm={() => console.log('Returned item confirmed!')} />}
      {showClearConfirm && <ClearConfirm onYes={() => { handleClearAll(); setShowClearConfirm(false); }} onNo={() => setShowClearConfirm(false)} />}
      {showPosInvoice && invoiceData && <PosInvoice invoiceData={invoiceData} onClose={() => setShowPosInvoice(false)} />}
    </div>
  );
};

export default Pos;
