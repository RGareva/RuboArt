import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Package, ShoppingCart, Users, DollarSign, Truck, CheckCircle,
  Clock, Search, Trash2, ChevronLeft, ChevronRight, Shield, ShieldCheck,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white p-5 rounded-[2rem] border border-[#F1E9E7] shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-[#2B2D42]" />
      </div>
      <div>
        <p className="text-xs text-[#6D6875] font-medium uppercase tracking-wider">{label}</p>
        <p className="font-['Nunito'] font-black text-2xl text-[#2B2D42]">{value}</p>
      </div>
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append("search", search);
      const { data } = await axios.get(`${API}/admin/products?${params}`, { withCredentials: true });
      setProducts(data.products);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    }
  }, [search, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API}/products/${id}`, { withCredentials: true });
      toast.success("Product deleted");
      fetchProducts();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6D6875]" />
          <input
            data-testid="admin-product-search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#FFFAF6] border border-[#F1E9E7] focus:border-[#FFB3A7] outline-none text-sm"
          />
        </div>
        <span className="text-sm text-[#6D6875] font-medium">{total} products</span>
      </div>

      <div className="bg-white rounded-[2rem] border border-[#F1E9E7] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F1E9E7] bg-[#FFFAF6]">
                <th className="text-left px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">Stock</th>
                <th className="text-left px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">Seller</th>
                <th className="text-right px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} data-testid={`admin-product-row-${p.id}`} className="border-b border-[#F1E9E7] last:border-0 hover:bg-[#FFFAF6]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-[#FFFAF6]" />
                      <span className="font-semibold text-[#2B2D42] truncate max-w-[200px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-[#B9FBC0] text-[#2B2D42] text-xs font-bold px-2.5 py-1 rounded-full">{p.category}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#2B2D42]">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${p.stock <= 5 ? "text-[#FF9999]" : "text-[#2B2D42]"}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6D6875]">{p.seller_name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      data-testid={`admin-delete-product-${p.id}`}
                      onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-xl bg-[#FF9999]/10 hover:bg-[#FF9999]/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-[#FF9999]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-full bg-white border border-[#F1E9E7] disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-[#2B2D42]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-full bg-white border border-[#F1E9E7] disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
  confirmed: "bg-[#A0C4FF]", shipped: "bg-[#C8B6FF]", delivered: "bg-[#B9FBC0]",
  cancelled: "bg-[#FF9999]", pending: "bg-[#FDE68A]",
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter !== "all") params.append("status", statusFilter);
      const { data } = await axios.get(`${API}/admin/orders?${params}`, { withCredentials: true });
      setOrders(data.orders);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/admin/orders/${orderId}/status`, { status: newStatus }, { withCredentials: true });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch { toast.error("Failed to update status"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
          <SelectTrigger data-testid="admin-order-status-filter" className="w-48 rounded-full bg-[#FFFAF6] border border-[#F1E9E7]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-[#F1E9E7]">
            <SelectItem value="all" className="rounded-xl">All Orders</SelectItem>
            {ORDER_STATUSES.map(s => (
              <SelectItem key={s} value={s} className="rounded-xl capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-[#6D6875] font-medium ml-auto">{total} orders</span>
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[2rem] border border-[#F1E9E7]">
            <Package className="w-12 h-12 mx-auto text-[#F1E9E7] mb-3" />
            <p className="text-[#6D6875] font-medium">No orders found</p>
          </div>
        ) : orders.map((order) => (
          <div key={order.id} data-testid={`admin-order-${order.id}`} className="bg-white rounded-[2rem] p-5 border border-[#F1E9E7] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-['Nunito'] font-bold text-[#2B2D42]">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs text-[#6D6875]">{order.user_name} ({order.user_email})</p>
                <p className="text-xs text-[#6D6875]">{new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`${STATUS_COLORS[order.status] || "bg-[#FDE68A]"} text-[#2B2D42] text-xs font-bold px-3 py-1.5 rounded-full capitalize`}>
                  {order.status}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger data-testid={`admin-order-status-btn-${order.id}`} className="px-3 py-1.5 rounded-full bg-[#C8B6FF]/20 hover:bg-[#C8B6FF]/40 text-xs font-bold text-[#2B2D42] transition-all">
                    Update
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-2xl border-[#F1E9E7] p-1">
                    {ORDER_STATUSES.map(s => (
                      <DropdownMenuItem
                        key={s}
                        data-testid={`admin-set-status-${order.id}-${s}`}
                        onClick={() => updateStatus(order.id, s)}
                        className="rounded-xl cursor-pointer capitalize text-sm"
                      >
                        {s}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {order.items.map((item) => (
                <div key={item.product_id} className="flex items-center gap-2 bg-[#FFFAF6] rounded-xl px-3 py-1.5">
                  <img src={item.image_url} alt={item.name} className="w-6 h-6 rounded-lg object-cover" />
                  <span className="text-xs font-medium text-[#2B2D42]">{item.name} x{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm border-t border-[#F1E9E7] pt-3">
              <div className="text-xs text-[#6D6875]">
                {order.delivery_address.city}, {order.delivery_address.state} | {order.payment_method.replace("_", " ")}
              </div>
              <span className="font-['Nunito'] font-black text-[#2B2D42]">${order.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-full bg-white border border-[#F1E9E7] disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-[#2B2D42]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-full bg-white border border-[#F1E9E7] disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append("search", search);
      const { data } = await axios.get(`${API}/admin/users?${params}`, { withCredentials: true });
      setUsers(data.users);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    }
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await axios.put(`${API}/admin/users/${userId}/role`, { role: newRole }, { withCredentials: true });
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update role");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user? Their cart and data will be removed.")) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { withCredentials: true });
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6D6875]" />
          <input
            data-testid="admin-user-search"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#FFFAF6] border border-[#F1E9E7] focus:border-[#FFB3A7] outline-none text-sm"
          />
        </div>
        <span className="text-sm text-[#6D6875] font-medium">{total} users</span>
      </div>

      <div className="bg-white rounded-[2rem] border border-[#F1E9E7] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F1E9E7] bg-[#FFFAF6]">
                <th className="text-left px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">Joined</th>
                <th className="text-right px-4 py-3 font-bold text-[#6D6875] text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} data-testid={`admin-user-row-${u._id}`} className="border-b border-[#F1E9E7] last:border-0 hover:bg-[#FFFAF6]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C8B6FF]/30 flex items-center justify-center text-sm font-bold text-[#2B2D42]">
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="font-semibold text-[#2B2D42]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6D6875]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.role === "admin" ? "bg-[#C8B6FF] text-[#2B2D42]" : "bg-[#F1E9E7] text-[#6D6875]"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6D6875] text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        data-testid={`admin-toggle-role-${u._id}`}
                        onClick={() => toggleRole(u._id, u.role)}
                        title={u.role === "admin" ? "Demote to user" : "Promote to admin"}
                        className="p-2 rounded-xl bg-[#C8B6FF]/10 hover:bg-[#C8B6FF]/20 transition-all"
                      >
                        {u.role === "admin" ? <ShieldCheck className="w-4 h-4 text-[#C8B6FF]" /> : <Shield className="w-4 h-4 text-[#6D6875]" />}
                      </button>
                      <button
                        data-testid={`admin-delete-user-${u._id}`}
                        onClick={() => deleteUser(u._id)}
                        className="p-2 rounded-xl bg-[#FF9999]/10 hover:bg-[#FF9999]/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-[#FF9999]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-full bg-white border border-[#F1E9E7] disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-[#2B2D42]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-full bg-white border border-[#F1E9E7] disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${API}/admin/stats`, { withCredentials: true })
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div className="px-4 md:px-12 pb-12" data-testid="admin-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8">
          <h1 className="font-['Nunito'] font-black text-3xl text-[#2B2D42] flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#C8B6FF]" />
            Admin Panel
          </h1>
          <p className="text-[#6D6875] mt-1">Manage products, orders, and accounts</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={DollarSign} label="Revenue" value={`$${stats.total_revenue.toFixed(2)}`} color="bg-[#B9FBC0]" />
            <StatCard icon={ShoppingCart} label="Orders" value={stats.total_orders} color="bg-[#A0C4FF]" />
            <StatCard icon={Package} label="Products" value={stats.total_products} color="bg-[#FFB3A7]" />
            <StatCard icon={Users} label="Users" value={stats.total_users} color="bg-[#C8B6FF]" />
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-[2rem] border border-[#F1E9E7] flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#FDE68A]" />
              <div>
                <p className="text-xs text-[#6D6875]">Pending</p>
                <p className="font-['Nunito'] font-black text-lg text-[#2B2D42]">{stats.pending_orders}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-[2rem] border border-[#F1E9E7] flex items-center gap-3">
              <Truck className="w-5 h-5 text-[#C8B6FF]" />
              <div>
                <p className="text-xs text-[#6D6875]">Shipped</p>
                <p className="font-['Nunito'] font-black text-lg text-[#2B2D42]">{stats.shipped_orders}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-[2rem] border border-[#F1E9E7] flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#B9FBC0]" />
              <div>
                <p className="text-xs text-[#6D6875]">Delivered</p>
                <p className="font-['Nunito'] font-black text-lg text-[#2B2D42]">{stats.delivered_orders}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white border border-[#F1E9E7] rounded-full p-1 h-auto">
            <TabsTrigger
              value="products"
              data-testid="admin-tab-products"
              className="rounded-full px-6 py-2.5 text-sm font-bold data-[state=active]:bg-[#FFB3A7] data-[state=active]:text-[#2B2D42] data-[state=active]:shadow-[0_2px_10px_rgba(255,179,167,0.3)]"
            >
              <Package className="w-4 h-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              data-testid="admin-tab-orders"
              className="rounded-full px-6 py-2.5 text-sm font-bold data-[state=active]:bg-[#A0C4FF] data-[state=active]:text-[#2B2D42] data-[state=active]:shadow-[0_2px_10px_rgba(160,196,255,0.3)]"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Orders
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-testid="admin-tab-users"
              className="rounded-full px-6 py-2.5 text-sm font-bold data-[state=active]:bg-[#C8B6FF] data-[state=active]:text-[#2B2D42] data-[state=active]:shadow-[0_2px_10px_rgba(200,182,255,0.3)]"
            >
              <Users className="w-4 h-4 mr-2" /> Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <AdminProducts />
          </TabsContent>
          <TabsContent value="orders">
            <AdminOrders />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
