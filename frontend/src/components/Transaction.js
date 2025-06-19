import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import './Transaction.css';

const Transaction = ({ onClose }) => {
  const [debit, setDebit] = useState('');
  const [credit, setCredit] = useState('');
  const [changeAmount, setChangeAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeField, setActiveField] = useState('');
  const [layoutName, setLayoutName] = useState('default');

  const handleSave = () => {
    if (selectedType && (debit || credit || changeAmount || note)) {
      alert('Transaction Saved!');
      console.log({ selectedType, debit, credit, changeAmount, note });
      onClose();
    } else {
      alert('Please select type and enter data.');
    }
  };

  const onKeyPress = (button) => {
    if (button === '{enter}') {
      handleSave();
    } else if (button === '{bksp}') {
      updateField((val) => val.slice(0, -1));
    } else if (button === '{space}') {
      updateField((val) => val + ' ');
    } else if (button === '{shift}' || button === '{capslock}') {
      setLayoutName((prev) => (prev === 'default' ? 'shift' : 'default'));
    } else if (button === '{tab}') {
      // optional: implement tab switching fields
    } else {
      updateField((val) => val + button);
    }
  };

  const updateField = (transformer) => {
    switch (activeField) {
      case 'changeAmount':
        setChangeAmount(transformer(changeAmount));
        break;
      case 'note':
        setNote(transformer(note));
        break;
      default:
        break;
    }
  };

  const isSaveDisabled = !selectedType || (!debit && !credit && !changeAmount && !note);

  return (
    <div className="transaction-modal">
      <div className="transaction-header">
        <strong>TRANSACTION</strong>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <div className="transaction-body">
        <div className="left-options">
          {['RECEIPT ENTRY', 'SALES TRANSFER', 'PAYMENT ENTRY', 'GENERAL TRANSFER', 'CASH TRANSFER'].map(type => (
            <button
              key={type}
              className={selectedType === type ? 'selected' : ''}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="right-details">
          <p>Transaction No: </p>

          <div className="input-group">
            <label htmlFor="debit">Debit A/C:</label>
            <select
              id="debit"
              value={debit}
              onChange={(e) => setDebit(e.target.value)}
              onFocus={() => setActiveField('')}
            >
              <option value="">-- Select Debit A/C --</option>
              <option value="1001">1001 - Cash</option>
              <option value="1002">1002 - Bank</option>
              <option value="1003">1003 - Sales</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="credit">Credit A/C:</label>
            <select
              id="credit"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              onFocus={() => setActiveField('')}
            >
              <option value="">-- Select Credit A/C --</option>
              <option value="2001">2001 - Purchase</option>
              <option value="2002">2002 - Expenses</option>
              <option value="2003">2003 - Vendor</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="change">Change Amount:</label>
            <input
              id="change"
              type="text"
              value={changeAmount}
              onFocus={() => setActiveField('changeAmount')}
              onChange={(e) => setChangeAmount(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="note">Note:</label>
            <textarea
              id="note"
              rows="3"
              value={note}
              onFocus={() => setActiveField('note')}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="transaction-footer">
        <button onClick={() => setShowKeyboard(!showKeyboard)}>🔠 Keys</button>
        <button className="ok-btn" onClick={handleSave} disabled={isSaveDisabled}>✔ Save</button>
        <button className="cancel-btn" onClick={onClose}>✖ Close</button>
      </div>

      {showKeyboard && (
        <div className="keyboard-wrapper">
          <Keyboard
            layoutName={layoutName}
            onKeyPress={onKeyPress}
            layout={{
              default: [
                '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
                '{tab} q w e r t y u i o p [ ] \\',
                '{capslock} a s d f g h j k l ; \' {enter}',
                '{shift} z x c v b n m , . / {shift}',
                '{space}'
              ],
              shift: [
                '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
                '{tab} Q W E R T Y U I O P { } |',
                '{capslock} A S D F G H J K L : " {enter}',
                '{shift} Z X C V B N M < > ? {shift}',
                '{space}'
              ]
            }}
            display={{
              '{bksp}': '⌫',
              '{enter}': '⏎',
              '{tab}': '⇥',
              '{capslock}': '⇪',
              '{shift}': '⇧',
              '{space}': '␣'
            }}
          />
        </div>
      )}
    </div>
  );
};

Transaction.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default Transaction;
