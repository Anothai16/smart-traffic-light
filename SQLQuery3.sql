use Smart_Traffic_Light
delete from stl.Admin

INSERT INTO stl.Admin (
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
    'admin',
    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', -- รหัสผ่านที่ถูกแฮชจาก '123Qwe'
    'admin',
    'John',
    'Doe',
    '1234567890123',
    'admin@example.com',
    '0812345678',
    GETDATE(),
    GETDATE(),
    GETDATE()
);

delete stl.Admin

WHERE Admin_ID = 3;

select * from stl.Setting_Mode_Log
select * from stl.Traffic_Mode
select * from stl.Mode_Log
delete from stl.Traffic_Mode
UPDATE stl.Admin
SET Role = 'admin'
WHERE Admin_ID = 13;
delete stl.Traffic_Mode
INSERT INTO stl.Traffic_Mode (Mode_Name, Red_Duration, Yellow_Duration, Green_Duration, Create_Date, Update_Date)
VALUES
('Auto', 30, 5, 60, GETDATE(), GETDATE()),
('Intelligence', 25, 5, 45, GETDATE(), GETDATE()),
('Stop', 999, 0, 0, GETDATE(), GETDATE()),
('Caution', 0, 30, 0, GETDATE(), GETDATE());


ALTER TABLE [stl].[Setting_Mode_Log]
ADD [Intersection_ID] INT;
GO

ALTER TABLE [stl].[Setting_Mode_Log]
ADD CONSTRAINT FK_ModeLog_Intersection
FOREIGN KEY ([Intersection_ID]) REFERENCES [stl].[Master_Intersection]([Intersection_ID]);
GO

INSERT INTO stl.Master_Intersection (Name, IP_Address, Location, Create_Date, Update_Date) VALUES
('Sathorn-Narathiwat', '192.168.1.101', 'ถนนสาทรตัดกับถนนนราธิวาส', GETDATE(), GETDATE()),
('Asoke-Sukhumvit', '192.168.1.102', 'แยกอโศกมนตรีตัดกับถนนสุขุมวิท', GETDATE(), GETDATE()),
('Ratchada-Ladprao', '192.168.1.103', 'แยกรัชดาภิเษกตัดกับถนนลาดพร้าว', GETDATE(), GETDATE()),
('Victory Monument', '192.168.1.104', 'อนุสาวรีย์ชัยสมรภูมิ', GETDATE(), GETDATE());
GO

-- Create Mode_Log table with foreign keys to stl.Admin and Traffic_Mode
CREATE TABLE stl.Mode_Log (
    Log_ID INT IDENTITY(1,1) PRIMARY KEY,
    Admin_ID INT FOREIGN KEY REFERENCES stl.Admin(Admin_ID),
    Mode_ID INT FOREIGN KEY REFERENCES stl.Traffic_Mode(Mode_ID),
    Date DATE,
    Time TIME,
    Create_Date DATETIME,
    Update_Date DATETIME
);
GO

ALTER TABLE stl.Traffic_Mode
DROP COLUMN Red_Duration, Yellow_Duration, Green_Duration;
GO

INSERT INTO stl.Traffic_Mode (Mode_Name, Create_Date, Update_Date) VALUES
('Auto', GETDATE(), GETDATE()),
('Intelligence', GETDATE(), GETDATE()),
('Caution', GETDATE(), GETDATE()),
('Stop', GETDATE(), GETDATE());
GO

delete from stl.Master_Intersection

INSERT INTO stl.Master_Intersection (Name, Intersection_Number, IP_Address, Location, Create_Date, Update_Date) VALUES
('Sathorn-Narathiwat', 1, '192.168.1.101', 'ถนนสาทรตัดกับถนนนราธิวาส', GETDATE(), GETDATE()),
('Asoke-Sukhumvit', 2, '192.168.1.102', 'แยกอโศกมนตรีตัดกับถนนสุขุมวิท', GETDATE(), GETDATE()),
('Ratchada-Ladprao', 3, '192.168.1.103', 'แยกรัชดาภิเษกตัดกับถนนลาดพร้าว', GETDATE(), GETDATE()),
('Victory Monument', 4, '192.168.1.104', 'อนุสาวรีย์ชัยสมรภูมิ', GETDATE(), GETDATE());
GO

-- Mock Data for Setting_Mode_Log table
INSERT INTO stl.Setting_Mode_Log (Mode_ID, Admin_ID, Intersection_ID, Time, Date, New_Red_Duration, New_Green_Duration, Create_Date, Update_Date) VALUES
(21, 14, 5, '10:00:00', '2025-09-05', 60, 30, GETDATE(), GETDATE()),
(21, 14, 6, '10:05:00', '2025-09-05', 90, 45, GETDATE(), GETDATE()),
(21, 14, 7, '10:10:00', '2025-09-05', 120, 60, GETDATE(), GETDATE()),
(21, 14, 8, '10:15:00', '2025-09-05', 150, 75, GETDATE(), GETDATE());
GO

select * from stl.Setting_Mode_Log