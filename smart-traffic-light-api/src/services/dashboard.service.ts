// src/services/dashboard.service.ts
import { getDbPool } from '../config/db.config';
import { RowDataPacket } from 'mysql2';

export const DashboardService = {
    async getDashboardAnalytics(targetDate: string) {
        const pool = await getDbPool();

        // 1. ดึงข้อมูลรายเลน (Lanes Breakdown)
        const [laneStats] = await pool.query<RowDataPacket[]>(`
            SELECT 
                Intersection_ID as laneKey, 
                SUM(Vehicle_Count) as vehicleCount,
                SUM(Red_Count) as red,
                SUM(Yellow_Count) as yellow,
                SUM(Green_Count) as green
            FROM Traffic_Log 
            WHERE Date = ?
            GROUP BY Intersection_ID
        `, [targetDate]);

        // 2. ดึงข้อมูลรายชั่วโมง (Hourly Trend)
        const [hourlyStats] = await pool.query<RowDataPacket[]>(`
            SELECT 
                DATE_FORMAT(Time, '%H:00') as hour,
                SUM(CASE WHEN Intersection_ID = 1 THEN Vehicle_Count ELSE 0 END) as 'PC-A',
                SUM(CASE WHEN Intersection_ID = 2 THEN Vehicle_Count ELSE 0 END) as 'PC-B',
                SUM(CASE WHEN Intersection_ID = 3 THEN Vehicle_Count ELSE 0 END) as 'PC-C',
                SUM(CASE WHEN Intersection_ID = 4 THEN Vehicle_Count ELSE 0 END) as 'PC-D'
            FROM Traffic_Log
            WHERE Date = ?
            GROUP BY hour
            ORDER BY hour ASC
        `, [targetDate]);

        // 3. ดึงข้อมูลรายสัปดาห์ (Weekly Pattern)
        const [weeklyStats] = await pool.query<RowDataPacket[]>(`
            SELECT 
                DAYNAME(Date) as dayName,
                SUM(CASE WHEN Intersection_ID = 1 THEN Vehicle_Count ELSE 0 END) as 'PC-A',
                SUM(CASE WHEN Intersection_ID = 2 THEN Vehicle_Count ELSE 0 END) as 'PC-B',
                SUM(CASE WHEN Intersection_ID = 3 THEN Vehicle_Count ELSE 0 END) as 'PC-C',
                SUM(CASE WHEN Intersection_ID = 4 THEN Vehicle_Count ELSE 0 END) as 'PC-D',
                SUM(Vehicle_Count) as total
            FROM Traffic_Log
            WHERE Date BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?
            GROUP BY Date, dayName
            ORDER BY Date ASC
        `, [targetDate, targetDate]);

        return {
            date: targetDate,
            lanes: laneStats,
            hourly: hourlyStats,
            weekly: weeklyStats
        };
    }
};