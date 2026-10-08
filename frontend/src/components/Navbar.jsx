import { NavLink } from "react-router-dom";

function Navbar() {
  const getNavClass = ({ isActive }) =>
    `rm-nav-link ${isActive ? "active" : ""}`;

  return (
    <header className="rm-navbar">
      <div className="container">
        <NavLink to="/" className="rm-brand">
          <div className="rm-brand-icon">
            <i className="bi bi-shop"></i>
          </div>

          <span>RationMate</span>
        </NavLink>

        <button
          className="rm-nav-toggler"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => {
            document
              .querySelector(".rm-nav-links")
              ?.classList.toggle("show");
          }}
        >
          <i className="bi bi-list"></i>
        </button>

        <ul className="rm-nav-links">
          <li className="rm-nav-item">
            <NavLink to="/" end className={getNavClass}>
              <i className="bi bi-house-door"></i>
              <span>Home</span>
            </NavLink>
          </li>

          <li className="rm-nav-item">
            <NavLink to="/items" className={getNavClass}>
              <i className="bi bi-box-seam"></i>
              <span>Items</span>
            </NavLink>
          </li>

          <li className="rm-nav-item">
            <NavLink to="/customers" className={getNavClass}>
              <i className="bi bi-people"></i>
              <span>Customers</span>
            </NavLink>
          </li>

          <li className="rm-nav-item">
            <NavLink to="/bills/new" className={getNavClass}>
              <i className="bi bi-plus-circle"></i>
              <span>New Bill</span>
            </NavLink>
          </li>

          <li className="rm-nav-item">
            <NavLink to="/bills" className={getNavClass}>
              <i className="bi bi-receipt"></i>
              <span>Bill History</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </header>
  );
}

export default Navbar;