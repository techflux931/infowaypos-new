import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Options.css';
import { FaPrint, FaSyncAlt } from 'react-icons/fa';

import Transaction from './Transaction';
import ItemSummary from './ItemSummary';
import Shift from './Shift';
import DayReport from './DayReport';
import DayClose from './DayClose';

const Options = ({ onClose }) => {
  const [showTransaction, setShowTransaction] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showShift, setShowShift] = useState(false);
  const [showDayPrint, setShowDayPrint] = useState(false);
  const [showDayClose, setShowDayClose] = useState(false);

  return (
    <div className="options-modal">
      <div className="options-header">
        <h2>OTHER OPTIONS</h2>
        <button className="close-button" onClick={onClose}>✖</button>
      </div>

      <div className="options-buttons">
        <button onClick={() => setShowTransaction(true)}>Transactions</button>
        <button onClick={() => setShowSummary(true)}>Item Summary Report</button>
        <button onClick={() => setShowDayPrint(true)}>
          Day Print <FaPrint className="icon" />
        </button>
        <button onClick={() => setShowDayClose(true)}>
          Day Close <FaSyncAlt className="icon" />
        </button>
        <button onClick={() => setShowShift(true)}>Shift</button>
      </div>

      <div className="options-checkboxes">
        <label>
          <input type="checkbox" /> Pole Display
        </label>
        <label className="port-label">
          PORT <input type="text" className="port-input" />
        </label>
        <label>
          <input type="checkbox" /> Duplicate invoice
        </label>
      </div>

      {/* Modal components */}
      {showTransaction && <Transaction onClose={() => setShowTransaction(false)} />}
      {showSummary && <ItemSummary onClose={() => setShowSummary(false)} />}
      {showDayPrint && <DayReport onClose={() => setShowDayPrint(false)} />}
      {showDayClose && <DayClose onClose={() => setShowDayClose(false)} />}
      {showShift && <Shift onClose={() => setShowShift(false)} />}
    </div>
  );
};

Options.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default Options;
