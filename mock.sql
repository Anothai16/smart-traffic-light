INSERT INTO stl.Traffic_Mode (Mode_Name, Red_Duration, Yellow_Duration, Green_Duration, Create_Date, Update_Date)
VALUES
('Auto', 30, 5, 60, GETDATE(), GETDATE()),
('Intelligence', 25, 5, 45, GETDATE(), GETDATE()),
('Stop', 999, 0, 0, GETDATE(), GETDATE()),
('Caution', 0, 30, 0, GETDATE(), GETDATE());



INSERT INTO stl.Master_Intersection (Name, Intersection_Number, IP_Address, Location, Create_Date, Update_Date) VALUES
('Sathorn-Narathiwat', 1, '192.168.1.101', 'ถนนสาทรตัดกับถนนนราธิวาส', GETDATE(), GETDATE()),
('Asoke-Sukhumvit', 2, '192.168.1.102', 'แยกอโศกมนตรีตัดกับถนนสุขุมวิท', GETDATE(), GETDATE()),
('Ratchada-Ladprao', 3, '192.168.1.103', 'แยกรัชดาภิเษกตัดกับถนนลาดพร้าว', GETDATE(), GETDATE()),
('Victory Monument', 4, '192.168.1.104', 'อนุสาวรีย์ชัยสมรภูมิ', GETDATE(), GETDATE());
GO

-- Mock Data for Setting_Mode_Log table
INSERT INTO stl.Setting_Mode_Log (Mode_ID, Admin_ID, Intersection_ID, Time, Date, Old_Red_Duration, Old_Yellow_Duration, Old_Green_Duration, New_Red_Duration, New_Yellow_Duration, New_Green_Duration, Create_Date, Update_Date)
VALUES
(21, 14, 5, '08:30:00', '2024-09-08', 35, 3, 50, 40, 3, 60, GETDATE(), GETDATE()),
(21, 14, 6, '09:15:00', '2024-09-08', 45, 3, 70, 40, 3, 65, GETDATE(), GETDATE()),
(21, 14, 7, '10:45:00', '2024-09-08', 30, 3, 45, 30, 3, 45, GETDATE(), GETDATE()),
(21, 14, 8, '11:00:00', '2024-09-08', 55, 3, 80, 50, 3, 75, GETDATE(), GETDATE());