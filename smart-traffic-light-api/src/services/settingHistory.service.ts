// src/services/settingHistory.service.ts
import { getDbPool } from "../config/db.config";
import { RowDataPacket } from "mysql2";

export const SettingHistoryService = {
  async getSettingModeHistory() {
    try {
      const pool = await getDbPool();
      const [rows] = await pool.query<RowDataPacket[]>(`
                SELECT
                    sml.Log_ID,
                    sml.Mode_ID,
                    sml.Admin_ID,
                    -- sml.Intersection_ID, 
                    sml.Old_Red_Duration,
                    sml.Old_Green_Duration,
                    sml.New_Red_Duration,
                    sml.New_Green_Duration,
                    CAST(sml.Time as CHAR) as Time,
                    DATE_FORMAT(sml.Date, '%Y-%m-%d') as Date,
                    DATE_FORMAT(sml.Create_Date, '%Y-%m-%dT%H:%i:%s.000Z') as Create_Date,
                    DATE_FORMAT(sml.Update_Date, '%Y-%m-%dT%H:%i:%s.000Z') as Update_Date,
                    -- จัดการชื่อ Admin (ถ้าเป็น NULL คือ Hardware)
                    IFNULL(CONCAT(a.First_Name, ' ', a.Last_Name), NULL) AS Admin_Name,
                    tm.Mode_Name,
                    -- ✅ ดึงชื่อเลนจากตาราง Master_Intersection
                    mi.Name AS Lane_Name
                FROM
                   Auto_Config_Log sml
                -- JOIN เพื่อดึงชื่อ Admin
                LEFT JOIN
                    Admin a ON sml.Admin_ID = a.Admin_ID
                -- JOIN เพื่อดึงชื่อ Mode
                JOIN
                    Traffic_Mode tm ON sml.Mode_ID = tm.Mode_ID
                -- ✅ JOIN เพื่อดึงชื่อ Lane/Intersection
                JOIN
                    Master_Intersection mi ON sml.Intersection_ID = mi.Intersection_ID
                ORDER BY
                    sml.Create_Date DESC;
            `);
      return rows;
    } catch (err) {
      console.error("SQL error in getSettingModeHistory:", err);
      throw new Error("Failed to retrieve setting mode history.");
    }
  },

  async getModeHistory() {
    try {
      const pool = await getDbPool();
      const [rows] = await pool.query<RowDataPacket[]>(`
                SELECT
                    ml.Log_ID,
                    ml.Admin_ID,
                    ml.Mode_ID,
                    CAST(ml.Time as CHAR) as Time,
                    DATE_FORMAT(ml.Date, '%Y-%m-%d') as Date,
                    DATE_FORMAT(ml.Create_Date, '%Y-%m-%dT%H:%i:%s.000Z') as Create_Date,
                    DATE_FORMAT(ml.Update_Date, '%Y-%m-%dT%H:%i:%s.000Z') as Update_Date,
                    IFNULL(CONCAT(a.First_Name, ' ', a.Last_Name), NULL) AS Admin_Name,
                    tm.Mode_Name
                FROM
                    Mode_Log ml
                LEFT JOIN
                    Admin a ON ml.Admin_ID = a.Admin_ID
                JOIN
                    Traffic_Mode tm ON ml.Mode_ID = tm.Mode_ID
                ORDER BY
                    ml.Create_Date DESC;
            `);
      return rows;
    } catch (err) {
      console.error("SQL error in getModeHistory:", err);
      throw new Error("Failed to retrieve traffic mode history.");
    }
  },
};