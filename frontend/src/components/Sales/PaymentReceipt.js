// src/components/PaymentReceipt.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import './PaymentReceipt.css';

const aed = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' });
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PaymentReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();

  // company defaults (overridden by API if present)
  const [company, setCompany] = useState({
    name: 'BAQALA SUPERMARKET',
    address: 'Al Nahda Street, Sharjah, UAE',
    phone: '+971-50-000-0000',
    trn: '100234567800003',
    logo: '/images/default-logo.png', // place a file or set '' to hide
  });

  const [payment, setPayment]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [printing, setPrinting] = useState(false);

  // fetch company (optional)
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await axios.get('/company/active');
        if (!live || !res?.data) return;
        setCompany((prev) => ({
          name:    res.data.name        || prev.name,
          address: res.data.address     || prev.address,
          phone:   res.data.phone       || prev.phone,
          trn:     res.data.trn || res.data.taxNumber || prev.trn,
          logo:    res.data.logo        || prev.logo,
        }));
      } catch {
        /* keep defaults silently */
      }
    })();
    return () => { live = false; };
  }, []);

  // fetch payment
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await axios.get(`/payments/${id}`);
        if (live) setPayment(res.data);
      } catch (e) {
        console.error('Failed to load payment:', e);
        if (live) {
          alert('Failed to load payment details.');
          navigate('/payment', { replace: true });
        }
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [id, navigate]);

  // wait for fonts & images → prevents blank prints
  const waitForAssets = useCallback(async () => {
    try { if (document.fonts?.ready) await document.fonts.ready; } catch {}
    const imgs = Array.from(document.images || []);
    await Promise.allSettled(
      imgs.map((img) =>
        img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; })
      )
    );
  }, []);

  const handlePrint = useCallback(async () => {
    if (printing) return;
    setPrinting(true);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 400)));
    await waitForAssets();
    window.print();
    setTimeout(() => setPrinting(false), 100); // let dialog open
  }, [printing, waitForAssets]);

  // keyboard: Ctrl/Cmd+P uses our print pipeline
  useEffect(() => {
    const onKey = (e) => {
      const ctrlP = (e.ctrlKey || e.metaKey) && (e.key === 'p' || e.code === 'KeyP');
      if (ctrlP) {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePrint]);

  const refText     = useMemo(() => payment?.reference || payment?.id || payment?._id || '—', [payment]);
  const dateText    = useMemo(() => formatDate(payment?.date), [payment]);
  const amountText  = useMemo(() => aed.format(Number(payment?.amount ?? 0)), [payment]);
  const cashierName = useMemo(() => localStorage.getItem('userName') || '—', []);

  if (loading) {
    return (
      <div className="receipt-wrap">
        <div className="receipt"><div className="muted">Loading…</div></div>
      </div>
    );
  }
  if (!payment) return null;

  return (
    <div className="receipt-wrap">
      <div className="receipt" role="document" aria-label="Payment Receipt">
        <header className="r-head">
          {company.logo ? (
            <div className="store-logo">
              <img src={company.logo} alt="Company Logo" />
            </div>
          ) : null}

          <h2 className="store-name">{company.name}</h2>
          <div className="store-info">
            <div>📍 {company.address}</div>
            <div>☎ {company.phone} • TRN: {company.trn}</div>
          </div>

          <h1>Payment Receipt</h1>
          <div className="muted">Ref: {refText}</div>
        </header>

        <section className="r-meta" aria-label="Receipt Meta">
          <div className="item"><span className="lbl">Date</span><span className="val">{dateText}</span></div>
          <div className="item"><span className="lbl">Customer</span><span className="val">{payment.customerName || '—'}</span></div>
          <div className="item"><span className="lbl">Payment Type</span><span className="val">{payment.paymentType || '—'}</span></div>
          <div className="item"><span className="lbl">Invoice ID</span><span className="val">{payment.invoiceId || '—'}</span></div>
          <div className="item"><span className="lbl">Reference</span><span className="val">{payment.reference || '—'}</span></div>
          <div className="item"><span className="lbl">Cashier</span><span className="val">{cashierName}</span></div>
        </section>

        <section className="r-amount" aria-label="Amount">
          <div className="row">
            <span className="lbl">Amount Received</span>
            <span className="val">{amountText}</span>
          </div>
        </section>

        <section className="r-notes" aria-label="Notes">
          <div className="lbl">Notes</div>
          <div className="box">{payment.notes || '—'}</div>
        </section>

        <footer className="r-foot">
          <div className="sign-row">
            <span>Received By</span><span className="line" />
          </div>
          <div className="policy">Exchange within 7 days with original bill. No cash refunds.</div>
          <div>Thank you!</div>
          <div className="muted">
            Generated by BaqalaPOS • {new Date().toLocaleString('en-GB')}
          </div>
        </footer>
      </div>

      {/* screen-only actions (hidden in print) */}
      <div className="screen-actions" aria-hidden="true">
        <button className="btn" onClick={() => navigate('/payment')} title="Close (Esc)">
          Close
        </button>
        <button
          className="btn primary"
          onClick={handlePrint}
          disabled={printing}
          title="Print (Ctrl/Cmd+P)"
        >
          {printing ? 'Preparing…' : 'Print'}
        </button>
      </div>
    </div>
  );
}
