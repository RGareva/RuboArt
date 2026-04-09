import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, formatApiErrorDetail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created! Welcome!");
      navigate("/");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(255,179,167,0.15)] border border-[#F1E9E7] p-8"
      >
        <h1 data-testid="register-heading" className="font-['Nunito'] font-black text-3xl text-[#2B2D42] text-center mb-2">
          Create Account
        </h1>
        <p className="text-[#6D6875] text-center mb-8">Join PastelShop today</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6D6875]" />
            <input
              data-testid="register-name-input"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FFFAF6] border-2 border-transparent focus:bg-white focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6D6875]" />
            <input
              data-testid="register-email-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FFFAF6] border-2 border-transparent focus:bg-white focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6D6875]" />
            <input
              data-testid="register-password-input"
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FFFAF6] border-2 border-transparent focus:bg-white focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
            />
          </div>
          <button
            data-testid="register-submit-button"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#C8B6FF] text-[#2B2D42] font-bold text-base shadow-[0_4px_14px_rgba(200,182,255,0.4)] hover:shadow-[0_6px_20px_rgba(200,182,255,0.6)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Creating Account..." : "Create Account"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center mt-6 text-[#6D6875] text-sm">
          Already have an account?{" "}
          <Link to="/login" data-testid="login-link" className="text-[#C8B6FF] font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
