// src/components/Sales/QuotePage.js
import React from 'react';
import QuoteForm from './QuoteForm';
import './QuoteForm.css'; // Assuming CSS is in the same folder

const QuotePage = () => {
  return (
    <div className="quote-page-container">
      <QuoteForm />
    </div>
  );
};

export default QuotePage;
