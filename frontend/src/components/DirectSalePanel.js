// src/components/DirectSalePanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import "./DirectSalePanel.css";

// Public base (CRA/Netlify friendly)
const PUBLIC = process.env.PUBLIC_URL || "";

// ✅ STATIC QUICK ITEM IMAGE MAP (files are inside: frontend/public/quickitems/)
const QUICK_IMG = {
  dates: `${PUBLIC}/quickitems/dates.png`,
  milk: `${PUBLIC}/quickitems/milk.png`,
  eggs: `${PUBLIC}/quickitems/eggs.png`,
  eraser: `${PUBLIC}/quickitems/eraser.png`,
  ghee: `${PUBLIC}/quickitems/ghee.png`,
  jam: `${PUBLIC}/quickitems/jam.png`,
  mango: `${PUBLIC}/quickitems/mango.png`,
  oats: `${PUBLIC}/quickitems/oats.png`,
  "nail polish": `${PUBLIC}/quickitems/nail-polish.png`,
  rice: `${PUBLIC}/quickitems/rice.png`,
};

function normalizeName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolveImage(p) {
  const backendImg = (p?.imageUrl || p?.photo || p?.thumbnail || "").trim();

  // If backend provides full http(s) image -> use it
  if (backendImg && /^https?:\/\//i.test(backendImg)) return backendImg;

  // If backend provides "/something.png" -> keep as is (same domain)
  if (backendImg && backendImg.startsWith("/")) return backendImg;

  // Else use quickitems mapping
  const n = normalizeName(p?.itemNameEn || p?.name);
  return QUICK_IMG[n] || "";
}

export default function DirectSalePanel({
  onPick,
  onClear,
  onOpenCustomer,
  onOpenSalesType,
  apiBase,
}) {
  const BASE = (apiBase ?? process.env.REACT_APP_API_BASE ?? "").trim();
  const PRODUCTS_URL = `${BASE}/api/products`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [raw, setRaw] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await axios.get(PRODUCTS_URL, {
          params: { page: 0, size: 500 },
          signal: ac.signal,
        });

        const list = Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
          ? data
          : [];

        setRaw(list);
      } catch (e) {
        if (!axios.isCancel(e)) {
          console.error("DirectSale fetch failed", e);
          setError("Couldn't load items.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [PRODUCTS_URL]);

  const products = useMemo(() => {
    const src = Array.isArray(raw) ? raw : [];
    const filtered = src.filter(
      (p) => p?.directSale === true || p?.directSaleItem === true
    );

    const term = q.trim().toLowerCase();
    if (!term) return filtered;

    return filtered.filter((p) => {
      const en = (p?.itemNameEn || p?.name || "").toLowerCase();
      const ar = (p?.itemNameAr || "").toLowerCase();
      return en.includes(term) || ar.includes(term);
    });
  }, [raw, q]);

  return (
    <aside className="ds-panel">
      <div className="ds-topbar">
        <button type="button" className="ds-topbtn" onClick={onOpenCustomer}>
          Customer
        </button>
        <button type="button" className="ds-topbtn" onClick={onOpenSalesType}>
          Sales Type
        </button>
      </div>

      <div className="ds-search">
        <input
          placeholder="Search quick items…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search quick items"
        />
      </div>

      <button type="button" className="ds-clear" onClick={onClear}>
        Clear
      </button>

      <div className="ds-grid">
        {loading && <div className="ds-empty">Loading…</div>}
        {!loading && error && <div className="ds-empty">{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className="ds-empty">
            No Direct Sale items found.
            <div className="ds-hint">
              Mark products with “Direct Sale Item” in Add Product.
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          products.map((p, idx) => {
            const price =
              p?.retail ??
              p?.price ??
              (Array.isArray(p?.subItems) && p.subItems[0]?.price) ??
              0;

            const nameEn = p?.itemNameEn || p?.name || "Item";
            const nameAr = p?.itemNameAr || "";
            const img = resolveImage(p);

            return (
              <button
                key={p?.id || p?._id || `${nameEn}-${idx}`}
                type="button"
                className="ds-card"
                onClick={() => onPick(p)}
                title={`${nameEn}${nameAr ? ` / ${nameAr}` : ""}`}
              >
                <div className="ds-thumb">
                  {img ? (
                    <img
                      src={img}
                      alt={nameEn}
                      loading="eager"
                      onError={(e) => {
                        // ✅ Don't hide entire img; show placeholder instead
                        e.currentTarget.src = `${PUBLIC}/quickitems/placeholder.png`;
                      }}
                    />
                  ) : (
                    <span className="ds-placeholder" aria-hidden="true">
                      🛒
                    </span>
                  )}
                </div>

                <div className="ds-name" dir="auto">
                  {nameEn}
                  {nameAr ? <div className="ds-ar">{nameAr}</div> : null}
                </div>

                <div className="ds-price">AED {Number(price).toFixed(2)}</div>
              </button>
            );
          })}
      </div>
    </aside>
  );
}

DirectSalePanel.propTypes = {
  onPick: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onOpenCustomer: PropTypes.func.isRequired,
  onOpenSalesType: PropTypes.func.isRequired,
  apiBase: PropTypes.string,
};
