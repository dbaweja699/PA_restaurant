-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    item_name TEXT NOT NULL,
    unit_of_measurement TEXT NOT NULL,
    box_or_package_qty INTEGER NOT NULL,
    unit_price TEXT NOT NULL,
    total_price TEXT NOT NULL,
    ideal_qty INTEGER NOT NULL,
    current_qty INTEGER NOT NULL DEFAULT 0,
    shelf_life_days INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    category TEXT
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    dish_name TEXT NOT NULL,
    order_type TEXT NOT NULL,
    description TEXT,
    selling_price TEXT,
    category TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create recipe_items table (links recipes to inventory items)
CREATE TABLE IF NOT EXISTS recipe_items (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    quantity_required TEXT NOT NULL,
    unit TEXT NOT NULL,
    UNIQUE(recipe_id, inventory_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_order_type ON recipes(order_type);