INSERT INTO Roles (Role_Name, Description) VALUES
('SuperAdmin', 'Highest authority, full system control.'),
('Admin', 'General system management and some user data access.')

CREATE TABLE stl.Role_Permissions (
    Role_ID INT NOT NULL,
    Permission_Key VARCHAR(100) NOT NULL,
    Has_Access BIT DEFAULT 0, 
    
    PRIMARY KEY (Role_ID, Permission_Key),
    CONSTRAINT FK_RolePermissions_RoleID FOREIGN KEY (Role_ID) REFERENCES stl.Roles(Role_ID)
);
GO


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
    7,  -- ใส่เลข 7 ได้เลย MariaDB ยอมรับทันที
    'anothai', 
    '$2b$10$ZgkgKvwhVu8GvmrDU9NJmO.MVjutq2NbRx2YBnjly4rXt4dEHfoCW', 
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

INSERT INTO Menu_Items (Menu_ID, Parent_ID, Title, Path, Permission_Key, Icon_Name, Display_Order) VALUES
-- ----------------------------------------------------
-- 1. Main Group: Home (Menu_ID: 100)
-- ----------------------------------------------------
(100, NULL, 'Home', '/home', 'nav_home', 'home', 1),

-- ----------------------------------------------------
-- 2. Level 2 (SubMenu of Home, Parent_ID: 100)
-- ----------------------------------------------------
-- แถวพวกนี้ต้นฉบับไม่มี icon ผมเติม NULL ให้ครับ
(101, 100, 'Dashboard', '/project/dashboard', 'dashboard_view', NULL, 1),
(102, 100, 'Traffic Management', '/project/trafficManagement', 'traffic_manage', NULL, 2),
(103, 100, 'Account Configuration', '/project/AccountConfiguration', 'account_config', NULL, 3),
(104, 100, 'Picture', '/project/Picture', 'picture_view', 'picture', 4),
(105, 100, 'Setting History', '/project/SettingHistory', 'setting_history', NULL, 5),
(106, 100, 'Camera Management', '/project/CameraManagement', 'camera_manage', NULL, 6),

-- ----------------------------------------------------
-- 3. Main Group: Test Menu (Menu_ID: 200)
-- ----------------------------------------------------
(200, NULL, 'Test Menu', '/test', 'nav_test', NULL, 2),

-- ----------------------------------------------------
-- 4. Level 2 (Collapse Group, Parent_ID: 200)
-- ----------------------------------------------------
(201, 200, 'Performance & Camera', '', 'perf_camera_group', 'performance', 1),

-- ----------------------------------------------------
-- 5. Level 3 (SubMenu of Collapse, Parent_ID: 201)
-- ----------------------------------------------------
(202, 201, 'Intersection View', '/project/IntersectionView', 'intersection_view', 'history', 1),
(203, 201, 'System Performance', '/project/SystemPerformance', 'system_performance', 'history', 2),
(204, 201, 'Picture Test', '/project/PictureTest', 'picture_test', 'history', 3),
(205, 201, 'Config User Permission', '/project/userPermissionConfig', 'user_permission_config', 'history', 4);


INSERT INTO Role_Permissions (Role_ID, Permission_Key, Has_Access)
VALUES
-- 1. SUPER_ADMIN (Role_ID = 1)
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

-- 2. ADMIN (Role_ID = 2)
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
(2, 'user_permission_config', 1);