import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import ProductForm from './components/ProductForm';
import Pos from './components/Pos';
import Customer from './components/Customer';
import Reports from './components/Reports';
import Return from './components/Return';
import Payment from './components/Payment';
import Analytics from './components/Analytics';
import Shift from './components/Shift';
import Invoice from './components/Invoice';
import Options from './components/Options'; 


import PoleDisplay from './components/PoleDisplay';
import Scale from './components/Scale';
import Dash from './pages/Dash';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dash />} />
        <Route path="/pos" element={<Pos />} />
        <Route path="/products" element={<ProductForm />} />
        <Route path="/customers" element={<Customer />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/return" element={<Return />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/shift" element={<Shift />} />
        <Route path="/invoice" element={<Invoice />} />
        <Route path="/options" element={<Options />} />
        <Route path="/pole-display" element={<PoleDisplay />} />
        <Route path="/scale" element={<Scale />} />
      </Routes>
    </Router>
  );
}

export default App;
