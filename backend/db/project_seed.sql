USE patna_metro;

-- ==================
--  SEED DATA
-- ==================

INSERT INTO Liness (line_name, color_hex, active) VALUES
    ('Red Line',   '#E53935', 1),
    ('Blue Line',  '#1E88E5', 1),
    ('Green Line', '#43A047', 1);

INSERT INTO Stations (station_name, latitude, longitude) VALUES
    ('Patna Junction',  25.613900, 85.072200),
    ('Gandhi Maidan',   25.611200, 85.133700),
    ('Patna Sahib',     25.626800, 85.145400),
    ('Rajendra Nagar',  25.589800, 85.120400),
    ('Khagaul',         25.578400, 85.024500),
    ('AIIMS Patna',     25.557100, 84.988300),
    ('Danapur',         25.617900, 84.901300),
    ('Boring Road',     25.614600, 85.095600),
    ('Bailey Road',     25.602700, 85.079100),
    ('Kankarbagh',      25.598700, 85.154800);

INSERT INTO Liness_Stations (line_id, station_id, stop_sequence) VALUES
    (1, 7, 1), (1, 1, 2), (1, 2, 3), (1, 3, 4), (1, 10, 5),
    (2, 6, 1), (2, 5, 2), (2, 9, 3), (2, 8, 4), (2,  4, 5),
    (3, 1, 1), (3, 8, 2), (3, 4, 3);

INSERT INTO Interchange_Stations (line_id_a, line_id_b, interchange_station_id) VALUES
    (1, 3, 1),
    (2, 3, 4);

INSERT INTO Fare_Matrix (from_station_id, to_station_id, fare_amount) VALUES
    (1, 2, 15), (1, 3, 20), (1, 4, 25), (1, 7, 20), (1, 8, 15), (1, 9, 20), (1, 10, 25),
    (2, 3, 15), (2, 4, 20), (2, 8, 20), (2, 10, 15),
    (3, 4, 20), (3, 10, 15),
    (4, 8, 15), (4, 9, 20),
    (5, 6, 15), (5, 9, 20),
    (6, 7, 30), (6, 9, 25),
    (7, 9, 30),
    (8, 9, 15);

INSERT INTO Admins (username, email, password_hash, role) VALUES
    ('superadmin', 'admin@patna-metro.in', 'PLACEHOLDER_REPLACE_WITH_BCRYPT', 'SUPER_ADMIN'),
    ('operator1',  'ops1@patna-metro.in',  'PLACEHOLDER_REPLACE_WITH_BCRYPT', 'OPERATOR');

INSERT INTO Users (full_name, email, phone, pin, password_hash) VALUES
    ('Rahul Kumar', 'rahul@email.com', '9876543210', '1234', 'PLACEHOLDER'),
    ('Priya Singh', 'priya@email.com', '9876543211', '2345', 'PLACEHOLDER'),
    ('Amit Sharma', 'amit@email.com',  '9876543212', '3456', 'PLACEHOLDER');

INSERT INTO Metro_Cards (user_id, card_number, balance, status) VALUES
    (1, '1234567890123456', 250.00, 'ACTIVE'),
    (2, '2345678901234567', 150.00, 'ACTIVE'),
    (3, '3456789012345678',  50.00, 'ACTIVE');

INSERT INTO Vending_Machines (station_id, machine_code, status, installed_at) VALUES
    (1, 'VM-PJ-01', 'ONLINE',  NOW()),
    (1, 'VM-PJ-02', 'ONLINE',  NOW()),
    (2, 'VM-GM-01', 'ONLINE',  NOW()),
    (3, 'VM-PS-01', 'OFFLINE', NOW()),
    (7, 'VM-DP-01', 'ONLINE',  NOW());


SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
--  VERIFY (uncomment and run after import to check row counts)
-- ============================================================
/*
SELECT 'Liness'            AS tbl, COUNT(*) AS cnt FROM Liness
UNION ALL SELECT 'Stations',          COUNT(*) FROM Stations
UNION ALL SELECT 'Fare_Matrix',       COUNT(*) FROM Fare_Matrix
UNION ALL SELECT 'Users',             COUNT(*) FROM Users
UNION ALL SELECT 'Metro_Cards',       COUNT(*) FROM Metro_Cards
UNION ALL SELECT 'Vending_Machines',  COUNT(*) FROM Vending_Machines
UNION ALL SELECT 'Admins',            COUNT(*) FROM Admins;

-- Test tap-in (card 1 at Patna Junction):
CALL sp_card_tap_in(1, 1, @trip_id, @code, @msg);
SELECT @trip_id, @code, @msg;

-- Test tap-out (at Gandhi Maidan):
CALL sp_card_tap_out(@trip_id, 2, @fare, @code, @msg);
SELECT @fare, @code, @msg;

-- Verify balance deducted (250 - 15 = 235):
SELECT card_number, balance FROM Metro_Cards WHERE card_id = 1;
*/
select * from tickets;