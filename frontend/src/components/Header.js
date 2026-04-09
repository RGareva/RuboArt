import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Package, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";

export default function Header() {
  const { user, logout } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header
      data-testid="main-header"
      className="sticky top-4 z-50 mx-4 md:mx-12 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-full shadow-sm border border-[#F1E9E7] flex justify-between items-center"
    >
      <Link
        to="/"
        data-testid="logo-link"
        className="font-['Nunito'] font-black text-2xl text-[#2B2D42] tracking-tight hover:text-[#FFB3A7] transition-colors"
      >
        PastelShop
      </Link>

      <div className="flex items-center gap-3">
        <button
          data-testid="cart-button"
          onClick={() => setCartOpen(true)}
          className="relative p-2.5 rounded-full bg-[#FFF0ED] hover:bg-[#FFB3A7]/30 transition-all duration-300"
        >
          <ShoppingCart className="w-5 h-5 text-[#2B2D42]" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FFB3A7] text-[#2B2D42] text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              data-testid="user-menu-trigger"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C8B6FF]/20 hover:bg-[#C8B6FF]/40 transition-all duration-300 outline-none"
            >
              <User className="w-4 h-4 text-[#2B2D42]" />
              <span className="text-sm font-semibold hidden md:block text-[#2B2D42]">{user.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-[#F1E9E7] p-2 bg-white">
              <DropdownMenuItem
                data-testid="dashboard-link"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="orders-link"
                onClick={() => navigate("/orders")}
                className="rounded-xl cursor-pointer"
              >
                <Package className="w-4 h-4 mr-2" /> My Orders
              </DropdownMenuItem>
              {user.role === "admin" && (
                <DropdownMenuItem
                  data-testid="admin-link"
                  onClick={() => navigate("/admin")}
                  className="rounded-xl cursor-pointer"
                >
                  <Shield className="w-4 h-4 mr-2" /> Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="logout-button"
                onClick={handleLogout}
                className="rounded-xl cursor-pointer text-[#FF9999]"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            to="/login"
            data-testid="login-link"
            className="px-6 py-2 rounded-full bg-[#FFB3A7] text-[#2B2D42] font-bold text-sm shadow-[0_4px_14px_rgba(255,179,167,0.4)] hover:shadow-[0_6px_20px_rgba(255,179,167,0.6)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
