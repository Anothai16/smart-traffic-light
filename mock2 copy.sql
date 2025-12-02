


INSERT INTO Traffic_Mode (Mode_Name, Red_Duration, Yellow_Duration, Green_Duration, Create_Date, Update_Date)
VALUES
('Auto', 30, 5, 60, NOW(), NOW()),
('Intelligence', 25, 5, 45, NOW(), NOW()),
('Stop', 999, 0, 0, NOW(), NOW()),
('Caution', 0, 30, 0, NOW(), NOW());



INSERT INTO Master_Intersection (Name, Intersection_Number, IP_Address, Location) VALUES
('Sathorn-Narathiwat', 1, '192.168.1.101', 'ถนนสาทรตัดกับถนนนราธิวาส'),
('Asoke-Sukhumvit', 2, '192.168.1.102', 'แยกอโศกมนตรีตัดกับถนนสุขุมวิท'),
('Ratchada-Ladprao', 3, '192.168.1.103', 'แยกรัชดาภิเษกตัดกับถนนลาดพร้าว'),
('Victory Monument', 4, '192.168.1.104', 'อนุสาวรีย์ชัยสมรภูมิ');

INSERT INTO Setting_Mode_Log (Mode_ID, Admin_ID, Intersection_ID, Time, Date, Old_Red_Duration, Old_Yellow_Duration, Old_Green_Duration, New_Red_Duration, New_Yellow_Duration, New_Green_Duration, Create_Date, Update_Date)
VALUES
(1, 7, 1, '08:30:00', '2024-09-08', 35, 3, 50, 40, 3, 60, NOW(), NOW()),
(1, 7, 2, '09:15:00', '2024-09-08', 45, 3, 70, 40, 3, 65, NOW(), NOW()),
(1, 7, 3, '10:45:00', '2024-09-08', 30, 3, 45, 30, 3, 45, NOW(), NOW()),
(1, 7, 4, '11:00:00', '2024-09-08', 55, 3, 80, 50, 3, 75, NOW(), NOW());


INSERT INTO Admin (
    Admin_ID, 
    Username, 
    Password, 
    Role, 
    First_Name, 
    Last_Name, 
    ID_Card, 
    Email, 
    Phone_Number, 
    Register_Date, 
    Create_Date, 
    Update_Date
) VALUES (
    7,  -- ใส่เลข 7 ได้เลย MariaDB ยอมรับทันที
    'anothai', 
    '$2b$10$ZgkgKvwhVu8GvmrDU9NJmO.MVjutq2NbRx2YBnjly4rXt4dEHfoCW', 
    'SuperAdmin', 
    'Anothai', 
    'Leakvichain', 
    '1234567890123', 
    'anothai.r@email.com', 
    '0812345678', 
    '2025-09-11 00:00:00.000', 
    '2025-09-10 17:20:52.907', 
    '2025-09-25 11:03:10.563'
);
