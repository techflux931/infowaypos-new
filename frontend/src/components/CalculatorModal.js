import React, { useEffect, useRef, useState } from "react";
import "./CalculatorModal.css";

export default function CalculatorModal({ open, onClose }) {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("0");
  const inputRef = useRef(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  if (!open) return null;

  const add   = (t) => setExpr((x) => x + t);
  const back  = () => setExpr((x) => x.slice(0, -1));
  const clear = () => { setExpr(""); setResult("0"); };

  const evalNow = () => {
    try {
      const cleaned = (expr || "0").replace(/×/g, "*").replace(/÷/g, "/");
      if (!/^[\d+\-*/().\s]+$/.test(cleaned)) throw new Error();
      // eslint-disable-next-line no-new-func
      const v = Function(`"use strict";return (${cleaned})`)();
      setResult(String(v ?? 0));
    } catch { setResult("Err"); }
  };

  return (
    <>
      <div className="calc-backdrop" onClick={onClose} />
      <aside className="calc-drawer" role="dialog" aria-label="Calculator">
        <header className="calc-head">
          <h3>Calculator</h3>
          <button className="calc-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <input
          ref={inputRef}
          className="calc-input"
          value={expr}
          onChange={(e)=>setExpr(e.target.value)}
          placeholder="Type 12+3*4"
          onKeyDown={(e)=> e.key === "Enter" && evalNow()}
        />

        <div className="calc-pad">
          <div className="pad-grid">
            {["1","2","3","4","5","6","7","8","9","0","00","."].map(k=>(
              <button key={k} className="pad-key" onClick={()=>add(k)}>{k}</button>
            ))}
            {["+","-","×","÷","←","C"].map(k=>(
              <button
                key={k}
                className={`pad-key ${k==="C"?"warn":""}`}
                onClick={
                  k==="←" ? back   :
                  k==="C" ? clear  :
                  () => add(k)
                }
              >{k}</button>
            ))}
          </div>
          <button className="enter-col" onClick={evalNow}>
            Enter
            <div className="enter-result">{result}</div>
          </button>
        </div>
      </aside>
    </>
  );
}
