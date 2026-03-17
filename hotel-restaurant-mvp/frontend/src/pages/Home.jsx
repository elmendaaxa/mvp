import { useNavigate } from 'react-router-dom';
import { QrCode, UtensilsCrossed } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  // Simulación: Qué pasaría al escanear el QR físico
  const handleScanQR = () => {
    // Escaner detecta URL: app.com/order?h=1&r=402
    navigate('/order?h=1&r=402');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-fade-in">
      
      <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-8 shadow-sm">
        <UtensilsCrossed className="w-12 h-12 text-rose-500" />
      </div>

      <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
        Servicio a la Habitación
      </h2>
      
      <p className="text-gray-500 text-lg mb-12 max-w-sm">
        Pide comida de los mejores restaurantes locales directamente a tu puerta.
      </p>

      {/* Botón Simulador */}
      <button 
        onClick={handleScanQR}
        className="group relative w-full max-w-xs flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-2xl text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 shadow-lg shadow-rose-200 transition-all active:scale-95"
      >
        <span className="absolute left-0 inset-y-0 flex items-center pl-4">
          <QrCode className="h-6 w-6 text-rose-100 group-hover:text-white transition-colors" aria-hidden="true" />
        </span>
        Simular Escaneo de QR
      </button>

      <p className="mt-6 text-sm text-gray-400">
        Demo: Navegará a Hotel 1, Habitación 402
      </p>
    </div>
  );
}
