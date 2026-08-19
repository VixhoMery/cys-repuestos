import { ShoppingCart } from "lucide-react";

import CartItem from "./CartItem";

type CartProduct = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
};

type CartProps = {
  items: CartProduct[];

  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
  onCancel: () => void;
};

function Cart({
  items,
  onIncrease,
  onDecrease,
  onRemove,
  onCancel,
}: CartProps) {
  const total = items.reduce(
    (accumulator, item) => accumulator + item.price * item.quantity,
    0,
  );

  return (
    <aside
      className="
        sticky top-8
        flex max-h-[calc(100vh-4rem)]
        flex-col
        rounded-2xl
        border border-slate-200
        bg-white
        shadow-sm
      "
    >
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <ShoppingCart size={22} className="text-blue-600" />

          <h2 className="text-xl font-semibold text-slate-900">Venta actual</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {items.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShoppingCart
              size={42}
              className="mx-auto mb-3"
              strokeWidth={1.5}
            />

            <p>Agrega productos para comenzar una venta.</p>
          </div>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.id}
              name={item.name}
              price={item.price}
              quantity={item.quantity}
              stock={item.stock}
              onIncrease={() => onIncrease(item.id)}
              onDecrease={() => onDecrease(item.id)}
              onRemove={() => onRemove(item.id)}
            />
          ))
        )}
      </div>

      <div className="border-t border-slate-200 p-5">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-slate-500">Total</span>

          <span className="text-2xl font-bold text-slate-900">
            ${total.toLocaleString("es-CL")}
          </span>
        </div>

        <button
          type="button"
          disabled={items.length === 0}
          className="
      w-full rounded-xl
      bg-blue-600
      px-5 py-3
      font-medium text-white
      transition
      hover:bg-blue-700
      disabled:cursor-not-allowed
      disabled:bg-slate-300
    "
        >
          Finalizar venta
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={items.length === 0}
          className="
      mt-3 w-full rounded-xl
      border border-red-200
      bg-red-50
      px-5 py-3
      font-medium text-red-600
      transition
      hover:bg-red-100
      disabled:cursor-not-allowed
      disabled:border-slate-200
      disabled:bg-slate-100
      disabled:text-slate-400
    "
        >
          Cancelar venta
        </button>
      </div>
    </aside>
  );
}

export default Cart;
