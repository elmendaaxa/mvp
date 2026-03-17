import { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Building2, QrCode, LogOut, Lock, Database, Link as LinkIcon, Layout, Eye, PlusCircle } from 'lucide-react';

export default function Admin() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [errorStatus, setErrorStatus] = useState('');
  
  // States para el Dashboard Jerárquico B2B
  const [view, setView] = useState('hotels'); // 'hotels' | 'hotel_detail' | 'restaurant_editor'
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelRestaurants, setHotelRestaurants] = useState([]);
  
  const [allRestaurants, setAllRestaurants] = useState([]); // Para el combobox de vincular
  
  const [selectedRest, setSelectedRest] = useState(null);
  const [editorMenus, setEditorMenus] = useState([]);
  const [roomId, setRoomId] = useState('402');

  // Carga inicial de Hoteles
  const loadHotels = async () => {
      try {
          const res = await fetch(`${API_URL}/api/admin/hotels`);
          if (res.ok) setHotels(await res.json());
      } catch (err) { console.error(err); }
  };

  const loadHotelRestaurants = async (hId) => {
      try {
          const res = await fetch(`${API_URL}/api/admin/hotels/${hId}/restaurants`);
          if (res.ok) setHotelRestaurants(await res.json());
          
          // También cargamos todos para el selector de vinculación
          const resAll = await fetch(`${API_URL}/api/admin/restaurants`);
          if (resAll.ok) setAllRestaurants(await resAll.json());
      } catch (err) { console.error(err); }
  };

  const loadMenus = async (rId) => {
      try {
          const res = await fetch(`${API_URL}/api/admin/menus/${rId}`);
          if (res.ok) setEditorMenus(await res.json());
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const logged = localStorage.getItem('admin_logged');
    if (logged === 'true') {
      setIsAuthenticated(true);
      loadHotels();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Admin123!') { 
      setIsAuthenticated(true);
      localStorage.setItem('admin_logged', 'true');
      setErrorStatus('');
      loadHotels();
    } else {
      setErrorStatus('Contraseña incorrecta');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_logged');
  };

  const appBaseUrl = window.location.origin;
  const qrUrl = selectedHotel ? `${appBaseUrl}/?h=${selectedHotel.id}&r=${roomId}` : '';

  const downloadQR = () => {
    const canvas = document.querySelector(`#qr-main-canvas`);
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      const safeHotelName = selectedHotel.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadLink.download = `QR_${safeHotelName}_Hab${roomId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  // --- COMPONENTE LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 animate-fade-in">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-gray-500 mb-8 text-sm">Ingresa la contraseña maestra para administrar la plataforma.</p>
            
            <form onSubmit={handleLogin}>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-gray-900 outline-none text-center tracking-widest"
                    placeholder="••••••••"
                    required
                />
                {errorStatus && <p className="text-red-500 text-sm mb-4">{errorStatus}</p>}
                
                <button type="submit" className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors">
                    Desbloquear Panel
                </button>
            </form>
        </div>
      </div>
    );
  }

  // --- COMPONENTE DASHBOARD JERÁRQUICO ---
  return (
    <div className="p-4 max-w-4xl mx-auto pb-32 animate-fade-in">
      <div className="flex justify-between items-end mb-6 border-b pb-4">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="text-rose-500" /> Admin Dashboard
            </h2>
            <p className="text-gray-500 text-sm mt-1">Gestión Centralizada Jerárquica</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 text-sm hover:underline">
            <LogOut className="w-4 h-4" /> Salir
        </button>
      </div>

      {/* Breadcrumbs Nav */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500 font-medium">
          <button onClick={() => { setView('hotels'); loadHotels(); }} className="hover:text-gray-900 transition-colors">Hoteles</button>
          {view !== 'hotels' && selectedHotel && (
              <>
                <span>/</span>
                <button onClick={() => { setView('hotel_detail'); loadHotelRestaurants(selectedHotel.id); }} className="hover:text-gray-900 transition-colors">
                    {selectedHotel.name}
                </button>
              </>
          )}
          {view === 'restaurant_editor' && selectedRest && (
              <>
                <span>/</span>
                <span className="text-rose-600">Menú: {selectedRest.name}</span>
              </>
          )}
      </div>

      {/* VISTA 1: Lista de Hoteles */}
      {view === 'hotels' && (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Tus Hoteles Activos</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {hotels.map(h => (
                    <div key={h.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 mb-1">{h.name}</h4>
                        <p className="text-xs text-gray-400 mb-4">{h.address || 'Sin dirección'}</p>
                        <button 
                          onClick={() => { setSelectedHotel(h); setView('hotel_detail'); loadHotelRestaurants(h.id); }}
                          className="w-full bg-rose-50 text-rose-600 font-medium py-2 rounded-xl hover:bg-rose-100 transition-colors text-sm"
                        >
                            Gestionar Restaurantes
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                <h4 className="font-bold mb-3 text-sm flex items-center gap-2"><PlusCircle className="w-4 h-4 text-green-500"/> Dar de alta Nuevo Hotel</h4>
                <form 
                  className="flex gap-2"
                  onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                          await fetch(`${API_URL}/api/admin/hotels`, {
                              method: 'POST', headers: {'Content-Type': 'application/json'},
                              body: JSON.stringify({ name: e.target.hName.value, address: e.target.hAddr.value })
                          });
                          e.target.reset();
                          loadHotels();
                      } catch(err) { alert('Error conectando a BD'); }
                  }}
                >
                    <input name="hName" required type="text" placeholder="Nombre (Ej. Hotel Paqui)" className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-gray-900" />
                    <input name="hAddr" type="text" placeholder="Dirección corta" className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-gray-900" />
                    <button type="submit" className="bg-gray-900 text-white font-medium px-4 py-2 rounded-xl text-sm hover:bg-gray-800">Añadir</button>
                </form>
            </div>
        </div>
      )}

      {/* VISTA 2: Detalle del Hotel (Sus Restaurantes y QRs) */}
      {view === 'hotel_detail' && selectedHotel && (
        <div className="animate-fade-in space-y-6">
            
            {/* Generador de QR para el Hotel Activo */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-3xl shadow-lg text-white flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                    <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                        <QrCode className="w-6 h-6 text-rose-500" /> Generador de QR 
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">Crea el QR de acceso para poner en las mesas o habitaciones de <strong>{selectedHotel.name}</strong>.</p>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Número de Habitación / Mesa</label>
                        <input 
                            type="text" 
                            value={roomId} 
                            onChange={(e) => setRoomId(e.target.value)} 
                            className="w-full max-w-xs bg-gray-800 border border-gray-600 rounded-xl px-4 py-2 outline-none focus:border-rose-500 transition-colors text-white" 
                            placeholder="Ej. 402, Mesa 3" 
                        />
                    </div>
                </div>
                
                <div className="flex flex-col items-center bg-white p-4 rounded-2xl shadow-inner">
                    <QRCodeCanvas id="qr-main-canvas" value={qrUrl} size={150} level={"H"} includeMargin={true} />
                    <button onClick={downloadQR} className="mt-3 flex items-center gap-2 text-xs font-bold bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors w-full justify-center">
                        <Download className="w-4 h-4" /> Descargar PNG
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-rose-500" /> Restaurantes sirviendo a {selectedHotel.name}</h3>
                
                {hotelRestaurants.length === 0 ? (
                    <p className="text-sm text-gray-500 mb-4">Aún no has conectado ningún restaurante a este hotel.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {hotelRestaurants.map(r => (
                            <div key={r.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex justify-between items-center group">
                                <div>
                                    <h4 className="font-bold text-gray-900">{r.name}</h4>
                                    <p className="text-xs text-gray-400">Stripe ID: {r.stripe_account_id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => { setSelectedRest(r); setView('restaurant_editor'); loadMenus(r.id); }}
                                      className="bg-gray-900 text-white font-medium px-4 py-2 rounded-xl text-xs hover:bg-gray-800"
                                    >
                                        Modo Editor
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Formulario para VINCULAR y CREAR nuevos restaurantes a este hotel */}
                <div className="border-t pt-4">
                    <h4 className="font-bold text-sm mb-3 text-gray-700">Añadir Restaurante para {selectedHotel.name}</h4>
                    <form 
                        className="flex gap-2 mb-2"
                        onSubmit={async(e) => {
                            e.preventDefault();
                            try {
                                await fetch(`${API_URL}/api/admin/links`, {
                                    method: 'POST', headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({ hotelId: selectedHotel.id, restaurantId: e.target.existingRestId.value })
                                });
                                loadHotelRestaurants(selectedHotel.id);
                            } catch(err) { alert('Error vinculando'); }
                        }}
                    >
                        <select name="existingRestId" required className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-gray-900">
                            <option value="">Selecciona uno existente en BD...</option>
                            {allRestaurants.map(ar => <option key={ar.id} value={ar.id}>{ar.name} (ID: {ar.id})</option>)}
                        </select>
                        <button type="submit" className="bg-gray-100 text-gray-900 font-medium px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-200"><LinkIcon className="w-4 h-4 inline" /> Vincular</button>
                    </form>

                    <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 h-px bg-gray-200"></div><span className="text-xs text-gray-400 font-bold uppercase tracking-wider">O CREA UNO NUEVO</span><div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <form 
                        className="flex gap-2"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                // 1. Crea el restaurante
                                const res = await fetch(`${API_URL}/api/admin/restaurants`, {
                                    method: 'POST', headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({ name: e.target.rName.value, stripeAccountId: e.target.rStripe.value })
                                });
                                const data = await res.json();
                                if(data.success) {
                                    // 2. Lo vincula automáticamente al hotel actual
                                    await fetch(`${API_URL}/api/admin/links`, {
                                        method: 'POST', headers: {'Content-Type': 'application/json'},
                                        body: JSON.stringify({ hotelId: selectedHotel.id, restaurantId: data.restaurant.id })
                                    });
                                    e.target.reset();
                                    loadHotelRestaurants(selectedHotel.id);
                                }
                            } catch(err) { alert('Error creando'); }
                        }}
                    >
                        <input name="rName" required type="text" placeholder="Nombre Comercial Restaurante" className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-gray-900" />
                        <input name="rStripe" required type="text" placeholder="Stripe acct_xxx" className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none font-mono focus:ring-1 focus:ring-gray-900" />
                        <button type="submit" className="bg-gray-900 text-white font-medium px-4 py-2 rounded-xl text-sm hover:bg-gray-800"><PlusCircle className="w-4 h-4 inline" /> Crear y Vincular</button>
                    </form>
                </div>

            </div>
        </div>
      )}

      {/* VISTA 3: Editor Visual de un Restaurante (Elementor-style) */}
      {view === 'restaurant_editor' && selectedRest && (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Panel de Construcción (Izquierda) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 self-start sticky top-20">
                <h4 className="font-bold text-gray-900 mb-1 flex items-center justify-between">
                    Editor Activo
                    <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    </div>
                </h4>
                <p className="text-xs text-gray-500 mb-4">{selectedRest.name} • Los cambios se guardan instantáneamente en la base de datos.</p>
                
                <form 
                className="space-y-3"
                onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                        const res = await fetch(`${API_URL}/api/admin/menus`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            restaurantId: selectedRest.id, 
                            name: e.target.mName.value, 
                            price: e.target.mPrice.value, 
                            description: e.target.mDesc.value,
                            imageUrl: e.target.mIcon.value || '🍲'
                        })
                        });
                        if (res.ok) { 
                            e.target.reset(); 
                            loadMenus(selectedRest.id); // Recargar preview
                        }
                    } catch (err) { alert('Error guardando en BD'); }
                }}
                >
                    <input name="mName" type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-rose-500 transition-shadow" placeholder="Título (Ej. Pizza Margarita)" />
                    <textarea name="mDesc" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-rose-500 transition-shadow" placeholder="Ingredientes detallados..."></textarea>
                    <div className="flex gap-2">
                        <input name="mPrice" type="number" step="0.01" required className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-rose-500 transition-shadow" placeholder="Precio ($ USD TPV)" />
                        <input name="mIcon" type="text" className="w-16 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none text-center transition-shadow" placeholder="Icono 🍕" defaultValue="🍕" />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-200 hover:scale-[1.02] transition-all text-sm mt-2">
                        + Publicar Plato en la App
                    </button>
                </form>
            </div>

            {/* Lienzo Preview (Derecha) */}
            <div className="bg-gray-100 p-4 rounded-3xl border-[6px] border-gray-900 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">
                <div className="absolute top-0 right-1/2 translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-xl z-20 flex justify-center items-end pb-1">
                    <div className="w-8 h-1 bg-gray-700 rounded-full"></div>
                </div>
                <div className="bg-white flex-1 rounded-2xl p-4 overflow-y-auto pt-8 flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b pb-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest"><Eye className="w-4 h-4 text-rose-500"/> App Preview</div>
                        <div className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">{API_URL.replace('http://', '').replace('https://', '')}</div>
                    </div>
                    
                    <h2 className="text-xl font-bold mb-4 text-gray-900">{selectedRest.name}</h2>
                    
                    {editorMenus.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 text-sm p-4 border-2 border-dashed border-gray-200 rounded-2xl">
                            <PlusCircle className="w-8 h-8 text-gray-300 mb-2"/>
                            La página está vacía. Añade platos en el editor.
                        </div>
                    ) : (
                        <div className="space-y-3 pb-10">
                            {editorMenus.map(m => (
                                <div key={m.id} className="flex gap-3 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-3 rounded-2xl transition-transform hover:scale-[1.02] cursor-default">
                                    <div className="w-16 h-16 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl flex items-center justify-center text-3xl shrink-0 shadow-inner">
                                    {m.image_url || '🍲'}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-start">
                                            <h5 className="font-bold text-[13px] text-gray-900 leading-tight">{m.name}</h5>
                                            <span className="font-black text-rose-500 text-xs">${parseFloat(m.price).toFixed(2)}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-snug pr-2">{m.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Fake Checkout Bar */}
                    <div className="mt-auto pt-4 bg-gradient-to-t from-white via-white to-transparent sticky bottom-0">
                        <div className="w-full bg-gray-900 text-white rounded-xl py-3 px-4 flex justify-between items-center opacity-90 text-sm">
                            <span className="font-medium flex items-center gap-2"><div className="w-5 h-5 bg-gray-800 rounded flex items-center justify-center text-[10px]">0</div> Pagar</span>
                            <span className="font-bold">$0.00</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
