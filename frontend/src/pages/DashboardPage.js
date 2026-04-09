import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Package, Upload, Image, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CATEGORIES = [
  "Electronics", "Clothing", "Home & Kitchen", "Books",
  "Toys & Games", "Sports", "Beauty", "Accessories", "Stationery", "Other",
];

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: "", description: "", price: "", category: "Other", image_url: "", stock: "1",
  });

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/my-products`, { withCredentials: true });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAddDialog = () => {
    setEditingProduct(null);
    setForm({ name: "", description: "", price: "", category: "Other", image_url: "", stock: "1" });
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    const resolvedImg = product.image_url?.startsWith("/api/files/")
      ? `${process.env.REACT_APP_BACKEND_URL}${product.image_url}`
      : product.image_url;
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      image_url: product.image_url,
      stock: String(product.stock),
    });
    setImagePreview(resolvedImg || null);
    setDialogOpen(true);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF, WebP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload-image`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({ ...f, image_url: data.url }));
      setImagePreview(URL.createObjectURL(file));
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleImageUpload(file);
  };

  const clearImage = () => {
    setForm((f) => ({ ...f, image_url: "" }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
    };
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, payload, { withCredentials: true });
        toast.success("Product updated!");
      } else {
        await axios.post(`${API}/products`, payload, { withCredentials: true });
        toast.success("Product created!");
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API}/products/${productId}`, { withCredentials: true });
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="px-4 md:px-12 pb-12" data-testid="dashboard-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Nunito'] font-black text-3xl text-[#2B2D42]">My Products</h1>
            <p className="text-[#6D6875] mt-1">Manage your listed items for sale</p>
          </div>
          <button
            data-testid="add-product-button"
            onClick={openAddDialog}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFB3A7] text-[#2B2D42] font-bold shadow-[0_4px_14px_rgba(255,179,167,0.4)] hover:shadow-[0_6px_20px_rgba(255,179,167,0.6)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] animate-pulse h-40" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-[#F1E9E7]" data-testid="no-products">
            <Package className="w-16 h-16 mx-auto text-[#F1E9E7] mb-4" />
            <h3 className="font-['Nunito'] font-bold text-xl text-[#2B2D42] mb-2">No products yet</h3>
            <p className="text-[#6D6875] mb-6">Start by adding your first product</p>
            <button
              onClick={openAddDialog}
              className="px-6 py-3 rounded-full bg-[#FFB3A7] text-[#2B2D42] font-bold shadow-[0_4px_14px_rgba(255,179,167,0.4)] hover:shadow-[0_6px_20px_rgba(255,179,167,0.6)] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 inline mr-2" /> Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="dashboard-products-grid">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                data-testid={`dashboard-product-${product.id}`}
                className="bg-white p-4 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-[#F1E9E7] flex gap-4"
              >
                <img
                  src={product.image_url?.startsWith("/api/files/") ? `${process.env.REACT_APP_BACKEND_URL}${product.image_url}` : product.image_url}
                  alt={product.name}
                  className="w-24 h-24 rounded-xl object-cover bg-[#FFFAF6] flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Nunito'] font-bold text-[#2B2D42] truncate">{product.name}</h3>
                  <p className="text-[#FFB3A7] font-bold">${product.price.toFixed(2)}</p>
                  <p className="text-xs text-[#6D6875]">
                    Stock: {product.stock} | {product.category}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      data-testid={`edit-product-${product.id}`}
                      onClick={() => openEditDialog(product)}
                      className="p-2 rounded-xl bg-[#C8B6FF]/20 hover:bg-[#C8B6FF]/40 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#2B2D42]" />
                    </button>
                    <button
                      data-testid={`delete-product-${product.id}`}
                      onClick={() => handleDelete(product.id)}
                      className="p-2 rounded-xl bg-[#FF9999]/20 hover:bg-[#FF9999]/40 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#FF9999]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[2rem] border-[#F1E9E7] bg-[#FFFAF6] max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Nunito'] font-bold text-xl text-[#2B2D42]">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription className="text-[#6D6875]">
              {editingProduct ? "Update your product details" : "Fill in the details to list a new product"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <input
              data-testid="product-name-input"
              type="text"
              placeholder="Product Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-transparent focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
            />
            <textarea
              data-testid="product-description-input"
              placeholder="Description"
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-transparent focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                data-testid="product-price-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-transparent focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
              />
              <input
                data-testid="product-stock-input"
                type="number"
                min="0"
                placeholder="Stock"
                required
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-transparent focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
              />
            </div>
            <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
              <SelectTrigger
                data-testid="product-category-select"
                className="rounded-2xl bg-white border-2 border-transparent focus:border-[#FFB3A7] py-3 h-auto"
              >
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-[#F1E9E7]">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="rounded-xl">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Image Upload Area */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#6D6875] uppercase tracking-wider px-1">Product Image</p>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-2xl border-2 border-[#B9FBC0]" />
                  <button
                    type="button"
                    onClick={clearImage}
                    data-testid="clear-image-button"
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all"
                  >
                    <X className="w-4 h-4 text-[#FF9999]" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="image-upload-area"
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-[#F1E9E7] hover:border-[#FFB3A7] bg-white flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {uploadingImage ? (
                    <div className="w-6 h-6 rounded-full border-2 border-[#FFB3A7] border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-[#C8B6FF]" />
                      <p className="text-sm text-[#6D6875]">Click or drop an image here</p>
                      <p className="text-xs text-[#6D6875]/60">JPEG, PNG, GIF, WebP (max 5MB)</p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                data-testid="image-file-input"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-[#F1E9E7]" />
                <span className="text-xs text-[#6D6875]/60">or paste URL</span>
                <div className="flex-1 h-px bg-[#F1E9E7]" />
              </div>
              <input
                data-testid="product-image-input"
                type="url"
                placeholder="Image URL (optional)"
                value={form.image_url?.startsWith("/api/") ? "" : form.image_url}
                onChange={(e) => {
                  setForm({ ...form, image_url: e.target.value });
                  setImagePreview(e.target.value || null);
                }}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-transparent focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50 text-sm"
              />
            </div>
            <button
              data-testid="product-submit-button"
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-full bg-[#FFB3A7] text-[#2B2D42] font-bold shadow-[0_4px_14px_rgba(255,179,167,0.4)] hover:shadow-[0_6px_20px_rgba(255,179,167,0.6)] transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
