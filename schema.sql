CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(20) UNIQUE NOT NULL,
    sender_name TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    weight_kg NUMERIC(6, 2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception')) DEFAULT 'label_created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tracking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    location_city_state TEXT NOT NULL,
    status_update VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
