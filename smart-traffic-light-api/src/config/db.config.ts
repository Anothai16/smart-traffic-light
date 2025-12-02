// src/config/db.config.ts
import sql from 'mssql';
import { config } from './index'; // Import main config loaded from .env

// Type guard to check if essential DB config values are present
function hasDbConfig(cfg: typeof config): cfg is typeof config & { DB_HOST: string; DB_USER: string; DB_PASSWORD: string; DB_NAME: string } {
    return !!(cfg.DB_HOST && cfg.DB_USER && cfg.DB_PASSWORD && cfg.DB_NAME);
}

// Check if required DB config is available
if (!hasDbConfig(config)) {
    console.warn('⚠️ Database configuration (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) is incomplete in environment variables. Database connection will not be established.');
    // You might throw an error here if DB connection is absolutely mandatory
    // throw new Error('Missing required database configuration.');
}

// MS SQL configuration object using values from the main config
export const sqlConfig: sql.config = {
    server: config.DB_HOST || '', // Server IP address or hostname
    port: config.DB_PORT || 3306 , // Default MS SQL port
    user: config.DB_USER || '', // Database user
    password: config.DB_PASSWORD || '', // Database password
    database: config.DB_NAME || '', // Database name
    connectionTimeout: 30000, // Connection timeout in milliseconds
    requestTimeout: 180000, // Connection timeout in milliseconds
    pool: {
        max              : 10,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: false, // Use encryption in production (recommended)
        trustServerCertificate: true  // Trust self-signed certs in dev (use false in production unless necessary and understood)
       
    }
};

// Variable to hold the connection pool instance (Singleton pattern)
let pool: sql.ConnectionPool | null = null;

/**
 * Establishes an MS SQL connection pool if not already created,
 * and returns the pool instance.
 * @returns {Promise<sql.ConnectionPool>} A promise that resolves with the connection pool.
 * @throws {Error} If connection fails.
 */
export async function getDbPool(): Promise<sql.ConnectionPool> {
    // Return existing pool if already connected
    if (pool && pool.connected) {
        // console.log('Returning existing DB connection pool.'); // Optional log
        return pool;
    }

    // Check if configuration is complete before attempting connection
     if (!hasDbConfig(config)) {
        throw new Error('Cannot establish database connection due to incomplete configuration.');
     }

    try {
        console.log(`Attempting to connect to database: ${sqlConfig.database} on ${sqlConfig.server}...`);
        // Create a new pool instance
        pool = new sql.ConnectionPool(sqlConfig);
        // Establish the connection
        await pool.connect();
        console.log('✅ Database connection pool established successfully.');

        // Optional: Handle pool errors after connection
        pool.on('error', (err: Error) => {
            console.error('Database Pool Error:', err);
            // You might want to attempt reconnection or log specifics here
            // Consider closing the pool if errors persist: pool?.close(); pool = null;
        });

        return pool;
    } catch (error: any) {
        console.error('❌ Failed to establish database connection pool:', error.message);
        // Clear the pool variable on failure to allow retries if needed
        pool = null;
        // Re-throw the error so the calling function knows connection failed
        throw error;
    }
}

/**
 * Closes the database connection pool gracefully.
 */
export async function closeDbPool(): Promise<void> {
    if (pool && pool.connected) {
        try {
            console.log('Attempting to close database connection pool...');
            await pool.close();
            pool = null;
            console.log('Database connection pool closed successfully.');
        } catch (error: any) {
            console.error('Error closing database connection pool:', error.message);
            pool = null; // Ensure pool is null even if close fails
        }
    } else {
        console.log('Database connection pool already closed or not initialized.');
    }
}