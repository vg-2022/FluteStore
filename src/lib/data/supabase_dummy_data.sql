-- Clear existing data in the correct order of dependency
DELETE FROM "Reviews";
DELETE FROM "Wishlist";
DELETE FROM "OrderItems";
DELETE FROM "Payment_Details";
DELETE FROM "Orders";
DELETE FROM "Products";
DELETE FROM "Coupons";
DELETE FROM "Categories";
DELETE FROM "Users";

-- Reset sequences for all tables
ALTER SEQUENCE "Users_User_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Categories_Category_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Products_Product_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Orders_Order_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Reviews_Review_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Wishlist_Wishlist_id_seq" RESTART WITH 1;

-- Insert dummy data
INSERT INTO "Users" ("First_name", "Last_name", "User_type", "Phone_number", "Email_address", "Password_hash", "Shipping_addresses") VALUES
('Shekhar', 'Mishra', 'admin', '9876543210', 'shekhar.mishra@example.com', '$2b$10$f/9.2p.y/u4.e2X8.bJ/d.wG/nS9Lz.E4.qJz2uJ.y4.qJz2uJ.y', '[
  {
    "name": "Shekhar Mishra",
    "address_line_1": "12B",
    "street": "Ocean View Apartments",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400049",
    "country": "India",
    "phone_number": "9876543210",
    "is_default": true
  }
]'),
('Riya', 'Sharma', 'customer', '9876543211', 'riya.sharma@example.com', '$2b$10$g/A.3q.z/v5.f3Y9.cK/e.xH/oT0M.F5.rK.w3vK.z5.rK.w3vK.z', '[
  {
    "name": "Riya Sharma",
    "address_line_1": "A-101, Star Heights",
    "street": "Andheri West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400053",
    "country": "India",
    "phone_number": "9876543211",
    "is_default": true
  }
]');

INSERT INTO "Categories" ("Category_name", "Description", "Parent_category_id") VALUES
('Flutes', 'All types of flutes', NULL),
('Accessories', 'Items to complement your flute', NULL),
('Beginner', 'Flutes for starting your musical journey', 1),
('Intermediate', 'For those advancing their skills', 1),
('Professional', 'Top-tier flutes for concert performers', 1);

INSERT INTO "Products" ("Product_name", "Category", "Description", "Price", "MRP", "Details", "Image_ids", "Audio_url", "Tags", "Featured", "Rating", "Review_count") VALUES
('C Natural Medium Flute', 'Beginner', 'An ideal choice for beginners, this C Natural Medium flute offers a balanced tone and easy playability. Handcrafted from premium bamboo.', 2500.00, 3000.00, '{"Type": "Beginner", "Tonic": "Sa", "Material": "Bamboo", "Tuning": "A440Hz", "Scale": "C Natural"}', '{"flute-1","flute-2"}', 'https://res.cloudinary.com/dliwn5yiw/video/upload/v1722421351/deep-bansuri-flute-21010_gy9yqk.mp3', '{2}', TRUE, 4.5, 120),
('G Natural Base Flute', 'Professional', 'Experience deep, resonant bass tones with this G Natural Base flute. Perfect for meditative music and slow compositions.', 4500.00, 5500.00, '{"Type": "Professional", "Tonic": "Pa", "Material": "Premium Assam Bamboo", "Tuning": "A440Hz", "Scale": "G Natural"}', '{"flute-3","flute-4"}', NULL, '{3}', TRUE, 4.8, 85),
('Premium Flute Travel Case', 'Accessories', 'Protect your valuable instrument with this durable and stylish travel case. Features a padded interior and a weather-resistant exterior.', 1200.00, 1500.00, '{"Material": "Reinforced wood with velvet lining", "Compatibility": "Single flute up to 25 inches", "Dimensions": "26\\" x 4\\" x 3\\""}', '{"flute-case-1","flute-case-2"}', NULL, '{4}', NULL, 4.9, 75),
('Multi-Flute Canvas Gig Bag', 'Accessories', 'Carry multiple flutes with ease. This soft canvas bag has several padded compartments and an adjustable shoulder strap for comfort.', 800.00, NULL, '{"Material": "Heavy-duty canvas with foam padding", "Compatibility": "Up to 4 flutes of varying sizes", "Dimensions": "30\\" x 10\\""}', '{"flute-bag-1","flute-bag-2"}', NULL, '{4}', NULL, 4.7, 112);


INSERT INTO "Orders" ("User_id", "Order_date", "Total_amount", "Shipping_amount", "Discount_amount", "Final_amount", "Order_status", "Payment_status", "Shipping_address", "Payment_reference_id") VALUES
((SELECT "User_id" FROM "Users" WHERE "Email_address" = 'shekhar.mishra@example.com'), '2024-07-28 10:00:00', 7000.00, 150.00, 700.00, 6450.00, 'Shipped', 'Paid', '{
  "name": "Shekhar Mishra",
  "address_line_1": "12B",
  "street": "Ocean View Apartments",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400049",
  "country": "India",
  "phone_number": "9876543210"
}', 'pay_Oa5pL1j8y3eZ7f');

INSERT INTO "Payment_Details" ("Payment_reference_id", "Order_id", "Payment_method", "Payment_status", "Amount", "Payment_date") VALUES
('pay_Oa5pL1j8y3eZ7f', (SELECT "Order_id" FROM "Orders" WHERE "Payment_reference_id" = 'pay_Oa5pL1j8y3eZ7f'), 'Razorpay', 'Paid', 6450.00, '2024-07-28 10:01:00');

INSERT INTO "OrderItems" ("Order_id", "Product_id", "Quantity", "Customizations") VALUES
((SELECT "Order_id" FROM "Orders" WHERE "Payment_reference_id" = 'pay_Oa5pL1j8y3eZ7f'), (SELECT "Product_id" FROM "Products" WHERE "Product_name" = 'C Natural Medium Flute'), 1, '{"Case": "Hard Case", "Engraving": "Shekhar"}'),
((SELECT "Order_id" FROM "Orders" WHERE "Payment_reference_id" = 'pay_Oa5pL1j8y3eZ7f'), (SELECT "Product_id" FROM "Products" WHERE "Product_name" = 'G Natural Base Flute'), 1, NULL);

INSERT INTO "Reviews" ("User_id", "Product_id", "Rating", "Comment", "Review_date") VALUES
((SELECT "User_id" FROM "Users" WHERE "Email_address" = 'shekhar.mishra@example.com'), (SELECT "Product_id" FROM "Products" WHERE "Product_name" = 'C Natural Medium Flute'), 5, 'Absolutely amazing flute! The craftsmanship is superb and the sound is divine. Highly recommended!', '2024-07-30 14:00:00');

INSERT INTO "Wishlist" ("User_id", "Product_id") VALUES
((SELECT "User_id" FROM "Users" WHERE "Email_address" = 'shekhar.mishra@example.com'), (SELECT "Product_id" FROM "Products" WHERE "Product_name" = 'Premium Flute Travel Case'));

INSERT INTO "Coupons" ("Coupon_code", "Description", "Discount_percentage", "Flat_discount", "Max_discount", "Min_order_value", "Expiry_date", "Is_active") VALUES
('FLUTE10', '10% Off Your Order', 10, NULL, 500, 0, '2025-12-31', TRUE),
('FREESHIP', 'Free Shipping on orders over ₹2000', NULL, NULL, NULL, 2000, '2025-12-31', TRUE);
