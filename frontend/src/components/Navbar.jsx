import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive
      ? "text-sm font-semibold underline"
      : "text-sm font-medium hover:underline";

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold">
          Recipe Finder
        </Link>

        <nav className="flex gap-4">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          <NavLink to="/add" className={linkClass}>
            Add recipe
          </NavLink>
          <NavLink to="/me" className={linkClass}>
            Profile
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
