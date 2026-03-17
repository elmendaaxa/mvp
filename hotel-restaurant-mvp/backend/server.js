require('dotenv').config();
const express = require('express');
const cors = require('cors');
// La clave secreta de Stripe va en el archivo .env como STRIPE_SECRET_KEY
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const app = express();

// Configuración de la base de datos PostgreSQL
// Las variables de entorno PGHOST, PGUSER, PGDATABASE, PGPASSWORD, PGPORT deben existir
const pool = new Pool();

// Para el webhook de Stripe necesitamos el body raw (no se puede parsear a JSON normal)
// por lo que ignoramos el express.json si la ruta es la del webhook.
app.use((req, res, next) => {
    if (req.originalUrl.includes('/api/webhooks/stripe')) {
        next();
    } else {
        express.json()(req, res, next);
    }
});
app.use(cors());

// Ruta de prueba para comprobar que el sevidor responde
app.get('/', (req, res) => {
    res.json({ message: '¡Hotel-Restaurant API del MVP está corriendo correctamente!' });
});

// Constantes de distribución del pago (Restaurante 70%, Hotel 5%, Nosotros 25%)
const COMMISSION_RESTAURANT = 0.70;
const COMMISSION_HOTEL = 0.05;

/**
 * 1. Endpoint para procesar el Check-out del Pedido
 * Este endpoint es llamado desde el Frontend en React cuando el huésped decide pagar.
 */
app.post('/api/checkout', async (req, res) => {
    try {
        const { hotelId, roomId, restaurantId, cartItems, successUrl, cancelUrl } = req.body;

        // a) Validar y obtener datos de la Base de Datos
        const { rows: hotelRows } = await pool.query('SELECT stripe_account_id FROM hotels WHERE id = $1', [hotelId]);
        const { rows: restRows } = await pool.query('SELECT stripe_account_id FROM restaurants WHERE id = $1', [restaurantId]);
        
        if (hotelRows.length === 0 || restRows.length === 0) {
            return res.status(404).json({ error: 'Hotel o Restaurante no encontrado' });
        }

        const hotelStripeAccountId = hotelRows[0].stripe_account_id;
        const restaurantStripeAccountId = restRows[0].stripe_account_id;

        // b) Calcular total consultando los precios reales en BD (Seguridad backend)
        let totalAmountCentavos = 0;
        const lineItems = [];

        for (const item of cartItems) {
            const { rows: itemRows } = await pool.query('SELECT name, price FROM menus WHERE id = $1', [item.menuId]);
            if (itemRows.length > 0) {
                const priceCents = Math.round(Number(itemRows[0].price) * 100);
                totalAmountCentavos += (priceCents * item.quantity);
                
                lineItems.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: itemRows[0].name },
                        unit_amount: priceCents,
                    },
                    quantity: item.quantity,
                });
            }
        }

        // c) Registrar Orden Inicial (Pending)
        const orderRes = await pool.query(
            'INSERT INTO orders (hotel_id, room_id, restaurant_id, total_amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [hotelId, roomId, restaurantId, totalAmountCentavos / 100, 'pending']
        );
        const orderId = orderRes.rows[0].id;

        for (const item of cartItems) {
            // Ideal: Añadir precio por unidad validado en inserts de production
             await pool.query(
                'INSERT INTO order_items (order_id, menu_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
                [orderId, item.menuId, item.quantity, 0] 
            );
        }

        // d) Crear la sesión de Checkout en Stripe (Separate Charges and Transfers)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl, // ej: frontend.com/success?orderId=123
            cancel_url: cancelUrl,   // ej: frontend.com/order?h=123&r=402
            payment_intent_data: {
                // Transfer Group agrupa la transacción y transferencias relacionadas
                transfer_group: `order_${orderId}`,
                metadata: {
                    orderId: orderId.toString(),
                    hotelStripeAccountId,
                    restaurantStripeAccountId,
                }
            }
        });

        // Actualizar el PaymentIntentId en la orden para tracking de webhooks
        await pool.query('UPDATE orders SET stripe_payment_intent_id = $1 WHERE id = $2', [session.payment_intent, orderId]);

        res.json({ url: session.url });

    } catch (error) {
        console.error('Error procesando el checkout:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 2. Webhook de Stripe para procesar los pagos exitosos y hacer los splits de comisiones
 */
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;
        const totalAmountCentavos = paymentIntent.amount_received;

        // Calcular splits redondeados (Stripe Connect Separate Charges)
        const restaurantPayout = Math.round(totalAmountCentavos * COMMISSION_RESTAURANT);
        const hotelPayout = Math.round(totalAmountCentavos * COMMISSION_HOTEL);
        // La plataforma se queda con el 25% pasivo en su propio balance.

        try {
            // A) Transferencia al Restaurante (70%)
            await stripe.transfers.create({
                amount: restaurantPayout,
                currency: 'usd',
                destination: metadata.restaurantStripeAccountId,
                transfer_group: `order_${metadata.orderId}`,
                source_transaction: paymentIntent.latest_charge, 
            });

            // B) Transferencia al Hotel (5%)
            await stripe.transfers.create({
                amount: hotelPayout,
                currency: 'usd',
                destination: metadata.hotelStripeAccountId,
                transfer_group: `order_${metadata.orderId}`,
                source_transaction: paymentIntent.latest_charge,
            });

            // C) Actualizar Estado del Pedido
            await pool.query("UPDATE orders SET status = 'paid' WHERE id = $1", [metadata.orderId]);
            
            console.log(`Pago Exitoso. Split realizado transferido al Hotel y Restaurante. Orden: ${metadata.orderId}`);

        } catch (error) {
            console.error('Error realizando los transfers en Stripe:', error);
            // En producción, guardar los reintentos dependientes en BD o loggear adecuadamente.
        }
    }

    res.json({ received: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Hotel-Restaurant API Server corriendo en puerto ${PORT}`);
});
