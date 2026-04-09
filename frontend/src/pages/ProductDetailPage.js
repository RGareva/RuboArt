import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { ShoppingCart, ArrowLeft, Package, User, Minus, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${API}/products/${id}`);
        setProduct(data);
      } catch {
        toast.error("Product not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-12 pb-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square rounded-[2rem] bg-white animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-white rounded-full w-3/4 animate-pulse" />
            <div className="h-6 bg-white rounded-full w-1/2 animate-pulse" />
            <div className="h-32 bg-white rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const resolvedImageUrl = product.image_url?.startsWith("/api/files/")
    ? `${process.env.REACT_APP_BACKEND_URL}${product.image_url}`
    : product.image_url;

  return (
    <div className="px-4 md:px-12 pb-12 max-w-6xl mx-auto" data-testid="product-detail-page">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        {/* Back Button */}
        <button
          data-testid="back-button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#6D6875] hover:text-[#2B2D42] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="aspect-square rounded-[2rem] overflow-hidden bg-white border border-[#F1E9E7] shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
              <img
                src={resolvedImageUrl}
                alt={product.name}
                data-testid="product-detail-image"
                className="w-full h-full object-cover"
              />
            </div>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="absolute top-4 left-4 bg-[#FDE68A] text-[#2B2D42] text-sm font-bold px-4 py-1.5 rounded-full">
                Only {product.stock} left
              </span>
            )}
            {product.stock === 0 && (
              <span className="absolute top-4 left-4 bg-[#FF9999] text-[#2B2D42] text-sm font-bold px-4 py-1.5 rounded-full">
                Out of stock
              </span>
            )}
            <span className="absolute top-4 right-4 bg-[#B9FBC0] text-[#2B2D42] text-sm font-bold px-4 py-1.5 rounded-full">
              {product.category}
            </span>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            <h1
              data-testid="product-detail-name"
              className="font-['Nunito'] font-black text-3xl sm:text-4xl text-[#2B2D42] mb-2"
            >
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <span
                data-testid="product-detail-price"
                className="font-['Nunito'] font-black text-3xl text-[#FFB3A7]"
              >
                ${product.price.toFixed(2)}
              </span>
              <span className="bg-[#B9FBC0] text-[#2B2D42] text-xs font-bold px-3 py-1 rounded-full">
                {product.category}
              </span>
            </div>

            {/* Description */}
            <div className="bg-white rounded-[2rem] p-6 border border-[#F1E9E7] mb-6">
              <h3 className="font-['Nunito'] font-bold text-lg text-[#2B2D42] mb-3">Description</h3>
              <p
                data-testid="product-detail-description"
                className="text-[#6D6875] leading-relaxed whitespace-pre-wrap"
              >
                {product.description}
              </p>
            </div>

            {/* Stock & Seller */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="bg-white rounded-2xl px-5 py-3 border border-[#F1E9E7] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#C8B6FF]" />
                <span className="text-sm text-[#6D6875]">Stock:</span>
                <span
                  data-testid="product-detail-stock"
                  className={`text-sm font-bold ${product.stock > 5 ? "text-[#2B2D42]" : product.stock > 0 ? "text-[#FDE68A]" : "text-[#FF9999]"}`}
                >
                  {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
                </span>
              </div>
              <div className="bg-white rounded-2xl px-5 py-3 border border-[#F1E9E7] flex items-center gap-2">
                <User className="w-4 h-4 text-[#A0C4FF]" />
                <span className="text-sm text-[#6D6875]">Seller:</span>
                <span className="text-sm font-bold text-[#2B2D42]">{product.seller_name}</span>
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="mt-auto space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-[#2B2D42]">Quantity:</span>
                <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 border border-[#F1E9E7]">
                  <button
                    data-testid="detail-qty-minus"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FFB3A7]/20 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span data-testid="detail-qty-value" className="w-8 text-center font-bold text-lg text-[#2B2D42]">{quantity}</span>
                  <button
                    data-testid="detail-qty-plus"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FFB3A7]/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                data-testid="detail-add-to-cart"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || adding}
                className="w-full py-4 rounded-full bg-[#FFB3A7] text-[#2B2D42] font-bold text-lg shadow-[0_4px_14px_rgba(255,179,167,0.4)] hover:shadow-[0_6px_20px_rgba(255,179,167,0.6)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <ShoppingCart className="w-5 h-5" />
                {adding ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>

              <p className="text-xs text-[#6D6875] text-center">
                Free delivery on orders over $100 | Courier tax: 2.5%
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
