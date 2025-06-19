import React, { useState } from 'react';
import './ProductList.css';

const dummyData = [
  { id: 1, barcode: '62910141', code: '101139', name: 'HAWAF TASTY FOODSTOO دجاج', unit: 'PIECES', cost: '3.150', rate: '4.750' },
  { id: 2, barcode: '108456', code: '111', name: 'JEWA WATER 500 ml بيدوبيدو', unit: 'PIECES', cost: '3.150', rate: '4.750' },
  { id: 3, barcode: '84151655', code: '44163866', name: 'BRIAN PAN CAKE 100 g بي إن نام', unit: 'PIECES', cost: '2.150', rate: '1.00' },
  { id: 4, barcode: '4160748', code: '14687815', name: 'VEGETABLES الخضات', unit: 'PIECES', cost: '3.150', rate: '3.50' },
  { id: 5, barcode: '523385103', code: '006', name: 'MILK CAN حليب', unit: 'PIECES', cost: '2.150', rate: '1.20' },
];

const ProductList = () => {
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');

  const filteredProducts = dummyData.filter(item =>
    item.code.includes(searchCode) &&
    item.name.toLowerCase().includes(searchName.toLowerCase())
  );

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h2>PRODUCTS</h2>
        <button className="close-button">✖</button>
      </div>

      <div className="product-list-search">
        <input
          type="text"
          placeholder="Item Code [F1]"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
        />
        <input
          type="text"
          placeholder="Item Name [F2]"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>

      <table className="product-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Barcode</th>
            <th>Item Code</th>
            <th>Product Name</th>
            <th>Unit</th>
            <th>Cost</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.barcode}</td>
              <td>{item.code}</td>
              <td>{item.name}</td>
              <td>{item.unit}</td>
              <td>{item.cost}</td>
              <td>{item.rate}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="product-list-actions">
        <button className="action-btn">✔ Select</button>
        <button className="action-btn">➕ Add New</button>
        <button className="action-btn">✏️ Edit</button>
        <button className="action-btn red">❌ Close</button>
      </div>
    </div>
  );
};

export default ProductList;
