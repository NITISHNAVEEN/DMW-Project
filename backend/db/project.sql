-- Active: 1767978558936@@127.0.0.1@3306@patna_metro
--  PATNA METRO MANAGEMENT SYSTEM 

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS patna_metro;
CREATE DATABASE patna_metro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE patna_metro;

-- =======================
--  TABLES
-- =======================

CREATE TABLE Liness (
    line_id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    line_name  VARCHAR(50)      NOT NULL,
    color_hex  CHAR(7)          NOT NULL DEFAULT '#1E88E5',
    active     TINYINT(1)       NOT NULL DEFAULT 1,
    PRIMARY KEY (line_id),
    UNIQUE KEY uq_line_name (line_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Stations (
    station_id   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    station_name VARCHAR(100)      NOT NULL,
    latitude     DECIMAL(9,6)      NOT NULL DEFAULT 0.000000,
    longitude    DECIMAL(9,6)      NOT NULL DEFAULT 0.000000,
    PRIMARY KEY (station_id),
    UNIQUE KEY uq_station_name (station_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Liness_Stations (
    line_id       TINYINT UNSIGNED  NOT NULL,
    station_id    SMALLINT UNSIGNED NOT NULL,
    stop_sequence TINYINT UNSIGNED  NOT NULL,
    PRIMARY KEY (line_id, station_id),
    UNIQUE KEY uq_line_seq (line_id, stop_sequence),
    CONSTRAINT fk_ls_line    FOREIGN KEY (line_id)    REFERENCES Liness(line_id)    ON DELETE CASCADE,
    CONSTRAINT fk_ls_station FOREIGN KEY (station_id) REFERENCES Stations(station_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Interchange_Stations (
    interchange_id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    line_id_a              TINYINT UNSIGNED  NOT NULL,
    line_id_b              TINYINT UNSIGNED  NOT NULL,
    interchange_station_id SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (interchange_id),
    UNIQUE KEY uq_interchange (line_id_a, line_id_b),
    CONSTRAINT fk_int_line_a  FOREIGN KEY (line_id_a)              REFERENCES Liness(line_id),
    CONSTRAINT fk_int_line_b  FOREIGN KEY (line_id_b)              REFERENCES Liness(line_id),
    CONSTRAINT fk_int_station FOREIGN KEY (interchange_station_id) REFERENCES Stations(station_id),
    CONSTRAINT chk_int_order  CHECK (line_id_a < line_id_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Fare_Matrix (
    from_station_id SMALLINT UNSIGNED NOT NULL,
    to_station_id   SMALLINT UNSIGNED NOT NULL,
    fare_amount     DECIMAL(6,2)      NOT NULL,
    PRIMARY KEY (from_station_id, to_station_id),
    CONSTRAINT fk_fm_from     FOREIGN KEY (from_station_id) REFERENCES Stations(station_id),
    CONSTRAINT fk_fm_to       FOREIGN KEY (to_station_id)   REFERENCES Stations(station_id),
    CONSTRAINT chk_fare_pos   CHECK (fare_amount >= 0),
    CONSTRAINT chk_fare_order CHECK (from_station_id < to_station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Users (
    user_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    phone         VARCHAR(15)  NOT NULL,
    pin           CHAR(4)      NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'UNSET',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_email (email),
    UNIQUE KEY uq_user_phone (phone),
    CONSTRAINT chk_pin_digits CHECK (pin REGEXP '^[0-9]{4}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Metro_Cards (
    card_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED NOT NULL,
    card_number CHAR(16)     NOT NULL,
    balance     DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    status      ENUM('ACTIVE','BLOCKED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    issued_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (card_id),
    UNIQUE KEY uq_card_number (card_number),
    CONSTRAINT fk_mc_user   FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_balance  CHECK (balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Card_Recharge_Log (
    recharge_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    card_id        INT UNSIGNED    NOT NULL,
    amount         DECIMAL(8,2)    NOT NULL,
    balance_before DECIMAL(8,2)    NOT NULL,
    balance_after  DECIMAL(8,2)    NOT NULL,
    recharged_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks        VARCHAR(200)    DEFAULT NULL,
    PRIMARY KEY (recharge_id),
    CONSTRAINT fk_crl_card  FOREIGN KEY (card_id) REFERENCES Metro_Cards(card_id) ON DELETE RESTRICT,
    CONSTRAINT chk_rech_pos CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Card_Trips (
    trip_id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    card_id          INT UNSIGNED      NOT NULL,
    entry_station_id SMALLINT UNSIGNED NOT NULL,
    entry_time       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_station_id  SMALLINT UNSIGNED DEFAULT NULL,
    exit_time        DATETIME          DEFAULT NULL,
    fare_deducted    DECIMAL(6,2)      DEFAULT NULL,
    status           ENUM('IN_PROGRESS','COMPLETED','ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
    PRIMARY KEY (trip_id),
    CONSTRAINT fk_ct_card  FOREIGN KEY (card_id)           REFERENCES Metro_Cards(card_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ct_entry FOREIGN KEY (entry_station_id)  REFERENCES Stations(station_id),
    CONSTRAINT fk_ct_exit  FOREIGN KEY (exit_station_id)   REFERENCES Stations(station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Vending_Machines (
    machine_id   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    station_id   SMALLINT UNSIGNED NOT NULL,
    machine_code VARCHAR(20)       NOT NULL,
    status       ENUM('ONLINE','OFFLINE','MAINTENANCE') NOT NULL DEFAULT 'ONLINE',
    installed_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (machine_id),
    UNIQUE KEY uq_machine_code (machine_code),
    CONSTRAINT fk_vm_station FOREIGN KEY (station_id) REFERENCES Stations(station_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Tickets (
    ticket_id       BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    machine_id      SMALLINT UNSIGNED NOT NULL,
    from_station_id SMALLINT UNSIGNED NOT NULL,
    to_station_id   SMALLINT UNSIGNED NOT NULL,
    ticket_code     VARCHAR(32)       NOT NULL,
    fare_paid       DECIMAL(6,2)      NOT NULL,
    issued_at       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until     DATETIME          NOT NULL,
    status          ENUM('VALID','USED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'VALID',
    PRIMARY KEY (ticket_id),
    UNIQUE KEY uq_ticket_code (ticket_code),
    CONSTRAINT fk_tk_machine FOREIGN KEY (machine_id)      REFERENCES Vending_Machines(machine_id) ON DELETE RESTRICT,
    CONSTRAINT fk_tk_from    FOREIGN KEY (from_station_id) REFERENCES Stations(station_id),
    CONSTRAINT fk_tk_to      FOREIGN KEY (to_station_id)   REFERENCES Stations(station_id),
    CONSTRAINT chk_fare_tknn CHECK (fare_paid >= 0),
    CONSTRAINT chk_diff_stn  CHECK (from_station_id <> to_station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Admins (
    admin_id      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('SUPER_ADMIN','OPERATOR','ANALYST') NOT NULL DEFAULT 'OPERATOR',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (admin_id),
    UNIQUE KEY uq_admin_user  (username),
    UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Audit_Log (
    log_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    entity_type   ENUM('CARD_TRIP','RECHARGE','TICKET','SYSTEM') NOT NULL,
    entity_id     BIGINT UNSIGNED NOT NULL,
    event_type    VARCHAR(50)     NOT NULL,
    event_subtype VARCHAR(50)     DEFAULT NULL,
    amount_delta  DECIMAL(8,2)    DEFAULT NULL,
    balance_after DECIMAL(8,2)    DEFAULT NULL,
    description   VARCHAR(300)    DEFAULT NULL,
    performed_by  VARCHAR(100)    DEFAULT 'SYSTEM',
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_ct_card_status ON Card_Trips(card_id, status);
CREATE INDEX idx_ct_entry_time  ON Card_Trips(entry_time);
CREATE INDEX idx_ct_exit_time   ON Card_Trips(exit_time);
CREATE INDEX idx_tk_machine     ON Tickets(machine_id);
CREATE INDEX idx_tk_issued      ON Tickets(issued_at);
CREATE INDEX idx_al_entity      ON Audit_Log(entity_type, entity_id);
CREATE INDEX idx_al_created     ON Audit_Log(created_at);
CREATE INDEX idx_mc_user        ON Metro_Cards(user_id);
CREATE INDEX idx_crl_card       ON Card_Recharge_Log(card_id);


-- ==========================
--  STORED PROCEDURES
-- ==========================

DELIMITER $$

-- This procedure handles tap-in events for metro cards. It checks card validity, balance, and active trips before allowing entry.
CREATE PROCEDURE sp_card_tap_in (
    IN  p_card_id     INT UNSIGNED,
    IN  p_station_id  SMALLINT UNSIGNED,
    OUT p_trip_id     BIGINT UNSIGNED,
    OUT p_result_code TINYINT,
    OUT p_result_msg  VARCHAR(200)
)
sp: BEGIN
    DECLARE v_status     VARCHAR(20);
    DECLARE v_balance    DECIMAL(8,2);
    DECLARE v_open_trips INT DEFAULT 0;
    DECLARE MIN_BALANCE  DECIMAL(6,2) DEFAULT 10.00;

    START TRANSACTION;

    SELECT status, balance
      INTO v_status, v_balance
      FROM Metro_Cards
     WHERE card_id = p_card_id
       FOR UPDATE;

    IF v_status IS NULL THEN
        SET p_result_code = 1;
        SET p_result_msg  = 'Card not found';
        ROLLBACK;
        LEAVE sp;
    END IF;

    IF v_status <> 'ACTIVE' THEN
        SET p_result_code = 1;
        SET p_result_msg  = CONCAT('Card is ', v_status, ' - cannot travel');
        ROLLBACK;
        LEAVE sp;
    END IF;

    IF v_balance < MIN_BALANCE THEN
        SET p_result_code = 2;
        SET p_result_msg  = CONCAT('Insufficient balance (Rs.', v_balance, '). Min Rs.', MIN_BALANCE, ' required');
        ROLLBACK;
        LEAVE sp;
    END IF;

    SELECT COUNT(*)
      INTO v_open_trips
      FROM Card_Trips
     WHERE card_id = p_card_id
       AND status  = 'IN_PROGRESS';

    IF v_open_trips > 0 THEN
        SET p_result_code = 3;
        SET p_result_msg  = 'Card already has an active trip - tap out first';
        ROLLBACK;
        LEAVE sp;
    END IF;

    INSERT INTO Card_Trips (card_id, entry_station_id, status)
    VALUES (p_card_id, p_station_id, 'IN_PROGRESS');

    SET p_trip_id = LAST_INSERT_ID();

    INSERT INTO Audit_Log
        (entity_type, entity_id, event_type, amount_delta, balance_after, description, performed_by)
    VALUES
        ('CARD_TRIP', p_trip_id, 'TAP_IN', 0.00, v_balance,
         CONCAT('Tap-in at station #', p_station_id), 'SYSTEM');

    COMMIT;

    SET p_result_code = 0;
    SET p_result_msg  = 'Tap-in successful';
END$$


CREATE PROCEDURE sp_card_tap_out (
    IN  p_trip_id         BIGINT UNSIGNED,
    IN  p_exit_station_id SMALLINT UNSIGNED,
    OUT p_fare            DECIMAL(6,2),
    OUT p_result_code     TINYINT,
    OUT p_result_msg      VARCHAR(200)
)
sp: BEGIN
    DECLARE v_card_id       INT UNSIGNED;
    DECLARE v_entry_stn     SMALLINT UNSIGNED;
    DECLARE v_trip_status   VARCHAR(20);
    DECLARE v_balance       DECIMAL(8,2);
    DECLARE v_balance_after DECIMAL(8,2);
    DECLARE v_lo            SMALLINT UNSIGNED;
    DECLARE v_hi            SMALLINT UNSIGNED;

    START TRANSACTION;

    SELECT card_id, entry_station_id, status
      INTO v_card_id, v_entry_stn, v_trip_status
      FROM Card_Trips
     WHERE trip_id = p_trip_id
       FOR UPDATE;

    IF v_trip_status IS NULL THEN
        SET p_result_code = 1;
        SET p_result_msg  = 'Trip not found';
        ROLLBACK;
        LEAVE sp;
    END IF;

    IF v_trip_status <> 'IN_PROGRESS' THEN
        SET p_result_code = 2;
        SET p_result_msg  = CONCAT('Trip is already ', v_trip_status);
        ROLLBACK;
        LEAVE sp;
    END IF;

    IF p_exit_station_id = v_entry_stn THEN
        SET p_result_code = 3;
        SET p_result_msg  = 'Exit station cannot be same as entry station';
        ROLLBACK;
        LEAVE sp;
    END IF;

    SET v_lo = LEAST(v_entry_stn, p_exit_station_id);
    SET v_hi = GREATEST(v_entry_stn, p_exit_station_id);

    SELECT fare_amount
      INTO p_fare
      FROM Fare_Matrix
     WHERE from_station_id = v_lo
       AND to_station_id   = v_hi;

    IF p_fare IS NULL THEN
        SET p_fare = 20.00;
    END IF;

    SELECT balance
      INTO v_balance
      FROM Metro_Cards
     WHERE card_id = v_card_id
       FOR UPDATE;

    IF v_balance < p_fare THEN
        SET p_fare = GREATEST(v_balance, 5.00);
    END IF;

    SET v_balance_after = ROUND(v_balance - p_fare, 2);

    UPDATE Metro_Cards
       SET balance = v_balance_after
     WHERE card_id = v_card_id;

    UPDATE Card_Trips
       SET exit_station_id = p_exit_station_id,
           exit_time       = NOW(),
           fare_deducted   = p_fare,
           status          = 'COMPLETED'
     WHERE trip_id = p_trip_id;

    INSERT INTO Audit_Log
        (entity_type, entity_id, event_type, amount_delta, balance_after, description, performed_by)
    VALUES
        ('CARD_TRIP', p_trip_id, 'FARE_DEDUCT', -p_fare, v_balance_after,
         CONCAT('Fare for station #', v_entry_stn, ' -> #', p_exit_station_id), 'SYSTEM');

    COMMIT;

    SET p_result_code = 0;
    SET p_result_msg  = CONCAT('Tap-out OK. Fare: Rs.', p_fare, '. New balance: Rs.', v_balance_after);
END$$

-- This procedure is used when a passenger exits the metro. It calculates the fare based on entry and exit stations, deducts the amount from the card balance, updates the trip, and logs the transaction.
CREATE PROCEDURE sp_recharge_card (
    IN  p_card_id     INT UNSIGNED,
    IN  p_amount      DECIMAL(8,2),
    IN  p_remarks     VARCHAR(200),
    OUT p_result_code TINYINT,
    OUT p_result_msg  VARCHAR(200)
)
sp: BEGIN
    DECLARE v_balance_before DECIMAL(8,2);
    DECLARE v_balance_after  DECIMAL(8,2);
    DECLARE v_recharge_id    BIGINT UNSIGNED;

    START TRANSACTION;

    IF p_amount <= 0 THEN
        SET p_result_code = 1;
        SET p_result_msg  = 'Recharge amount must be positive';
        ROLLBACK;
        LEAVE sp;
    END IF;

    SELECT balance
      INTO v_balance_before
      FROM Metro_Cards
     WHERE card_id = p_card_id
       FOR UPDATE;

    IF v_balance_before IS NULL THEN
        SET p_result_code = 2;
        SET p_result_msg  = 'Card not found';
        ROLLBACK;
        LEAVE sp;
    END IF;

    SET v_balance_after = ROUND(v_balance_before + p_amount, 2);

    UPDATE Metro_Cards
       SET balance = v_balance_after
     WHERE card_id = p_card_id;

    INSERT INTO Card_Recharge_Log
        (card_id, amount, balance_before, balance_after, remarks)
    VALUES
        (p_card_id, p_amount, v_balance_before, v_balance_after, p_remarks);

    SET v_recharge_id = LAST_INSERT_ID();

    INSERT INTO Audit_Log
        (entity_type, entity_id, event_type, event_subtype, amount_delta,
         balance_after, description, performed_by)
    VALUES
        ('RECHARGE', v_recharge_id, 'RECHARGE', p_remarks,
         p_amount, v_balance_after,
         CONCAT('Recharge Rs.', p_amount, ' -> balance Rs.', v_balance_after), 'USER');

    COMMIT;

    SET p_result_code = 0;
    SET p_result_msg  = CONCAT('Recharged Rs.', p_amount, '. New balance: Rs.', v_balance_after);
END$$

-- This procedure is used to issue a metro ticket from a vending machine. It checks if the machine is working, calculates the fare between stations, generates a unique ticket code, and stores the ticket details.
CREATE PROCEDURE sp_issue_ticket (
    IN  p_machine_id      SMALLINT UNSIGNED,
    IN  p_from_station_id SMALLINT UNSIGNED,
    IN  p_to_station_id   SMALLINT UNSIGNED,
    OUT p_ticket_code     VARCHAR(32),
    OUT p_fare            DECIMAL(6,2),
    OUT p_result_code     TINYINT,
    OUT p_result_msg      VARCHAR(200)
)
sp: BEGIN
    DECLARE v_machine_status VARCHAR(20);
    DECLARE v_ticket_id      BIGINT UNSIGNED;
    DECLARE v_lo             SMALLINT UNSIGNED;
    DECLARE v_hi             SMALLINT UNSIGNED;

    SET p_ticket_code = REPLACE(UUID(), '-', '');

    START TRANSACTION;

    SELECT status
      INTO v_machine_status
      FROM Vending_Machines
     WHERE machine_id = p_machine_id
       FOR UPDATE;

    IF v_machine_status IS NULL THEN
        SET p_result_code = 1;
        SET p_result_msg  = 'Machine not found';
        ROLLBACK;
        LEAVE sp;
    END IF;

    IF v_machine_status <> 'ONLINE' THEN
        SET p_result_code = 2;
        SET p_result_msg  = CONCAT('Machine is ', v_machine_status);
        ROLLBACK;
        LEAVE sp;
    END IF;

    IF p_from_station_id = p_to_station_id THEN
        SET p_result_code = 3;
        SET p_result_msg  = 'Source and destination cannot be the same station';
        ROLLBACK;
        LEAVE sp;
    END IF;

    SET v_lo = LEAST(p_from_station_id, p_to_station_id);
    SET v_hi = GREATEST(p_from_station_id, p_to_station_id);

    SELECT fare_amount
      INTO p_fare
      FROM Fare_Matrix
     WHERE from_station_id = v_lo
       AND to_station_id   = v_hi;

    IF p_fare IS NULL THEN
        SET p_fare = 20.00;
    END IF;

    INSERT INTO Tickets
        (machine_id, from_station_id, to_station_id, ticket_code, fare_paid, valid_until, status)
    VALUES
        (p_machine_id, p_from_station_id, p_to_station_id,
         p_ticket_code, p_fare, DATE_ADD(NOW(), INTERVAL 4 HOUR), 'VALID');

    SET v_ticket_id = LAST_INSERT_ID();

    INSERT INTO Audit_Log
        (entity_type, entity_id, event_type, amount_delta, description, performed_by)
    VALUES
        ('TICKET', v_ticket_id, 'TICKET_SALE', p_fare,
         CONCAT('Ticket ', p_ticket_code, ' station #', p_from_station_id, ' -> #', p_to_station_id),
         CONCAT('MACHINE-', p_machine_id));

    COMMIT;

    SET p_result_code = 0;
    SET p_result_msg  = CONCAT('Ticket issued. Fare: Rs.', p_fare);
END$$


DELIMITER ;


-- ======================
--  VIEWS = A view is a virtual table created using a SELECT query. It does not store data but shows data from one or more tables."
-- ======================

CREATE VIEW vw_active_trips AS
SELECT
    ct.trip_id,
    mc.card_number,
    u.full_name      AS passenger,
    s.station_name   AS entry_station,
    ct.entry_time,
    mc.balance       AS current_balance
FROM  Card_Trips  ct
JOIN  Metro_Cards mc ON mc.card_id    = ct.card_id
JOIN  Users       u  ON u.user_id     = mc.user_id
JOIN  Stations    s  ON s.station_id  = ct.entry_station_id
WHERE ct.status = 'IN_PROGRESS';

CREATE VIEW vw_daily_revenue AS
SELECT
    d.travel_date,
    COALESCE(c.card_rev,   0) AS card_revenue,
    COALESCE(t.ticket_rev, 0) AS ticket_revenue,
    COALESCE(c.card_rev,   0) + COALESCE(t.ticket_rev, 0) AS total_revenue
FROM (
    SELECT DATE(exit_time) AS travel_date FROM Card_Trips WHERE status = 'COMPLETED'
    UNION
    SELECT DATE(issued_at) AS travel_date FROM Tickets
) d
LEFT JOIN (
    SELECT DATE(exit_time) AS d, SUM(fare_deducted) AS card_rev
    FROM   Card_Trips
    WHERE  status = 'COMPLETED'
    GROUP  BY DATE(exit_time)
) c ON c.d = d.travel_date
LEFT JOIN (
    SELECT DATE(issued_at) AS d, SUM(fare_paid) AS ticket_rev
    FROM   Tickets
    GROUP  BY DATE(issued_at)
) t ON t.d = d.travel_date
ORDER BY d.travel_date;

CREATE VIEW vw_station_traffic AS
SELECT
    s.station_id,
    s.station_name,
    COUNT(ct.trip_id) AS total_entries,
    COUNT(CASE WHEN ct.status = 'IN_PROGRESS' THEN 1 END) AS active_now
FROM  Stations   s
LEFT JOIN Card_Trips ct ON ct.entry_station_id = s.station_id
GROUP BY s.station_id, s.station_name
ORDER BY total_entries DESC;

CREATE VIEW vw_card_balances AS
SELECT
    mc.card_id,
    mc.card_number,
    u.full_name  AS owner,
    u.phone,
    mc.balance,
    mc.status,
    mc.issued_at,
    (SELECT COUNT(*) FROM Card_Trips ct
      WHERE ct.card_id = mc.card_id
        AND ct.status  = 'IN_PROGRESS') AS has_active_trip
FROM  Metro_Cards mc
JOIN  Users       u ON u.user_id = mc.user_id;