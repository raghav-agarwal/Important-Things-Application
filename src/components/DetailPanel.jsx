import { useState } from "react";
import { CategoryFieldLayout, DetailKeys, FieldPropertyName } from "../models/constants";
import "./DetailPanel.css";

const SENSITIVE = new Set(["ACC_NO", "CARD_NO", "ATM_KEY", "ATM_CV", "NET_KEY", "APP_KEY"]);

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 5.2A10.8 10.8 0 0112 5c7 0 10.5 7 10.5 7a13.4 13.4 0 01-3.1 3.9M6.5 6.6C3.6 8.4 1.5 12 1.5 12s3.5 7 10.5 7a9.9 9.9 0 004.2-.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 10a3 3 0 004.2 4.2" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M4 16V4a1 1 0 011-1h12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--teal)" strokeWidth="2">
      <path d="M4 12.5l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DetailPanel({ categoryKey, detail, onClose, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fields = CategoryFieldLayout[categoryKey] || [];
  const visibleFields = fields.filter((f) => detail[FieldPropertyName[f]]);

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>{detail.name}</h3>
          <button className="panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="panel-body">
          {visibleFields.map((f) => (
            <SealedField
              key={f}
              label={DetailKeys[f].displayLabel}
              value={detail[FieldPropertyName[f]]}
              sensitive={SENSITIVE.has(f)}
            />
          ))}

          {detail.notes && (
            <div className="panel-field">
              <span className="panel-field-label">Notes</span>
              <p className="panel-notes">{detail.notes}</p>
            </div>
          )}

          {detail.otherDetailsMap && Object.keys(detail.otherDetailsMap).length > 0 && (
            <>
              <div className="panel-divider">Other Details</div>
              {Object.entries(detail.otherDetailsMap).map(([k, v]) => (
                <SealedField key={k} label={k} value={v} sensitive />
              ))}
            </>
          )}

          {detail.lastUpdatedDate && (
            <p className="panel-updated">Last updated {detail.lastUpdatedDate}</p>
          )}
        </div>

        <div className="panel-footer">
          {confirmingDelete ? (
            <>
              <span className="panel-confirm-text">Delete this entry?</span>
              <button className="btn btn-ghost" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={onDelete}>
                Yes, delete
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
                Delete
              </button>
              <button className="btn btn-primary" onClick={onEdit}>
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SealedField({ label, value, sensitive }) {
  const [revealed, setRevealed] = useState(!sensitive);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="panel-field">
      <span className="panel-field-label">{label}</span>
      <div className="panel-field-row">
        <span className="panel-field-value mono">{revealed ? value : "•".repeat(Math.min(value.length, 14))}</span>
        <div className="panel-field-actions">
          {sensitive && (
            <button
              className="icon-btn"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Hide" : "Reveal"}
              title={revealed ? "Hide" : "Reveal"}
            >
              {revealed ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
          <button className="icon-btn" onClick={copy} aria-label="Copy" title="Copy">
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}
