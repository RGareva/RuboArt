import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed", color: "bg-[#A0C4FF]", icon: CheckCircle },
  shipped: { label: "Shipped", color: "bg-[#C8B6FF]", icon: Truck },
  delivered: { label: "Delivered", color: "bg-[#B9FBC0]", icon: Package },
  cancelled: { label: "Cancelled", color: "bg-[#FF9999]", icon: XCircle },
  pending: { label: "Pending", color: "bg-[#FDE68A]", icon: Clock },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(`${API}/orders`, { withCredentials: true });
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="px-4 md:px-12 pb-12 max-w-4xl mx-auto" data-testid="orders-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-['Nunito'] font-black text-3xl text-[#2B2D42] mb-8">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] h-32 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-[#F1E9E7]" data-testid="no-orders">
            <Package className="w-16 h-16 mx-auto text-[#F1E9E7] mb-4" />
            <h3 className="font-['Nunito'] font-bold text-xl text-[#2B2D42]">No orders yet</h3>
            <p className="text-[#6D6875]">Start shopping to see your orders here</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="orders-list">
            {orders.map((order, index) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={order.id}
                  data-testid={`order-${order.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-[2rem] p-6 border border-[#F1E9E7] shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-[#6D6875] font-medium">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-[#6D6875]">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      data-testid={`order-status-${order.id}`}
                      className={`${config.color} text-[#2B2D42] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div key={item.product_id} className="flex items-center gap-3">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover bg-[#FFFAF6]"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#2B2D42]">{item.name}</p>
                          <p className="text-xs text-[#6D6875]">
                            Qty: {item.quantity} x ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#2B2D42]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#F1E9E7] pt-3 flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-[#6D6875]">Subtotal: </span>
                      <span className="font-bold text-[#2B2D42]">${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[#6D6875]">Delivery: </span>
                      <span className="font-bold text-[#2B2D42]">
                        {order.delivery_fee === 0 ? "FREE" : `$${order.delivery_fee.toFixed(2)}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6D6875]">Tax: </span>
                      <span className="font-bold text-[#2B2D42]">${order.courier_tax.toFixed(2)}</span>
                    </div>
                    <div className="ml-auto">
                      <span className="text-[#6D6875]">Total: </span>
                      <span className="font-['Nunito'] font-black text-lg text-[#2B2D42]">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-[#6D6875] bg-[#FFFAF6] rounded-xl p-3">
                    <p className="font-bold text-[#2B2D42] mb-1">Delivery to:</p>
                    <p>
                      {order.delivery_address.name}, {order.delivery_address.street}
                    </p>
                    <p>
                      {order.delivery_address.city}, {order.delivery_address.state}{" "}
                      {order.delivery_address.zip_code}
                    </p>
                    <p>Phone: {order.delivery_address.phone}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
