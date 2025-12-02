// src/services/traffic.service.ts
import sql from 'mssql';
import { getDbPool } from '../config/dev.config';

interface TrafficMode {
    Mode_ID: number;
    Mode_Name: string;
}

interface IntersectionQueryResult {
    Intersection_ID: number;
    Name: string;
    New_Red_Duration: number;
    New_Green_Duration: number;
}

interface UpdateIntersectionData {
    Intersection_ID: number;
    New_Red_Duration: number;
    New_Green_Duration: number;
}

interface ModeLogResult {
    Log_ID: number;
    Admin_ID: number;
    Mode_ID: number;
    Date: Date;
    Time: string;
    Create_Date: Date;
    Update_Date: Date;
}

export const TrafficService = {
    async getModes(): Promise<TrafficMode[]> {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            const result = await request.query<TrafficMode>('SELECT * FROM stl.Traffic_Mode');
            return result.recordset;
        } catch (err) {
            console.error('SQL error in getModes:', err);
            throw new Error('Failed to retrieve traffic modes.');
        }
    },

    async getIntersections(): Promise<IntersectionQueryResult[]> {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            const result = await request.query<IntersectionQueryResult>(`
                SELECT T1.Intersection_ID, T2.Name, T1.New_Red_Duration, T1.New_Green_Duration
                FROM stl.Setting_Mode_Log AS T1
                JOIN stl.Master_Intersection AS T2 ON T1.Intersection_ID = T2.Intersection_ID
                WHERE T1.Create_Date IN (
                    SELECT MAX(Create_Date)
                    FROM stl.Setting_Mode_Log
                    GROUP BY Intersection_ID
                )
            `);
            return result.recordset;
        } catch (err) {
            console.error('SQL error in getIntersections:', err);
            throw new Error('Failed to retrieve intersection data.');
        }
    },

    async updateIntersections(data: UpdateIntersectionData[], adminId: number): Promise<void> {
        const pool = await getDbPool();
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();

            const request = new sql.Request(transaction);

            const modeIDQuery = await request.query`
                SELECT Mode_ID
                FROM stl.Traffic_Mode
                WHERE Mode_Name = 'Auto'
            `;
            const autoModeID = modeIDQuery.recordset[0].Mode_ID;

            for (const item of data) {
                const loopRequest = new sql.Request(transaction);
                
                // ดึงข้อมูลเก่าก่อนจะทำการ insert
                const oldValuesQuery = await loopRequest.query`
                    SELECT TOP 1 New_Red_Duration, New_Yellow_Duration, New_Green_Duration
                    FROM stl.Setting_Mode_Log
                    WHERE Intersection_ID = ${item.Intersection_ID}
                    ORDER BY Create_Date DESC;
                `;
                
                const oldValues = oldValuesQuery.recordset[0] || { 
                    New_Red_Duration: null, 
                    New_Yellow_Duration: null, 
                    New_Green_Duration: null 
                };

                loopRequest.input('modeID', sql.Int, autoModeID);
                loopRequest.input('adminId', sql.Int, adminId);
                loopRequest.input('intersectionID', sql.Int, item.Intersection_ID);
                loopRequest.input('oldRedDuration', sql.Int, oldValues.New_Red_Duration);
                loopRequest.input('oldYellowDuration', sql.Int, oldValues.New_Yellow_Duration);
                loopRequest.input('oldGreenDuration', sql.Int, oldValues.New_Green_Duration);
                loopRequest.input('newRedDuration', sql.Int, item.New_Red_Duration);
                loopRequest.input('newGreenDuration', sql.Int, item.New_Green_Duration);
                
                // ✅ แก้ไข: กำหนดค่า New_Yellow_Duration เป็น 3 โดยตรงใน VALUES
                await loopRequest.query`
                    INSERT INTO stl.Setting_Mode_Log (Mode_ID, Admin_ID, Intersection_ID, Time, Date, Old_Red_Duration, Old_Yellow_Duration, Old_Green_Duration, New_Red_Duration, New_Yellow_Duration, New_Green_Duration, Create_Date, Update_Date)
                    VALUES
                        (@modeID, @adminId, @intersectionID, CONVERT(TIME, GETDATE()), CONVERT(DATE, GETDATE()), @oldRedDuration, @oldYellowDuration, @oldGreenDuration, @newRedDuration, 3, @newGreenDuration, GETDATE(), GETDATE());
                `;
            }

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            console.error('SQL transaction error in updateIntersections:', err);
            throw new Error('Failed to update intersection times.');
        }
    },
        async updateTrafficMode(modeName: string, adminId: number): Promise<void> {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);

            const modeResult = await request.query`SELECT Mode_ID FROM stl.Traffic_Mode WHERE Mode_Name = ${modeName}`;
            if (modeResult.recordset.length === 0) {
                throw new Error('Invalid mode name provided.');
            }
            const modeID = modeResult.recordset[0].Mode_ID;

            const updateRequest = new sql.Request(pool);
            updateRequest.input('modeID', sql.Int, modeID);
            updateRequest.input('adminId', sql.Int, adminId);
            
            await updateRequest.query(`
                INSERT INTO stl.Mode_Log (Mode_ID, Admin_ID, Time, Date, Create_Date, Update_Date)
                VALUES (@modeID, @adminId, CONVERT(TIME, GETDATE()), CONVERT(DATE, GETDATE()), GETDATE(), GETDATE());
            `);
        } catch (err: unknown) {
            console.error('SQL error in updateTrafficMode:', err);
            if (err instanceof sql.RequestError) { 
                console.error('Parameter name was duplicated. This is fixed by using .input()');
            }
            throw new Error('Failed to update traffic mode.');
        }
    },

    async getCurrentModeStatus(): Promise<string | null> {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            
            const result = await request.query`
                SELECT TOP 1 tm.Mode_Name
                FROM stl.Mode_Log sml
                JOIN stl.Traffic_Mode tm ON sml.Mode_ID = tm.Mode_ID
                ORDER BY sml.Update_Date DESC;
            `;

            if (result.recordset.length > 0) {
                return result.recordset[0].Mode_Name;
            }
            return null; 
        } catch (err: unknown) {
            console.error('SQL error in getCurrentModeStatus:', err);
            if (err instanceof sql.RequestError && err.number === 208) {
                return null;
            }
            throw new Error('Failed to retrieve current traffic mode.');
        }
    },
};