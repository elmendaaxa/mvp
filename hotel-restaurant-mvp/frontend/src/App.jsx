import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Order from './pages/Order';
import Success from './pages/Success';
import Admin from './pages/Admin';

function App() {
  const [lang, setLang] = useState('es');

  const toggleLang = () => {
    setLang(lang === 'es' ? 'en' : 'es');
  };
  return (
    <Router>
      <div className="min-h-screen bg-[#F7F7F9]">
        {/* Navbar sencilla minimalista */}
        <nav className="bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">
              RoomService
            </Link>
            
            <div className="flex items-center gap-4">
               {/* Banderita de idioma */}
               <button 
                onClick={toggleLang} 
                className="text-2xl hover:scale-110 transition-transform focus:outline-none" 
                title="Cambiar idioma"
               >
                  {lang === 'es' ? '🇪🇸' : '🇬🇧'}
               </button>
            </div>
          </div>
        </nav>

        {/* Área Principal de Contenido (adaptada para móviles) */}
        <main className="max-w-md mx-auto relative pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/order" element={<Order />} />
            <Route path="/success" element={<Success />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
