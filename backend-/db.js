require('dotenv').config();
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT) || 1300, // Default SQL Server port is 1433
    options: {
        encrypt: false, // Change to true if using Azure
        trustServerCertificate: true // Allow self-signed certificates
    }
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Connected to SQL Server!');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err);
        process.exit(1); // Exit process if DB fails to connect
    });

module.exports = { poolPromise, sql };
