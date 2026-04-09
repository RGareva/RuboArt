import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ product, index = 0 }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to add items to cart");
      navigate("/login");
      return;
    }
    try {
      await addToCart(product.id);
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <motion.div
      data-testid={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="bg-white p-4 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col gap-3 group"
    >
      <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden bg-[#FFFAF6]">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-3 left-3 bg-[#FDE68A] text-[#2B2D42] text-xs font-bold px-3 py-1 rounded-full">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 left-3 bg-[#FF9999] text-[#2B2D42] text-xs font-bold px-3 py-1 rounded-full">
            Out of stock
          </span>
        )}
        <span className="absolute top-3 right-3 bg-[#B9FBC0] text-[#2B2D42] text-xs font-bold px-3 py-1 rounded-full">
          {product.category}
        </span>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h3 className="font-['Nunito'] font-bold text-[#2B2D42] text-lg leading-tight line-clamp-1">
          {product.name}
        </h3>
        <p className="text-[#6D6875] text-sm line-clamp-2">{product.description}</p>
      </div>

      <div className="flex items-center justify-between px-1 mt-auto">
        <span className="font-['Nunito'] font-black text-xl text-[#2B2D42]">
          ${product.price.toFixed(2)}
        </span>
        <button
          data-testid={`add-to-cart-${product.id}`}
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="p-3 rounded-full bg-[#FFB3A7] text-[#2B2D42] shadow-[0_4px_14px_rgba(255,179,167,0.4)] hover:shadow-[0_6px_20px_rgba(255,179,167,0.6)] hover:-translate-y-1 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
