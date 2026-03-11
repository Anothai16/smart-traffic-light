// src/config/db.config.ts
import mysql from 'mysql2/promise'; // เปลี่ยน driver เป็น mysql2
import { config } from './index'; // Import main config loaded from .env

// Type guard to check if essential DB config values are present
function hasDbConfig(cfg: typeof config): cfg is typeof config & { DB_HOST: string; DB_USER: string; DB_PASSWORD: string; DB_NAME: string } {
    return !!(cfg.DB_HOST && cfg.DB_USER && cfg.DB_PASSWORD && cfg.DB_NAME);
}

// Check if required DB config is available
if (!hasDbConfig(config)) {
    console.warn('⚠️ Database configuration (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) is incomplete. Database connection will not be established.');
}

// MySQL/MariaDB configuration object
const dbConfig: mysql.PoolOptions = {
    host: config.DB_HOST || '',      
    port: Number(config.DB_PORT) || 3306, 
    user: config.DB_USER || '',
    password: config.DB_PASSWORD || '',
    database: config.DB_NAME || '',
    timezone: '+07:00',
    waitForConnections: true,       
    connectionLimit: 10,            
    queueLimit: 0,
    connectTimeout: 30000, 

};

let pool: mysql.Pool | null = null;

/**
 * Establishes a MySQL connection pool if not already created,
 * and returns the pool instance.
 */
export async function getDbPool(): Promise<mysql.Pool> {
    // Return existing pool if already created
    if (pool) {
        return pool;
    }

    // Check configuration
    if (!hasDbConfig(config)) {
        throw new Error('Cannot establish database connection due to incomplete configuration.');
    }

    try {
        console.log(`Attempting to connect to database: ${dbConfig.database} on ${dbConfig.host}...`);

        // Create the pool
        pool = mysql.createPool(dbConfig);

        // Test the connection by trying to get one connection from the pool
        // (mysql.createPool ไม่ได้ connect ทันทีเหมือน mssql เราต้องลอง ping ดู)
        const connection = await pool.getConnection();
        console.log('✅ Database connection pool established successfully (MariaDB/MySQL).');
        
        // Release connection back to pool immediately after check
        connection.release();

        return pool;
    } catch (error: any) {
        console.error('❌ Failed to establish database connection pool:', error.message);
        pool = null;
        throw error;
    }
}

/**
 * Closes the database connection pool gracefully.
 */
export async function closeDbPool(): Promise<void> {
    if (pool) {
        try {
            console.log('Attempting to close database connection pool...');
            await pool.end(); // ใน mysql2 ใช้ .end() แทน .close()
            pool = null;
            console.log('Database connection pool closed successfully.');
        } catch (error: any) {
            console.error('Error closing database connection pool:', error.message);
            pool = null;
        }
    } else {
        console.log('Database connection pool already closed or not initialized.');
    }
}