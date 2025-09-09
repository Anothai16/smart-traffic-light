import sql from 'mssql';
import { getDbPool } from '../config/dev.config';

export const SettingHistoryService = {
    async getSettingModeHistory() {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            const result = await request.query(`
                SELECT
                    sml.*,
                    a.First_Name + ' ' + a.Last_Name AS Admin_Name,
                    tm.Mode_Name,
                    mi.Name AS Intersection_Name
                FROM
                    stl.Setting_Mode_Log sml
                JOIN
                    stl.Admin a ON sml.Admin_ID = a.Admin_ID
                JOIN
                    stl.Traffic_Mode tm ON sml.Mode_ID = tm.Mode_ID
                JOIN
                    stl.Master_Intersection mi ON sml.Intersection_ID = mi.Intersection_ID
                ORDER BY
                    sml.Create_Date DESC;
            `);
            return result.recordset;
        } catch (err) {
            console.error('SQL error in getSettingModeHistory:', err);
            throw new Error('Failed to retrieve setting mode history.');
        }
    },

    async getModeHistory() {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            const result = await request.query(`
                SELECT
                    ml.*,
                    a.First_Name + ' ' + a.Last_Name AS Admin_Name,
                    tm.Mode_Name
                FROM
                    stl.Mode_Log ml
                JOIN
                    stl.Admin a ON ml.Admin_ID = a.Admin_ID
                JOIN
                    stl.Traffic_Mode tm ON ml.Mode_ID = tm.Mode_ID
                ORDER BY
                    ml.Create_Date DESC;
            `);
            return result.recordset;
        } catch (err) {
            console.error('SQL error in getModeHistory:', err);
            throw new Error('Failed to retrieve traffic mode history.');
        }
    },
};