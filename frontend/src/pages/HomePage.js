import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/categories`).then(({ data }) => setCategories(["All", ...data])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      params.append("page", page);
      params.append("limit", 12);
      const { data } = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(data.products);
      setTotalPages(data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="px-4 md:px-12 pb-12" data-testid="home-page">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="font-['Nunito'] font-black text-4xl sm:text-5xl lg:text-6xl text-[#2B2D42] tracking-tighter mb-4">
          Discover Cute Things
        </h1>
        <p className="text-[#6D6875] text-base md:text-lg max-w-lg mx-auto">
          Find adorable pastel treasures for your home, desk, and everyday life
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-xl mx-auto mb-8"
      >
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6D6875]" />
          <input
            data-testid="search-input"
            type="text"
            placeholder="Search for cute products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-14 pr-4 py-4 rounded-full bg-white border-2 border-[#F1E9E7] focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
          />
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide justify-center flex-wrap"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            data-testid={`category-filter-${cat}`}
            onClick={() => { setSelectedCategory(cat); setPage(1); }}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
              selectedCategory === cat
                ? "bg-[#FFB3A7] text-[#2B2D42] shadow-[0_4px_14px_rgba(255,179,167,0.4)]"
                : "bg-white text-[#6D6875] border border-[#F1E9E7] hover:border-[#FFB3A7] hover:text-[#2B2D42]"
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-[2rem] animate-pulse">
              <div className="w-full aspect-square rounded-[1.5rem] bg-[#FFF0ED]" />
              <div className="mt-3 h-5 bg-[#FFF0ED] rounded-full w-3/4" />
              <div className="mt-2 h-4 bg-[#FFF0ED] rounded-full w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-[#6D6875]" data-testid="no-products-message">
          <p className="font-['Nunito'] font-bold text-xl">No products found</p>
          <p className="text-sm mt-2">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="products-grid">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-10">
          <button
            data-testid="prev-page"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2.5 rounded-full bg-white border border-[#F1E9E7] hover:border-[#FFB3A7] transition-all disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-[#2B2D42]">
            Page {page} of {totalPages}
          </span>
          <button
            data-testid="next-page"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2.5 rounded-full bg-white border border-[#F1E9E7] hover:border-[#FFB3A7] transition-all disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
