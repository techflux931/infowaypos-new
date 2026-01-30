import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

import groupIcon from '../assets/group.png';
import ledgerIcon from '../assets/ledger.png';

import './Account.css';

export default function Account() {
  const navigate = useNavigate();

  const goHome = () => navigate('/dashboard');
  const goGroups = () => navigate('/accounts/groups');
  const goLedgers = () => navigate('/accounts/ledgers');

  return (
    <div className="account-wrapper">
      {/* Top Bar */}
      <header className="account-topbar" role="banner">
        <button
          type="button"
          className="home-btn"
          onClick={goHome}
          title="Go Home"
          aria-label="Home"
        >
          <FaHome aria-hidden="true" />
        </button>

        <h1 className="account-title">Accounts</h1>
        <div className="account-topbar-spacer" aria-hidden="true" />
      </header>

      {/* Main */}
      <main className="account-main">
        <section className="account-cards" aria-label="Accounts navigation">
          <button
            type="button"
            className="account-card"
            onClick={goGroups}
          >
            <img src={groupIcon} alt="Groups" loading="lazy" />
            <span>Groups</span>
          </button>

          <button
            type="button"
            className="account-card"
            onClick={goLedgers}
          >
            <img src={ledgerIcon} alt="Ledgers" loading="lazy" />
            <span>Ledgers</span>
          </button>
        </section>
      </main>
    </div>
  );
}
