import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // El backend podría enviar orderId en la redirección de Stripe
  const orderId = searchParams.get('orderId') || '10294';

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-fade-in">
      
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 shadow-sm">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
      </div>

      <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
        ¡Pedido Confirmado!
      </h2>
      
      <p className="text-gray-500 text-lg mb-8 max-w-sm">
        El restaurante ha recibido tu orden #{orderId} y ya la está preparando.
      </p>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-full mb-8">
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mb-1">Estado</p>
        <p className="text-lg font-bold text-gray-900 mb-4">Preparando 👨‍🍳</p>
        
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-green-500 w-1/3 h-full rounded-full animate-pulse"></div>
        </div>
      </div>

      <button 
        onClick={() => navigate('/')}
        className="w-full max-w-xs flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-2xl text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all active:scale-95"
      >
        Volver al Inicio
      </button>

    </div>
  );
}
