import "./Login.css";

export default function SetupNotice() {
  return (
    <div className="login-screen">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <h1 style={{ marginBottom: "0.6rem" }}>One setup step left</h1>
        <p className="login-tagline" style={{ marginBottom: "1.3rem" }}>
          This app needs your Firebase project's config to connect to your existing Firestore data.
        </p>
        <ol style={{ color: "var(--paper-dim)", fontSize: "0.9rem", lineHeight: 1.7, paddingLeft: "1.2rem" }}>
          <li>Copy <code>.env.example</code> to <code>.env.local</code></li>
          <li>
            Go to the{" "}
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--brass)" }}
            >
              Firebase Console
            </a>{" "}
            → your project → Project settings → General → Your apps → SDK setup and configuration
          </li>
          <li>Copy each value into the matching <code>VITE_FIREBASE_*</code> variable</li>
          <li>Restart the dev server (or redeploy)</li>
        </ol>
        <p style={{ color: "var(--ash)", fontSize: "0.82rem", marginTop: "1.2rem" }}>
          See README.md for full details, including Firestore security rules.
        </p>
      </div>
    </div>
  );
}
