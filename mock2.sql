INSERT INTO stl.Roles (Role_Name, Description) VALUES
('SUPER_ADMIN', 'Highest authority, full system control.'),
('ADMIN', 'General system management and some user data access.')
GO

CREATE TABLE stl.Role_Permissions (
    Role_ID INT NOT NULL,
    Permission_Key VARCHAR(100) NOT NULL,
    Has_Access BIT DEFAULT 0, 
    
    PRIMARY KEY (Role_ID, Permission_Key),
    CONSTRAINT FK_RolePermissions_RoleID FOREIGN KEY (Role_ID) REFERENCES stl.Roles(Role_ID)
);
GO


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

SET IDENTITY_INSERT stl.Admin ON;
GO

INSERT INTO stl.Admin (
    Admin_ID, 
    Username, 
    Password, 
    Role_ID, 
    First_Name, 
    Last_Name, 
    ID_Card, 
    Email, 
    Phone_Number, 
    Register_Date, 
    Create_Date, 
    Update_Date
) VALUES (
    7, -- ต้องระบุค่า Admin_ID ที่นี่
    'anothai', 
    '$2b$10$V9.azCJYtKcmmy0bjXaIyuwHEgXe46kX56UD1qWKDZSy4DnM5Made', 
    1, 
    'Anothai', 
    'Leakvichain', 
    '1234567890123', 
    'anothai.r@email.com', 
    '0812345678', 
    '2025-09-11 00:00:00.000', 
    '2025-09-10 17:20:52.907', 
    '2025-09-25 11:03:10.563'
);
GO

SET IDENTITY_INSERT stl.Admin OFF;
GO

-- อนุญาตให้ใส่ค่า Menu_ID ได้ด้วยตัวเอง เพื่อจัดการความสัมพันธ์ Parent_ID
SET IDENTITY_INSERT stl.Menu_Items ON;
GO

INSERT INTO stl.Menu_Items (Menu_ID, Parent_ID, Title, Path, Permission_Key, Icon_Name, Display_Order) VALUES
-- ----------------------------------------------------
-- 1. Main Group: Home (Menu_ID: 100)
-- ----------------------------------------------------
(100, NULL, 'Home', '/home', 'nav_home', 'home', 1),

-- ----------------------------------------------------
-- 2. Level 2 (SubMenu of Home, Parent_ID: 100)
-- ----------------------------------------------------
(101, 100, 'Dashboard', '/project/dashboard', 'dashboard_view', 1),
(102, 100, 'Traffic Management', '/project/trafficManagement', 'traffic_manage', 2),
(103, 100, 'Account Configuration', '/project/AccountConfiguration', 'account_config', 3),
(104, 100, 'Picture', '/project/Picture', 'picture_view', 'picture', 4),
(105, 100, 'Setting History', '/project/SettingHistory', 'setting_history', 5),
(106, 100, 'Camera Management', '/project/CameraManagement', 'camera_manage', 6),

-- ----------------------------------------------------
-- 3. Main Group: Test Menu (Menu_ID: 200)
-- ----------------------------------------------------
(200, NULL, 'Test Menu', '/test', 'nav_test', NULL, 2),

-- ----------------------------------------------------
-- 4. Level 2 (Collapse Group, Parent_ID: 200)
-- ***แก้ไข Path จาก NULL เป็น '' (Empty String)***
-- ----------------------------------------------------
(201, 200, 'Performance & Camera', '', 'perf_camera_group', 'performance', 1),

-- ----------------------------------------------------
-- 5. Level 3 (SubMenu of Collapse, Parent_ID: 201)
-- ----------------------------------------------------
(202, 201, 'Intersection View', '/project/IntersectionView', 'intersection_view', 'history', 1),
(203, 201, 'System Performance', '/project/SystemPerformance', 'system_performance', 'history', 2),
(204, 201, 'Picture Test', '/project/PictureTest', 'picture_test', 'history', 3),
(205, 201, 'Config User Permission', '/project/userPermissionConfig', 'user_permission_config', 'history', 4);
GO

-- คืนค่าการทำงานของ IDENTITY_INSERT ให้เป็นปกติ
SET IDENTITY_INSERT stl.Menu_Items OFF;
GO

INSERT INTO stl.Role_Permissions (Role_ID, Permission_Key, Has_Access)
VALUES
-- 1. SUPER_ADMIN (Role_ID = 1): Full Access (13 Permissions)
(1, 'nav_home', 1),
(1, 'dashboard_view', 1),
(1, 'traffic_manage', 1),
(1, 'account_config', 1),
(1, 'picture_view', 1),
(1, 'setting_history', 1),
(1, 'camera_manage', 1),
(1, 'nav_test', 1),
(1, 'perf_camera_group', 1),
(1, 'intersection_view', 1),
(1, 'system_performance', 1),
(1, 'picture_test', 1),
(1, 'user_permission_config', 1),

-- 2. ADMIN (Role_ID = 2): Full Access (13 Permissions)
(2, 'nav_home', 1),
(2, 'dashboard_view', 1),
(2, 'traffic_manage', 1),
(2, 'account_config', 1),
(2, 'picture_view', 1),
(2, 'setting_history', 1),
(2, 'camera_manage', 1),
(2, 'nav_test', 1),
(2, 'perf_camera_group', 1),
(2, 'intersection_view', 1),
(2, 'system_performance', 1),
(2, 'picture_test', 1),
(2, 'user_permission_config', 1)
;
GO

$2b$10$NgHI1Ud9gv4/ykMfdmo26OQ0tXWkNKQEhJ92Ux7oCAWMYplgEpyKC
12345