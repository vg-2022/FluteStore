-- Clear existing data in the correct order to avoid foreign key constraints
DELETE FROM "Reviews";
DELETE FROM "Orders";
DELETE FROM "Products";
DELETE FROM "Categories";
DELETE FROM "Users";

-- Insert dummy data into "Users"
INSERT INTO "Users" ("First_name", "Last_name", "User_type", "Phone_number", "Email_address", "Password_hash") VALUES
('Shekhar', 'Mishra', 'admin', '9876543210', 'shekhar.mishra@example.com', 'password123_hash'),
('Priya', 'Sharma', 'customer', '9876543211', 'priya.sharma@example.com', 'password456_hash');

-- Insert dummy data into "Categories"
INSERT INTO "Categories" ("CategoryName", "Description") VALUES
('Beginner', 'Flutes for those starting their musical journey.'),
('Intermediate', 'Flutes for players with some experience.'),
('Professional', 'Top-tier flutes for concert performers.'),
('Accessory', 'Cases, bags, and other flute accessories.');

-- Insert dummy data into "Products"
INSERT INTO "Products" ("Name", "Description", "Price", "MRP", "Details", "ImageUrls", "AudioUrl", "Rating", "ReviewCount", "Status", "Stock", "Tag", "ProductType") VALUES
('C Natural Medium Flute', 'An ideal choice for beginners, this C Natural Medium flute offers a balanced tone and easy playability. Handcrafted from premium bamboo.', 2500.00, 3000.00, '{"Type": "Beginner", "Tonic": "Sa", "Material": "Bamboo", "Tuning": "A440Hz", "Scale": "C Natural"}', '{"flute-1", "flute-2"}', 'https://res.cloudinary.com/dliwn5yiw/video/upload/v1722421351/deep-bansuri-flute-21010_gy9yqk.mp3', 4.5, 120, 'in-stock', 50, 'Best Seller', 'flute'),
('G Natural Base Flute', 'Experience deep, resonant bass tones with this G Natural Base flute. Perfect for meditative music and slow compositions.', 4500.00, 5500.00, '{"Type": "Professional", "Tonic": "Pa", "Material": "Premium Assam Bamboo", "Tuning": "A440Hz", "Scale": "G Natural"}', '{"flute-3", "flute-4"}', NULL, 4.8, 85, 'in-stock', 25, 'Professional', 'flute'),
('Premium Flute Travel Case', 'Protect your valuable instrument with this durable and stylish travel case. Features a padded interior and a weather-resistant exterior.', 1200.00, 1500.00, '{"Material": "Reinforced wood with velvet lining", "Compatibility": "Single flute up to 25 inches", "Dimensions": "26\" x 4\" x 3\""}', '{"flute-case-1", "flute-case-2"}', NULL, 4.9, 75, 'in-stock', 30, NULL, 'accessory');

-- Link products to categories
INSERT INTO "ProductCategory" ("ProductId", "CategoryId") VALUES
((SELECT "Product_id" FROM "Products" WHERE "Name" = 'C Natural Medium Flute'), (SELECT "Category_id" FROM "Categories" WHERE "CategoryName" = 'Beginner')),
((SELECT "Product_id" FROM "Products" WHERE "Name" = 'G Natural Base Flute'), (SELECT "Category_id" FROM "Categories" WHERE "CategoryName" = 'Professional')),
((SELECT "Product_id" FROM "Products" WHERE "Name" = 'Premium Flute Travel Case'), (SELECT "Category_id" FROM "Categories" WHERE "CategoryName" = 'Accessory'));


-- Insert dummy data into "Reviews"
INSERT INTO "Reviews" ("User_id", "Product_id", "Rating", "Comment", "Status") VALUES
((SELECT "User_id" FROM "Users" WHERE "Email_address" = 'priya.sharma@example.com'), (SELECT "Product_id" FROM "Products" WHERE "Name" = 'C Natural Medium Flute'), 5, 'An absolutely amazing flute! The craftsmanship is superb and the sound is divine. Highly recommended!', 'approved');

-- Insert dummy data into "Orders"
INSERT INTO "Orders" ("User_id", "Total_amount", "Shipping", "Status", "Items", "Shipping_details") VALUES
(
    (SELECT "User_id" FROM "Users" WHERE "Email_address" = 'priya.sharma@example.com'),
    2650.00,
    150.00,
    'Delivered',
    ARRAY[
        ROW(
            (SELECT "Product_id" FROM "Products" WHERE "Name" = 'C Natural Medium Flute'),
            1,
            '{"Case": "None", "Style": "Right Handed"}'::jsonb
        )
    ]::"OrderItem"[],
    '{"name": "Priya Sharma", "address": "123 Music Lane", "city": "Bengaluru", "pincode": "560001", "phone": "9876543211"}'
);
