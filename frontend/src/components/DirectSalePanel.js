// src/components/DirectSalePanel.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import "./DirectSalePanel.css";

/**
 * DirectSalePanel
 * - Customer / Sales Type buttons
 * - Search
 * - Clear
 * - Grid of Direct-Sale items (image + name + price)
 *
 * Image strategy (stable on Netlify):
 * 1) Use backend-provided URLs if present (imageUrl/photo/thumbnail)
 *    - If full http(s) => use directly
 *    - If "/uploads/xx.png" => prepend API origin
 * 2) Else fallback to static icons from Netlify:
 *    public/quickitems/<slugified-name>.png
 *
 * Required props:
 *  onPick(product)
 *  onClear()
 *  onOpenCustomer()
 *  onOpenSalesType()
 *
 * Optional props:
 *  apiBase: backend origin (e.g. https://infowaypos-new.onrender.com)
 */
export default function DirectSalePanel({
  onPick,
  onClear,
  onOpenCustomer,
  onOpenSalesType,
  apiBase,
}) {
  // Prefer API_ORIGIN (backend origin), not /api base.
  // Example: https://infowaypos-new.onrender.com
  const API_ORIGIN = (apiBase ?? process.env.REACT_APP_API_ORIGIN ?? "").trim().replace(/\/+$/, "");

  // Backend endpoint:
  const PRODUCTS_URL = `${API_ORIGIN}/api/products`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [raw, setRaw] = useState([]);
  const [q, setQ] = useState("");

  // slugify for file names: "Nail Polish" -> "nail-polish"
  const toFileKey = useCallback((value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }, []);

  const resolveQuickImage = useCallback(
    (p) => {
      const candidate = String(p?.imageUrl || p?.photo || p?.thumbnail || "").trim();

      // 1) Full URL
      if (/^https?:\/\//i.test(candidate)) return candidate;

      // 2) Backend relative path "/uploads/xx.png"
      if (candidate.startsWith("/") && API_ORIGIN) return `${API_ORIGIN}${candidate}`;

      // 3) Static fallback from Netlify public folder
      const nameKey = toFileKey(p?.itemNameEn || p?.name);
      if (!nameKey) return null;

      // expects: frontend/public/quickitems/<nameKey>.png
      return `${process.env.PUBLIC_URL}/quickitems/${nameKey}.png`;
    },
    [API_ORIGIN, toFileKey]
  );

  useEffect(() => {
    if (!API_ORIGIN) {
      setError("API base not set. Add REACT_APP_API_ORIGIN.");
      return;
    }

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
  }, [API_ORIGIN, PRODUCTS_URL]);

  const products = useMemo(() => {
    const src = Array.isArray(raw) ? raw : [];

    // Direct-sale items flag
    let filtered = src.filter((p) => p?.directSale === true || p?.directSaleItem === true);

    // Search
    const term = q.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((p) => {
        const en = String(p?.itemNameEn || p?.name || "").toLowerCase();
        const ar = String(p?.itemNameAr || "").toLowerCase();
        return en.includes(term) || ar.includes(term);
      });
    }

    return filtered;
  }, [raw, q]);

  const getPrice = (p) => {
    const price =
      p?.retail ??
      p?.price ??
      (Array.isArray(p?.subItems) && p.subItems[0]?.price) ??
      0;

    const n = Number(price);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <aside className="ds-panel">
      {/* Top bar */}
      <div className="ds-topbar">
        <button type="button" className="ds-topbtn" onClick={onOpenCustomer}>
          Customer
        </button>
        <button type="button" className="ds-topbtn" onClick={onOpenSalesType}>
          Sales Type
        </button>
      </div>

      {/* Search */}
      <div className="ds-search">
        <input
          placeholder="Search quick items…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search quick items"
        />
      </div>

      {/* Clear */}
      <button type="button" className="ds-clear" onClick={onClear}>
        Clear
      </button>

      {/* Grid */}
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
          products.map((p) => {
            const id = p?.id || p?._id || `${p?.itemNameEn || p?.name || "item"}-${Math.random()}`;
            const price = getPrice(p);

            const img = resolveQuickImage(p);
            const nameEn = p?.itemNameEn || p?.name || "Item";
            const nameAr = p?.itemNameAr || "";

            return (
              <button
                key={id}
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
                      loading="lazy"
                      onError={(e) => {
                        // Hide broken image so placeholder shows (or stays empty)
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = "none";
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

                <div className="ds-price">AED {price.toFixed(2)}</div>
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
  apiBase: PropTypes.string, // backend origin only
};
