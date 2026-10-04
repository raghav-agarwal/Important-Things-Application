import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "./Header.css";

export default function Header() {
  const { loggedInUser, logout } = useApp();
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <Link to="/dashboard" className="app-header-brand">
        <span className="app-header-mark" />
        Important Things
      </Link>
      <div className="app-header-right">
        {loggedInUser && <span className="app-header-user">{loggedInUser.displayName}</span>}
        <button
          className="btn btn-ghost"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Lock Vault
        </button>
      </div>
    </header>
  );
}
