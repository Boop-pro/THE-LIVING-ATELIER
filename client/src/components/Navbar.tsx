import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Palette, Sparkles, Menu, X, User as UserIcon, Shield, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    success('Logged Out', 'You have been safely signed out of your atelier session.');
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-display font-medium text-sm transition-all px-3 py-1.5 rounded-full ${
      isActive
        ? 'bg-atelier-lavender text-atelier-ink font-bold border-2 border-atelier-ink shadow-[2px_2px_0px_#24211F]'
        : 'text-atelier-ink hover:bg-atelier-lavender/30'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-atelier-blush/90 backdrop-blur-md border-b-2 border-atelier-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Atelier Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full bg-atelier-chartreuse border-2 border-atelier-ink flex items-center justify-center shadow-brutal group-hover:rotate-12 transition-transform">
              <Palette className="w-6 h-6 text-atelier-ink" />
            </div>
            <div>
              <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-atelier-ink block leading-none">
                THE LIVING ATELIER
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-atelier-muted block mt-0.5">
                Art Studio &amp; Ceramic Kiln
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/gallery" className={navLinkClass}>
              Original Paintings
            </NavLink>
            <NavLink to="/wall-art" className={navLinkClass}>
              Wall Murals
            </NavLink>
            <NavLink to="/pottery" className={navLinkClass}>
              Custom Pottery
            </NavLink>
          </nav>

          {/* Desktop Right Side / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-display font-bold text-xs bg-atelier-tomato text-white border-2 border-atelier-ink shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Studio Admin
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-display font-bold text-xs bg-atelier-lavender text-atelier-ink border-2 border-atelier-ink shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    My Atelier
                  </Link>
                )}

                <div className="text-right hidden lg:block">
                  <span className="text-xs font-display font-bold text-atelier-ink block leading-tight">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-atelier-muted uppercase tracking-wider block">
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-full border-2 border-atelier-ink bg-white hover:bg-atelier-tomato hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-xs py-2 px-4">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Join Atelier
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-full border-2 border-atelier-ink bg-white shadow-brutal"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-atelier-blush border-t-2 border-atelier-ink px-4 py-6 space-y-4">
          <nav className="flex flex-col space-y-2">
            <NavLink
              to="/gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl font-display font-bold text-sm border-2 border-transparent hover:border-atelier-ink hover:bg-atelier-lavender"
            >
              Original Paintings
            </NavLink>
            <NavLink
              to="/wall-art"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl font-display font-bold text-sm border-2 border-transparent hover:border-atelier-ink hover:bg-atelier-lavender"
            >
              Wall Murals
            </NavLink>
            <NavLink
              to="/pottery"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl font-display font-bold text-sm border-2 border-transparent hover:border-atelier-ink hover:bg-atelier-lavender"
            >
              Custom Pottery
            </NavLink>
          </nav>

          <div className="pt-4 border-t-2 border-atelier-ink/20 flex flex-col space-y-2">
            {isAuthenticated ? (
              <>
                <div className="px-2 py-1">
                  <p className="font-display font-bold text-sm">{user?.name}</p>
                  <p className="text-xs text-atelier-muted">{user?.email}</p>
                </div>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-accent text-center justify-center"
                  >
                    <Shield className="w-4 h-4 mr-1.5" />
                    Studio Admin Panel
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-lavender text-center justify-center"
                  >
                    <UserIcon className="w-4 h-4 mr-1.5" />
                    My Orders &amp; Requests
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-outline justify-center text-center text-atelier-tomato"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-outline text-center justify-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary text-center justify-center"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
