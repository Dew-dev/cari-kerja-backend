CREATE TABLE provinces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    province_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
);

INSERT INTO provinces (id, name) VALUES
(1, 'Andijan'),
(2, 'Bukhara'),
(3, 'Fergana'),
(4, 'Jizzakh'),
(5, 'Namangan'),
(6, 'Navoiy'),
(7, 'Kashkadarya'),
(8, 'Samarkand'),
(9, 'Sirdarya'),
(10, 'Surkhandarya'),
(11, 'Tashkent Region'),
(12, 'Khorezm'),
(13, 'Republic of Karakalpakstan'),
(14, 'Tashkent City');


INSERT INTO cities (province_id, name) VALUES
-- Andijan
(1, 'Andijan'),
(1, 'Asaka'),
(1, 'Khanabad'),

-- Bukhara
(2, 'Bukhara'),
(2, 'Kagan'),
(2, 'Gijduvan'),

-- Fergana
(3, 'Fergana'),
(3, 'Kokand'),
(3, 'Margilan'),

-- Jizzakh
(4, 'Jizzakh'),
(4, 'Gagarin'),

-- Namangan
(5, 'Namangan'),
(5, 'Chust'),
(5, 'Pop'),

-- Navoiy
(6, 'Navoiy'),
(6, 'Zarafshan'),

-- Kashkadarya
(7, 'Karshi'),
(7, 'Shahrisabz'),

-- Samarkand
(8, 'Samarkand'),
(8, 'Kattakurgan'),

-- Sirdarya
(9, 'Gulistan'),
(9, 'Syrdarya'),

-- Surkhandarya
(10, 'Termez'),
(10, 'Denov'),

-- Tashkent Region
(11, 'Nurafshon'),
(11, 'Angren'),
(11, 'Chirchiq'),
(11, 'Bekabad'),

-- Khorezm
(12, 'Urgench'),
(12, 'Khiva'),

-- Karakalpakstan
(13, 'Nukus'),
(13, 'Beruniy'),
(13, 'Chimbay'),

-- Tashkent City
(14, 'Tashkent');

