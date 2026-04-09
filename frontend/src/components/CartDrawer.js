import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../components/ui/sheet";
import { useCart } from "../contexts/CartContext";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function CartDrawer() {
  const { cart, cartCount, cartSubtotal, cartOpen, setCartOpen, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const handleUpdateQty = async (productId, qty) => {
    try {
      if (qty <= 0) {
        await removeItem(productId);
        toast.success("Item removed from cart");
      } else {
        await updateQuantity(productId, qty);
      }
    } catch {
      toast.error("Failed to update cart");
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeItem(productId);
      toast.success("Item removed from cart");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="bg-[#FFFAF6] rounded-l-[2rem] border-l border-[#F1E9E7] shadow-[-20px_0_40px_rgba(0,0,0,0.05)] flex flex-col w-full sm:max-w-md p-0">
        <div className="p-6 pb-0">
          <SheetHeader>
            <SheetTitle className="font-['Nunito'] font-black text-2xl text-[#2B2D42] flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#FFB3A7]" />
              Your Cart ({cartCount})
            </SheetTitle>
            <SheetDescription className="text-[#6D6875]">
              Review your items before checkout
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 mt-4 space-y-3">
          {(!cart.items || cart.items.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#6D6875]">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-['Nunito'] font-semibold">Your cart is empty</p>
              <p className="text-sm">Add some cute items!</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.product_id}
                data-testid={`cart-item-${item.product_id}`}
                className="flex gap-3 bg-white p-3 rounded-2xl border border-[#F1E9E7]"
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover bg-[#FFFAF6] flex-shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="font-['Nunito'] font-bold text-sm text-[#2B2D42] line-clamp-1">{item.name}</h4>
                    <p className="text-[#FFB3A7] font-bold text-sm">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-[#FFFAF6] rounded-full px-2 py-1">
                      <button
                        data-testid={`decrease-qty-${item.product_id}`}
                        onClick={() => handleUpdateQty(item.product_id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#FFB3A7]/20 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        data-testid={`increase-qty-${item.product_id}`}
                        onClick={() => handleUpdateQty(item.product_id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#FFB3A7]/20 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      data-testid={`remove-item-${item.product_id}`}
                      onClick={() => handleRemove(item.product_id)}
                      className="p-1.5 rounded-full hover:bg-[#FF9999]/20 transition-colors text-[#FF9999]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.items && cart.items.length > 0 && (
          <div className="border-t border-[#F1E9E7] p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#6D6875] font-medium">Subtotal</span>
              <span className="font-['Nunito'] font-black text-xl text-[#2B2D42]">${cartSubtotal.toFixed(2)}</span>
            </div>
            <button
              data-testid="checkout-button"
              onClick={() => {
                setCartOpen(false);
                navigate("/checkout");
              }}
              className="w-full py-3.5 rounded-full bg-[#FFB3A7] text-[#2B2D42] font-bold text-base shadow-[0_4px_14px_rgba(255,179,167,0.4)] hover:shadow-[0_6px_20px_rgba(255,179,167,0.6)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
