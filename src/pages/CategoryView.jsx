import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Categories, CategoryFieldLayout, FieldPropertyName } from "../models/constants";
import Header from "../components/Header";
import DetailPanel from "../components/DetailPanel";
import "./Dashboard.css";
import "./CategoryView.css";

export default function CategoryView() {
  const { key } = useParams();
  const navigate = useNavigate();
  const { loadCategory, deleteDetail } = useApp();

  const category = Categories[key];
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState(null);

  useEffect(() => {
    if (!category) return;
    setDetails(null);
    setError("");
    loadCategory(key, { force: true })
      .then((map) => setDetails(map))
      .catch((e) => setError(e.appMessage || "Could not load this category."));
  }, [key, category, loadCategory]);

  const filtered = useMemo(() => {
    if (!details) return [];
    const list = Object.values(details);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((d) => d.name?.toLowerCase().includes(q));
  }, [details, query]);

  const selected = selectedName && details ? details[selectedName] : null;

  if (!category) {
    return (
      <div className="page">
        <Header />
        <main className="dashboard">
          <p>Unknown category.</p>
          <Link className="btn btn-ghost" to="/dashboard">Back to Dashboard</Link>
        </main>
      </div>
    );
  }

  async function handleDelete(detail) {
    await deleteDetail(detail);
    setDetails((prev) => {
      const next = { ...prev };
      delete next[detail.name];
      return next;
    });
    setSelectedName(null);
  }

  return (
    <div className="page">
      <Header />
      <main className="dashboard">
        <div className="category-toolbar">
          <div>
            <Link to="/dashboard" className="breadcrumb">← Dashboard</Link>
            <h2>{category.displayName}</h2>
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/category/${key}/new`)}>
            + Add {category.displayName === "Notes" ? "Note" : "Entry"}
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {details && Object.keys(details).length > 0 && (
          <input
            className="category-search"
            placeholder={`Search ${category.displayName.toLowerCase()}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}

        {details === null && !error && <p className="muted">Loading…</p>}

        {details && Object.keys(details).length === 0 && (
          <div className="empty-state">
            <p>Nothing kept here yet.</p>
            <button className="btn btn-primary" onClick={() => navigate(`/category/${key}/new`)}>
              Add your first entry
            </button>
          </div>
        )}

        <div className="index-card-list">
          {filtered.map((detail) => (
            <button
              key={detail.name}
              className="index-card"
              onClick={() => setSelectedName(detail.name)}
            >
              <span className="index-card-name">{detail.name}</span>
              <span className="index-card-preview mono">{previewFor(key, detail)}</span>
            </button>
          ))}
        </div>
      </main>

      {selected && (
        <DetailPanel
          categoryKey={key}
          detail={selected}
          onClose={() => setSelectedName(null)}
          onEdit={() => navigate(`/category/${key}/edit/${encodeURIComponent(selected.name)}`)}
          onDelete={() => handleDelete(selected)}
        />
      )}
    </div>
  );
}

function previewFor(categoryKey, detail) {
  const fields = CategoryFieldLayout[categoryKey] || [];
  for (const f of fields) {
    const prop = FieldPropertyName[f];
    if (detail[prop]) return maskValue(detail[prop]);
  }
  return detail.notes ? detail.notes.slice(0, 40) : "—";
}

function maskValue(value) {
  if (value.length <= 4) return "••••";
  return value.slice(0, 2) + "••••" + value.slice(-2);
}
