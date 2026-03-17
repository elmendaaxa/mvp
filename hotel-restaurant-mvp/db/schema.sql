-- Base de Datos PostgreSQL para el MVP Hotel-Restaurante

CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    stripe_account_id VARCHAR(255) NOT NULL, -- ID de Stripe Connect del hotel (5%)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stripe_account_id VARCHAR(255) NOT NULL, -- ID de Stripe Connect del restaurante (70%)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id),
    room_id VARCHAR(50) NOT NULL, -- Ej: '402' extraído del QR
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, accepted_by_restaurant, delivering, completed
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_id INTEGER NOT NULL REFERENCES menus(id),
    quantity INT DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL
);
