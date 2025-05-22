
CREATE TABLE IF NOT EXISTS function_bookings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  event_date TIMESTAMP WITH TIME ZONE,
  setup_time VARCHAR(10),
  start_time VARCHAR(10),
  finish_time VARCHAR(10),
  event_type VARCHAR(50),
  people INTEGER,
  rooms_hired VARCHAR(255),
  food_serving_time VARCHAR(10),
  subsidised_drinks VARCHAR(3),
  cake_on_table VARCHAR(3),
  present_on_table VARCHAR(3),
  account_name VARCHAR(255),
  bsb VARCHAR(50),
  account_number VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO function_bookings (
  name, phone, email, event_date, setup_time, start_time, finish_time, 
  event_type, people, rooms_hired, food_serving_time, subsidised_drinks, 
  cake_on_table, present_on_table, account_name, bsb, account_number
) VALUES (
  'Kshitij Kumrawat', '8602622549', 'test@gmail.com', '2025-05-29T18:30:00.000Z', 
  '01:45', '02:15', '03:45', 'birthday', 10, 'Dining Area', '02:30', 
  'No', 'Yes', 'Yes', 'test', 'sdhajhdjkahd', '38472987428974'
);

