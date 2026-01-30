

// src/components/CompanyStickerPreview.js
import React, { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import "./CompanyStickerPreview.css";

/**
 * Print-ready company sticker/label preview.
 * mode: "thermal" -> 58mm x 40mm   |   "a4" -> A4 portrait
 */
export default function CompanyStickerPreview({ company, onClose, mode = "thermal", autoPrint = true }) {
  const printedRef = useRef(false);

  // choose one @page rule based on mode
  const pageStyle = useMemo(() => {
    if (mode === "a4") return `@page { size: A4 portrait; margin: 10mm; }`;
    return `@page { size: 58mm 40mm; margin: 0; }`;
  }, [mode]);

  // Wait until images are loaded before printing (avoids blank labels)
  useEffect(() => {
    if (!company || printedRef.current || !autoPrint) return;

    const imgs = Array.from(document.querySelectorAll(".sticker-print-container img"));
    let loaded = 0;
    const done = () => {
      if (printedRef.current) return;
      printedRef.current = true;
      window.print();
      setTimeout(onClose, 500);
    };

    if (imgs.length === 0) {
      done();
      return;
    }

    const onLoad = () => {
      loaded += 1;
      if (loaded >= imgs.length) done();
    };
    imgs.forEach((im) => {
      if (im.complete) onLoad();
      else {
        im.addEventListener("load", onLoad, { once: true });
        im.addEventListener("error", onLoad, { once: true });
      }
    });

    return () => {
      imgs.forEach((im) => {
        im.removeEventListener?.("load", onLoad);
        im.removeEventListener?.("error", onLoad);
      });
    };
  }, [company, onClose, autoPrint]);

  if (!company) return null;

  return (
    <div className="sticker-print-overlay" role="dialog" aria-modal="true">
      <style>{pageStyle}</style>

      <div className={`sticker-print-container ${mode}`}>
        {/* Logo */}
        {company.logo && (
          <div className={`sticker-logo ${mode}`}>
            <img src={company.logo} alt="Company Logo" />
          </div>
        )}

        {/* Names / TRN */}
        <div className={`sticker-details ${mode}`}>
          {company.name && <div className={`sticker-name ${mode}`}>{company.name}</div>}
          {company.nameAr && <div className={`sticker-name-ar ${mode}`}>{company.nameAr}</div>}
          {company.trn && <div className={`sticker-trn ${mode}`}>TRN: {company.trn}</div>}
        </div>

        {/* Barcode */}
        {company.barcode && (
          <div className={`sticker-barcode ${mode}`}>
            <img
              src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
                company.barcode
              )}&includetext`}
              alt="Company Barcode"
            />
          </div>
        )}

        {/* Extra on A4 */}
        {mode === "a4" && company.address && (
          <div className="sticker-address a4">{company.address}</div>
        )}
      </div>
    </div>
  );
}

CompanyStickerPreview.propTypes = {
  company: PropTypes.shape({
    name: PropTypes.string,
    nameAr: PropTypes.string,
    trn: PropTypes.string,
    logo: PropTypes.string,     // URL/base64
    barcode: PropTypes.string,
    address: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["thermal", "a4"]),
  autoPrint: PropTypes.bool,
};
