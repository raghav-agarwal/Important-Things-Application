import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { buildEmptyDetail, validateDetail } from "../lib/detailsService";
import {
  Categories,
  CategoryFieldLayout,
  DetailKeys,
  FieldPropertyName,
  ApplicationError,
  ErrorCodes,
} from "../models/constants";
import Header from "../components/Header";
import "./Dashboard.css";
import "./DetailFormPage.css";

export default function DetailFormPage() {
  const { key, name } = useParams();
  const isEdit = Boolean(name);
  const navigate = useNavigate();
  const { loadCategory, saveDetail } = useApp();

  const category = Categories[key];
  const [detail, setDetail] = useState(null);
  const [others, setOthers] = useState([]); // [{k, v}]
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!category) return;
    if (isEdit) {
      loadCategory(key).then((map) => {
        const existing = map[decodeURIComponent(name)];
        if (existing) {
          setDetail(existing);
          setOthers(Object.entries(existing.otherDetailsMap || {}).map(([k, v]) => ({ k, v })));
        } else {
          setError("Entry not found.");
        }
      });
    } else {
      setDetail(buildEmptyDetail(key));
    }
  }, [key, name, isEdit, category, loadCategory]);

  if (!category) {
    return (
      <div className="page">
        <Header />
        <main className="dashboard">
          <p>Unknown category.</p>
        </main>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="page">
        <Header />
        <main className="dashboard">
          {error ? <div className="error-banner">{error}</div> : <p className="muted">Loading…</p>}
        </main>
      </div>
    );
  }

  const fields = CategoryFieldLayout[key] || [];

  function setField(prop, value) {
    setDetail((d) => ({ ...d, [prop]: value }));
  }

  function updateOther(index, field, value) {
    setOthers((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addOtherRow() {
    setOthers((prev) => [...prev, { k: "", v: "" }]);
  }

  function removeOtherRow(index) {
    setOthers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const otherDetailsMap = {};
    for (const row of others) {
      if (row.k.trim()) otherDetailsMap[row.k.trim()] = row.v;
    }

    const toSave = {
      ...detail,
      otherDetailsMap,
      lastUpdatedDate: nowString(),
    };

    try {
      validateDetail(toSave);
    } catch (err) {
      setError(err.appMessage || "Please check the form.");
      return;
    }

    // Port of SaveService validateEntity(): guard duplicate names on create,
    // and guard renaming onto an existing name on update.
    try {
      const currentMap = await loadCategory(key);
      const nameTaken = Object.prototype.hasOwnProperty.call(currentMap, toSave.name);
      if (!isEdit && nameTaken) {
        throw new ApplicationError(ErrorCodes.DUPLICATE_ERROR);
      }
      if (isEdit && toSave.name !== decodeURIComponent(name) && nameTaken) {
        throw new ApplicationError(ErrorCodes.DUPLICATE_ERROR);
      }
    } catch (err) {
      setError(err.appMessage || "Could not verify this entry.");
      return;
    }

    setBusy(true);
    try {
      await saveDetail(toSave, isEdit ? decodeURIComponent(name) : null);
      navigate(`/category/${key}`);
    } catch (err) {
      setError(err.appMessage || "Could not save this entry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <Header />
      <main className="dashboard dashboard-narrow">
        <Link to={isEdit ? `/category/${key}` : `/category/${key}`} className="breadcrumb">
          ← {category.displayName}
        </Link>
        <h2 className="form-title">
          {isEdit ? "Edit" : "Add"} {category.displayName === "Notes" ? "Note" : "Entry"}
        </h2>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="detail-form">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              value={detail.name}
              onChange={(e) => setField("name", e.target.value)}
              autoFocus
            />
          </div>

          {fields.map((f) => (
            <div className="field" key={f}>
              <label htmlFor={f}>{DetailKeys[f].displayLabel}</label>
              <input
                id={f}
                value={detail[FieldPropertyName[f]] || ""}
                onChange={(e) => setField(FieldPropertyName[f], e.target.value)}
                className="mono"
              />
            </div>
          ))}

          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={detail.notes || ""}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </div>

          <div className="other-details">
            <div className="other-details-header">
              <label>Other Details</label>
              <button type="button" className="btn btn-ghost btn-small" onClick={addOtherRow}>
                + Add field
              </button>
            </div>
            {others.map((row, i) => (
              <div className="other-details-row" key={i}>
                <input
                  placeholder="Label"
                  value={row.k}
                  onChange={(e) => updateOther(i, "k", e.target.value)}
                />
                <input
                  placeholder="Value"
                  className="mono"
                  value={row.v}
                  onChange={(e) => updateOther(i, "v", e.target.value)}
                />
                <button
                  type="button"
                  className="other-details-remove"
                  onClick={() => removeOtherRow(i)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <Link to={`/category/${key}`} className="btn btn-ghost">
              Cancel
            </Link>
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function nowString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}
