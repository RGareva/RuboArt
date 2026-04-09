import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";
import { MapPin, Phone, Truck, CheckCircle2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    name: "", street: "", city: "", state: "", zip_code: "", phone: "",
  });

  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const { data } = await axios.get(`${API}/shipping/calculate`, { withCredentials: true });
        setShipping(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchShipping();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/orders`, { delivery_address: address }, { withCredentials: true });
      clearCart();
      toast.success("Order placed successfully! Pay on delivery.");
      navigate("/orders");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="px-4 md:px-12 pb-12 text-center py-20" data-testid="empty-checkout">
        <p className="font-['Nunito'] font-bold text-xl text-[#2B2D42]">Your cart is empty</p>
        <button
          onClick={() => navigate("/")}
          data-testid="continue-shopping-btn"
          className="mt-4 px-6 py-3 rounded-full bg-[#FFB3A7] text-[#2B2D42] font-bold shadow-[0_4px_14px_rgba(255,179,167,0.4)] transition-all active:scale-95"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-12 pb-12 max-w-4xl mx-auto" data-testid="checkout-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-['Nunito'] font-black text-3xl text-[#2B2D42] mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Address Form */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 border border-[#F1E9E7] shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <h2 className="font-['Nunito'] font-bold text-xl text-[#2B2D42] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#FFB3A7]" /> Delivery Address
              </h2>
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-3">
                <input
                  data-testid="checkout-name-input"
                  type="text"
                  placeholder="Full Name"
                  required
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFFAF6] border-2 border-transparent focus:bg-white focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
                />
                <input
                  data-testid="checkout-street-input"
                  type="text"
                  placeholder="Street Address"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFFAF6] border-2 border-transparent focus:bg-white focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    data-testid="checkout-city-input"
                    type="text"
                    placeholder="City"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFFAF6] border-2 border-transparent focus:bg-white focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
                  />
                  <input
                    data-testid="checkout-state-input"
                    type="text"
                    placeholder="State"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFFAF6] border-2 border-transparent focus:bg-white focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    data-testid="checkout-zip-input"
                    type="text"
                    placeholder="ZIP Code"
                    required
                    value={address.zip_code}
                    onChange={(e) => setAddress({ ...address, zip_code: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFFAF6] border-2 border-transparent focus:bg-white focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
                  />
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6D6875]" />
                    <input
                      data-testid="checkout-phone-input"
                      type="tel"
                      placeholder="Phone"
                      required
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#FFFAF6] border-2 border-transparent focus:bg-white focus:border-[#FFB3A7] outline-none transition-all text-[#2B2D42] placeholder:text-[#6D6875]/50"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-[2rem] p-6 border border-[#F1E9E7] shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <h2 className="font-['Nunito'] font-bold text-xl text-[#2B2D42] mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#B9FBC0]" /> Payment Method
              </h2>
              <div className="bg-[#B9FBC0]/20 rounded-2xl p-4 border-2 border-[#B9FBC0] flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2B2D42]" />
                <div>
                  <p className="font-bold text-[#2B2D42]" data-testid="payment-method-label">Pay on Delivery</p>
                  <p className="text-sm text-[#6D6875]">Pay with cash when your order arrives</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-[2rem] p-6 border border-[#F1E9E7] shadow-[0_8px_30px_rgba(0,0,0,0.03)] sticky top-28" data-testid="order-summary">
              <h2 className="font-['Nunito'] font-bold text-xl text-[#2B2D42] mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {cart.items?.map((item) => (
                  <div key={item.product_id} className="flex justify-between items-center text-sm">
                    <span className="text-[#6D6875] truncate flex-1 mr-2">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-bold text-[#2B2D42]">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {shipping && (
                <>
                  <div className="border-t border-[#F1E9E7] pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6D6875]">Subtotal</span>
                      <span className="text-[#2B2D42]" data-testid="checkout-subtotal">${shipping.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6D6875]">Delivery Fee</span>
                      <span className="text-[#2B2D42]" data-testid="checkout-delivery-fee">
                        {shipping.delivery_fee === 0 ? "FREE" : `$${shipping.delivery_fee.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6D6875]">Courier Tax (2.5%)</span>
                      <span className="text-[#2B2D42]" data-testid="checkout-courier-tax">${shipping.courier_tax.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="border-t border-[#F1E9E7] pt-3 mt-3 flex justify-between">
                    <span className="font-['Nunito'] font-bold text-[#2B2D42]">Total</span>
                    <span className="font-['Nunito'] font-black text-xl text-[#2B2D42]" data-testid="checkout-total">
                      ${shipping.total.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <button
                data-testid="place-order-button"
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full py-3.5 mt-4 rounded-full bg-[#FFB3A7] text-[#2B2D42] font-bold shadow-[0_4px_14px_rgba(255,179,167,0.4)] hover:shadow-[0_6px_20px_rgba(255,179,167,0.6)] transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>

              <p className="text-xs text-[#6D6875] text-center mt-3">
                Free delivery on orders over $100
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
