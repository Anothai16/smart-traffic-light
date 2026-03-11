// src/services/DashboardService.ts

import { getDbPool } from '../config/db.config';
import { RowDataPacket } from 'mysql2';

export interface DashboardResponse {
    date: string;
    lanes: any[];
    hourly: any[];
    weekly: any[];
}

export const DashboardService = {
    async getDashboardAnalytics(startDate: string, endDate: string) {
        try {
            const pool = await getDbPool();

            // ---------------------------------------------------------
            // 1. ข้อมูลรายเลน (สำหรับตาราง Lane Breakdown)
            // ---------------------------------------------------------
            const [laneStats] = await pool.query<RowDataPacket[]>(`
                SELECT 
                    m.Name as laneName, 
                    m.Intersection_ID as laneKey,
                    COALESCE(SUM(t.Vehicle_Count), 0) as vehicleCount,
                    COALESCE(SUM(t.Violation_Count), 0) as violationCount
                FROM Master_Intersection m
                LEFT JOIN Traffic_Log t ON t.Intersection_ID = m.Intersection_ID AND DATE(t.Date) BETWEEN ? AND ?
                GROUP BY m.Intersection_ID, m.Name
                ORDER BY m.Lane_Sequence ASC
            `, [startDate, endDate]);

            // ---------------------------------------------------------
            // 2. ข้อมูลรายชั่วโมง
            // ---------------------------------------------------------
            const [hourlyRaw] = await pool.query<RowDataPacket[]>(`
                SELECT 
                    DATE_FORMAT(t.Time, '%H:00') as hour,
                    m.Name as laneName,
                    SUM(t.Vehicle_Count) as count
                FROM Traffic_Log t
                JOIN Master_Intersection m ON t.Intersection_ID = m.Intersection_ID
                WHERE DATE(t.Date) BETWEEN ? AND ? 
                GROUP BY hour, m.Name
                ORDER BY hour ASC
            `, [startDate, endDate]);

            const hourlyMap: Record<string, any> = {};
            hourlyRaw.forEach((row: any) => {
                if (!hourlyMap[row.hour]) hourlyMap[row.hour] = { hour: row.hour };
                hourlyMap[row.hour][row.laneName] = row.count;
            });
            const hourlyStats = Object.values(hourlyMap).sort((a: any, b: any) => a.hour.localeCompare(b.hour));

            // ---------------------------------------------------------
            // 3. ข้อมูลรายสัปดาห์ 
            // ---------------------------------------------------------
            const [weeklyRaw] = await pool.query<RowDataPacket[]>(`
                SELECT 
                    DATE_FORMAT(t.Date, '%W') as dayName,
                    DATE_FORMAT(t.Date, '%Y-%m-%d') as fullDate, 
                    m.Name as laneName,
                    SUM(t.Vehicle_Count) as count
                FROM Traffic_Log t
                JOIN Master_Intersection m ON t.Intersection_ID = m.Intersection_ID
                WHERE YEARWEEK(DATE(t.Date), 0) = YEARWEEK(?, 0)
                GROUP BY fullDate, dayName, m.Name
                ORDER BY fullDate ASC
            `, [startDate, endDate]);

            const weeklyMap: Record<string, any> = {};
            weeklyRaw.forEach((row: any) => {
                const key = row.fullDate;
                if (!weeklyMap[key]) {
                    weeklyMap[key] = { 
                        dayName: row.dayName, 
                        fullDate: row.fullDate,
                        total: 0
                    };
                }
                weeklyMap[key][row.laneName] = Number(row.count); 
                weeklyMap[key].total += Number(row.count);
            });
            const weeklyStats = Object.values(weeklyMap);

            return {
                date: `${startDate} to ${endDate}`,
                lanes: laneStats,
                hourly: hourlyStats,
                weekly: weeklyStats
            };
        } catch (error) {
            console.error("❌ DashboardService Error:", error);
            throw error;
        }
    }
};