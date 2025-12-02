-- 1. ปิดการตรวจสอบ Foreign Key ชั่วคราว (เพื่อให้ลบ/สร้างได้ไม่ติดขัด)
SET FOREIGN_KEY_CHECKS = 0;

-- 2. เลือก Database (ตรวจสอบชื่อให้ตรงกับที่คุณใช้)
USE Smart_Traffic_Light;

-- ==========================================
-- 3. ล้างตารางเก่าทิ้งให้เกลี้ยง (Clean Reset)
-- ==========================================
DROP TABLE IF EXISTS Role_Permissions;
DROP TABLE IF EXISTS Menu_Items;
DROP TABLE IF EXISTS Picture_Log;
DROP TABLE IF EXISTS Mode_Log;
DROP TABLE IF EXISTS Setting_Mode_Log;
DROP TABLE IF EXISTS Traffic_Log;
DROP TABLE IF EXISTS Admin;
DROP TABLE IF EXISTS Roles;
DROP TABLE IF EXISTS Traffic_Mode;
DROP TABLE IF EXISTS Master_Intersection;

-- ==========================================
-- 4. เริ่มสร้างตารางใหม่
-- ==========================================

-- ตาราง Roles
CREATE TABLE Roles (
    Role_ID INT AUTO_INCREMENT PRIMARY KEY,
    Role_Name VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255)
) ENGINE=InnoDB;

-- ตาราง Master_Intersection
CREATE TABLE Master_Intersection (
    Intersection_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255),
    Intersection_Number INT,
    IP_Address VARCHAR(50),
    Location VARCHAR(255),
    Create_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Update_Date DATETIME ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ตาราง Traffic_Mode
CREATE TABLE Traffic_Mode (
    Mode_ID INT AUTO_INCREMENT PRIMARY KEY,
    Mode_Name VARCHAR(255),
    Red_Duration INT,
    Yellow_Duration INT,
    Green_Duration INT,
    Create_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Update_Date DATETIME ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ตาราง Menu_Items
CREATE TABLE Menu_Items (
    Menu_ID INT AUTO_INCREMENT PRIMARY KEY,
    Parent_ID INT,
    Title VARCHAR(100) NOT NULL,
    Path VARCHAR(100) NOT NULL UNIQUE,
    Permission_Key VARCHAR(100) NOT NULL UNIQUE,
    Display_Order INT,
    
    -- ทำ Self-Referencing (เมนูแม่-เมนูลูก) ในตัวเลย
    CONSTRAINT FK_MenuItems_ParentID FOREIGN KEY (Parent_ID) REFERENCES Menu_Items(Menu_ID)
) ENGINE=InnoDB;
ALTER TABLE Menu_Items 
ADD COLUMN Icon_Name VARCHAR(50) AFTER Permission_Key;

-- ตาราง Admin
CREATE TABLE Admin (
    Admin_ID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role_ID INT NOT NULL,
    First_Name VARCHAR(255),
    Last_Name VARCHAR(255),
    ID_Card VARCHAR(20),
    Email VARCHAR(255),
    Phone_Number VARCHAR(20),
    Register_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Create_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Update_Date DATETIME ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_Admin_RoleID FOREIGN KEY (Role_ID) REFERENCES Roles(Role_ID)
) ENGINE=InnoDB;

-- ตาราง Role_Permissions
CREATE TABLE Role_Permissions (
    Role_ID INT NOT NULL,
    Permission_Key VARCHAR(100) NOT NULL,
    Has_Access BOOLEAN DEFAULT 0,
    
    PRIMARY KEY (Role_ID, Permission_Key),
    CONSTRAINT FK_RolePermissions_RoleID FOREIGN KEY (Role_ID) REFERENCES Roles(Role_ID)
) ENGINE=InnoDB;

-- ตาราง Traffic_Log
CREATE TABLE Traffic_Log (
    Traffic_Log_ID INT AUTO_INCREMENT PRIMARY KEY,
    Intersection_ID INT,
    Red_Count INT,
    Yellow_Count INT,
    Green_Count INT,
    Picture VARCHAR(255),
    Vehicle_Count INT,
    Date DATE,
    Time TIME,
    Create_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Update_Date DATETIME ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (Intersection_ID) REFERENCES Master_Intersection(Intersection_ID)
) ENGINE=InnoDB;

-- ตาราง Setting_Mode_Log
CREATE TABLE Setting_Mode_Log (
    Log_ID INT AUTO_INCREMENT PRIMARY KEY,
    Mode_ID INT,
    Admin_ID INT,
    Intersection_ID INT,
    Time TIME,
    Date DATE,
    Old_Red_Duration INT,
    Old_Yellow_Duration INT,
    Old_Green_Duration INT,
    New_Red_Duration INT,
    New_Yellow_Duration INT,
    New_Green_Duration INT,
    Create_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Update_Date DATETIME ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (Mode_ID) REFERENCES Traffic_Mode(Mode_ID),
    FOREIGN KEY (Admin_ID) REFERENCES Admin(Admin_ID),
    CONSTRAINT FK_ModeLog_Intersection FOREIGN KEY (Intersection_ID) REFERENCES Master_Intersection(Intersection_ID)
) ENGINE=InnoDB;

-- ตาราง Mode_Log
CREATE TABLE Mode_Log (
    Log_ID INT AUTO_INCREMENT PRIMARY KEY,
    Admin_ID INT,
    Mode_ID INT,
    Date DATE,
    Time TIME,
    Create_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Update_Date DATETIME ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (Admin_ID) REFERENCES Admin(Admin_ID),
    FOREIGN KEY (Mode_ID) REFERENCES Traffic_Mode(Mode_ID)
) ENGINE=InnoDB;

-- ตาราง Picture_Log
CREATE TABLE Picture_Log (
    Picture_ID INT AUTO_INCREMENT PRIMARY KEY,
    Intersection_ID INT,
    Image_Path VARCHAR(255),
    Time TIME,
    Date DATE,
    
    FOREIGN KEY (Intersection_ID) REFERENCES Master_Intersection(Intersection_ID)
) ENGINE=InnoDB;

-- ==========================================
-- 5. เปิดการตรวจสอบ Foreign Key กลับคืน (เพื่อความปลอดภัยในอนาคต)
-- ==========================================
SET FOREIGN_KEY_CHECKS = 1;