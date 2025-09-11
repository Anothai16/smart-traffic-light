CREATE DATABASE Smart_Traffic_Light;
GO

USE Smart_Traffic_Light;
GO

CREATE SCHEMA stl;
GO
-- Create Master_Intersection table
CREATE TABLE stl.Master_Intersection (
    Intersection_ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255),
    Intersection_Number INT,
    IP_Address NVARCHAR(50),
    Location NVARCHAR(255),
    Create_Date DATETIME,
    Update_Date DATETIME
);
GO

-- Create Traffic_Mode table
CREATE TABLE stl.Traffic_Mode (
    Mode_ID INT IDENTITY(1,1) PRIMARY KEY,
    Mode_Name NVARCHAR(255),
    Red_Duration INT,
    Yellow_Duration INT,
    Green_Duration INT,
    Create_Date DATETIME,
    Update_Date DATETIME
);
GO

-- Create the Admin table under the 'stl' schema
CREATE TABLE stl.Admin (
    Admin_ID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(255),
    Password NVARCHAR(255),
    Role NVARCHAR(50),
    First_Name NVARCHAR(255),
    Last_Name NVARCHAR(255),
    ID_Card NVARCHAR(20),
    Email NVARCHAR(255),
    Phone_Number NVARCHAR(20),
    Register_Date DATETIME,
    Create_Date DATETIME,
    Update_Date DATETIME
);
GO

-- Create Traffic_Log table with a foreign key to Master_Intersection
CREATE TABLE stl.Traffic_Log (
    Traffic_Log_ID INT IDENTITY(1,1) PRIMARY KEY,
    Intersection_ID INT FOREIGN KEY REFERENCES stl.Master_Intersection(Intersection_ID),
    Red_Count INT,
    Yellow_Count INT,
    Green_Count INT,
    Picture NVARCHAR(255),
    Vehicle_Count INT,
    Date DATE,
    Time TIME,
    Create_Date DATETIME,
    Update_Date DATETIME
);
GO

-- Create Setting_Mode_Log table with foreign keys to Traffic_Mode and stl.Admin
CREATE TABLE stl.Setting_Mode_Log (
    Log_ID INT IDENTITY(1,1) PRIMARY KEY,
    Mode_ID INT FOREIGN KEY REFERENCES stl.Traffic_Mode(Mode_ID),
    Admin_ID INT FOREIGN KEY REFERENCES stl.Admin(Admin_ID),
    Intersection_ID INT,
    Time TIME,
    Date DATE,
    Old_Red_Duration INT,
    Old_Yellow_Duration INT,
    Old_Green_Duration INT,
    New_Red_Duration INT,
    New_Yellow_Duration INT,
    New_Green_Duration INT,
    Create_Date DATETIME,
    Update_Date DATETIME,
    CONSTRAINT FK_ModeLog_Intersection FOREIGN KEY (Intersection_ID) REFERENCES stl.Master_Intersection(Intersection_ID)
);
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

-- Create Picture_Log table with a foreign key to Traffic_Log
CREATE TABLE stl.Picture_Log (
    Picture_ID INT IDENTITY(1,1) PRIMARY KEY,
    Traffic_Log_ID INT FOREIGN KEY REFERENCES stl.Traffic_Log(Traffic_Log_ID),
    Image_Path NVARCHAR(255),
    Time TIME,
    Date DATE
);
GO