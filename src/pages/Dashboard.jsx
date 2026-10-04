import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { CategoriesList } from "../models/constants";
import Header from "../components/Header";
import "./Dashboard.css";

const icons = {
  BANK_ACCOUNT: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 10l9-6 9 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9" strokeLinecap="round" />
      <path d="M3 21h18" strokeLinecap="round" />
    </svg>
  ),
  APPLICATIONS: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h3" strokeLinecap="round" />
    </svg>
  ),
  NOTES: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M14 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function Dashboard() {
  const { loadCategory } = useApp();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let cancelled = false;
    CategoriesList.forEach(async (cat) => {
      try {
        const map = await loadCategory(cat.key);
        if (!cancelled) setCounts((c) => ({ ...c, [cat.key]: Object.keys(map).length }));
      } catch {
        /* surfaced within category view */
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <Header />
      <main className="dashboard">
        <div className="dashboard-heading">
          <span className="eyebrow">The Ledger</span>
          <h2>What would you like to open?</h2>
        </div>
        <div className="dashboard-grid">
          {CategoriesList.map((cat) => (
            <button
              key={cat.key}
              className="ledger-card"
              onClick={() => navigate(`/category/${cat.key}`)}
            >
              <span className="ledger-card-icon">{icons[cat.key]}</span>
              <span className="ledger-card-name">{cat.displayName}</span>
              <span className="ledger-card-count">
                {counts[cat.key] === undefined ? "…" : `${counts[cat.key]} kept`}
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
