-- 1. ปิดการเช็ค Foreign Key ชั่วคราว เพื่อให้ลบ/สร้างตารางได้ราบรื่น
SET FOREIGN_KEY_CHECKS = 0;

-- 2. เลือก Database (ถ้ายังไม่ได้สร้างให้รัน CREATE DATABASE Smart_Traffic_Light; ก่อน)
USE Smart_Traffic_Light;

-- ==========================================
-- 3. ล้างตารางเก่าทิ้ง (ถ้ามี)
-- ==========================================
DROP TABLE IF EXISTS Picture_Log;
DROP TABLE IF EXISTS Mode_Log;
DROP TABLE IF EXISTS Auto_Config_Log;
DROP TABLE IF EXISTS Traffic_Log;
DROP TABLE IF EXISTS Admin;
DROP TABLE IF EXISTS Traffic_Mode;
DROP TABLE IF EXISTS Master_Intersection;

-- ==========================================
-- 4. เริ่มสร้างตารางใหม่ (Parent Tables)
-- ==========================================

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

-- ตาราง Admin (แบบเก็บ Role เป็น Text ไม่ได้แยกตาราง)
CREATE TABLE Admin (
    Admin_ID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255),
    Password VARCHAR(255),
    Role VARCHAR(50),        -- เก็บชื่อ Role ตรงๆ เช่น 'Admin', 'User'
    First_Name VARCHAR(255),
    Last_Name VARCHAR(255),
    ID_Card VARCHAR(20),
    Email VARCHAR(255),
    Phone_Number VARCHAR(20),
    Register_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Create_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Update_Date DATETIME ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==========================================
-- 5. สร้างตารางลูก (Child Tables)
-- ==========================================

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

-- ตาราง Auto_Config_Log
CREATE TABLE Auto_Config_Log(
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
    FOREIGN KEY (Intersection_ID) REFERENCES Master_Intersection(Intersection_ID)
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

-- 6. เปิดการเช็ค Foreign Key กลับคืน
SET FOREIGN_KEY_CHECKS = 1;