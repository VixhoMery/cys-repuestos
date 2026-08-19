import { useState } from "react";
import { Search } from "lucide-react";

import PosProductCard from "../components/pos/PosProductCard";
import Cart from "../components/pos/Cart";

// ------------------------------------
// Productos mock
// Después vendrán desde el backend
// ------------------------------------

const products = [
  {
    id: 1,
    name: "Alternador Toyota Yaris",
    brand: "Bosch",
    price: 180000,
    stock: 4,
  },
  {
    id: 2,
    name: "Pastillas de freno",
    brand: "Brembo",
    price: 45990,
    stock: 12,
  },
  {
    id: 3,
    name: "Filtro de aceite",
    brand: "Mann Filter",
    price: 8990,
    stock: 2,
  },
  {
    id: 4,
    name: "Neumático 195/65 R15",
    brand: "Michelin",
    price: 74990,
    stock: 8,
  },
];

// ------------------------------------
// Tipo de producto dentro de la venta
// ------------------------------------

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
};

// ------------------------------------
// Componente POS
// ------------------------------------

function POS() {
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);

  // ------------------------------------
  // Buscar productos
  // ------------------------------------

  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase();

    return (
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query)
    );
  });

  // ------------------------------------
  // Agregar producto a la venta
  // ------------------------------------

  const addProduct = (id: number) => {
    const product = products.find((product) => product.id === id);

    if (!product || product.stock === 0) {
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === id);

      // Si ya está en el carrito,
      // aumenta la cantidad
      if (existing) {
        // No permitir superar el stock
        if (existing.quantity >= existing.stock) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      // Si todavía no existe,
      // lo agrega con cantidad 1
      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          quantity: 1,
        },
      ];
    });
  };

  // ------------------------------------
  // Aumentar cantidad
  // ------------------------------------

  const increaseQuantity = (id: number) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id && item.quantity < item.stock
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  };

  // ------------------------------------
  // Disminuir cantidad
  // ------------------------------------

  const decreaseQuantity = (id: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  // ------------------------------------
  // Eliminar producto de la venta
  // ------------------------------------

  const removeProduct = (id: number) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  // ------------------------------------
  // Cancelar venta completa
  // ------------------------------------

  const cancelSale = () => {
    setCart([]);
  };

  // ------------------------------------
  // Render
  // ------------------------------------

  return (
    <section>
      {/* Encabezado */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Punto de Venta</h1>

        <p className="mt-1 text-slate-500">
          Selecciona los productos para registrar una nueva venta.
        </p>
      </header>

      {/* Contenido principal */}
      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        {/* Productos */}
        <div>
          {/* Buscador */}
          <div className="relative mb-6 max-w-xl">
            <Search
              size={20}
              className="
                absolute left-4 top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto..."
              className="
                w-full rounded-xl
                border border-slate-200
                bg-white
                py-3 pl-12 pr-4
                outline-none
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>

          {/* Grid de productos */}
          <div
            className="
              grid grid-cols-1
              gap-5
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <PosProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  brand={product.brand}
                  price={product.price}
                  stock={product.stock}
                  onAdd={addProduct}
                />
              ))
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                No se encontraron productos.
              </div>
            )}
          </div>
        </div>

        {/* Venta actual */}
        <Cart
          items={cart}
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
          onRemove={removeProduct}
          onCancel={cancelSale}
        />
      </div>
    </section>
  );
}

export default POS;
