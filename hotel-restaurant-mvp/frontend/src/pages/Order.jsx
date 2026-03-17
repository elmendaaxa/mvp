import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';

// API real del backend (configurada en Vercel via VITE_API_URL o default localhost)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Mock Data (En prod, vendría de un endpoint GET /menus?restaurantId=X)
const MOCK_RESTAURANT = {
  id: 1, // Este ID debe coincidir con uno que exista en tu BD o se creará en el backend
  name: "La Burger Gourmet",
  menu: [
    { id: 1, name: "Hamburguesa Clásica", description: "Carne de res 200g, queso cheddar, lechuga, tomate", price: 12.50, image: "🍔" },
    { id: 2, name: "Papas Fritas Trufadas", description: "Papas rústicas con aceite de trufa blanca y parmesano", price: 6.00, image: "🍟" },
    { id: 3, name: "Batido de Vainilla", description: "Helado artesanal y leche fresca", price: 4.50, image: "🥤" }
  ]
};

export default function Order() {
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get('h');
  const roomId = searchParams.get('r');

  const [cart, setCart] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  // Validación de Parámetros QR
  if (!hotelId || !roomId) {
    return (
      <div className="p-6 text-center text-red-500 mt-20">
        <h2 className="text-xl font-bold mb-2">QR Inválido</h2>
        <p>Por favor, escanea el código QR de tu habitación nuevamente.</p>
      </div>
    );
  }

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, menuId: item.id }]; // menuId for the backend
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) return { ...i, quantity: Math.max(0, i.quantity - 1) };
      return i;
    }).filter(i => i.quantity > 0));
  };

  const getTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getItemQuantity = (itemId) => cart.find(i => i.id === itemId)?.quantity || 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setErrorStatus(null);

    try {
      const response = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: parseInt(hotelId), // Viene del QR
          roomId: roomId,             // Viene del QR
          restaurantId: MOCK_RESTAURANT.id, 
          cartItems: cart.map(i => ({ menuId: i.menuId, quantity: i.quantity })),
          successUrl: `${window.location.origin}/success`,
          cancelUrl: window.location.href, // Volver a esta misma página
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      // Redirigir al Checkout de Stripe alojado
      if (data.url) {
        window.location.href = data.url;
      }

    } catch (err) {
      console.error(err);
      setErrorStatus(err.message);
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="animate-slide-up pb-32">
      {/* Header Info */}
      <div className="bg-white px-6 py-6 shadow-sm rounded-b-3xl mb-6">
        <div className="flex justify-between items-center bg-rose-50 p-4 rounded-2xl border border-rose-100">
           <div>
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest">Entregando en</p>
            <p className="text-lg font-bold text-gray-900">Habitación {roomId}</p>
           </div>
           <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Hotel ID</p>
            <p className="text-gray-700 font-medium">#{hotelId}</p>
           </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
            {MOCK_RESTAURANT.name}
        </h2>

        {errorStatus && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                {errorStatus}
            </div>
        )}

        <div className="space-y-4">
          {MOCK_RESTAURANT.menu.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform active:scale-[0.98]">
              
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                {item.image}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1 mb-2 leading-snug">{item.description}</p>
                <div className="flex items-center justify-between mt-1">
                    <p className="font-extrabold text-rose-500">${item.price.toFixed(2)}</p>
                    
                    {getItemQuantity(item.id) === 0 ? (
                    <button 
                        onClick={() => addToCart(item)}
                        className="bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    ) : (
                    <div className="flex items-center gap-3 bg-gray-100 rounded-full px-1 py-1 shadow-inner">
                        <button 
                        onClick={() => removeFromCart(item.id)}
                        className="bg-white p-1 rounded-full shadow-sm text-gray-600 hover:text-gray-900"
                        >
                        <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-sm min-w-[1ch] text-center">{getItemQuantity(item.id)}</span>
                        <button 
                        onClick={() => addToCart(item)}
                        className="bg-rose-500 p-1 rounded-full shadow-sm text-white hover:bg-rose-600"
                        >
                        <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Fixed Bottom Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 glass rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
          <div className="max-w-md mx-auto">
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full flex items-center justify-between bg-gray-900 text-white p-4 rounded-2xl shadow-xl hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-75"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gray-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="font-bold">{cart.reduce((s,i) => s + i.quantity, 0)}</span>
                </div>
                <span className="font-medium text-gray-300">Pagar Pedido</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">${getTotal().toFixed(2)}</span>
                {isCheckingOut && <Loader2 className="w-5 h-5 animate-spin text-rose-400" />}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
