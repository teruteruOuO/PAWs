// Import the mysql2 library
import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config(); // This ensures environment variables are loaded

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Read a query (SELECT)
function executeReadQuery(query, params) {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
}

// Execute a query (INSERT, UPDATE, DELETE) and autocommits
function executeWriteQuery(query, params) {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
}

// Begin, Commit, and Rollback a Transaction (USE when performing atleast 2 query executes)
function executeTransaction(queries) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                return reject(err);
            }

            connection.beginTransaction((err) => {
                if (err) {
                    connection.release();
                    return reject(err);
                }

                const promises = queries.map(({ query, params }) => {
                    return new Promise((resolve, reject) => {
                        connection.query(query, params, (err, results) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(results);
                        });
                    });
                });

                Promise.all(promises)
                .then((results) => {
                    connection.commit((err) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            reject(err);
                        });
                    }
                    connection.release();
                    resolve(results);
                    });
                })
                .catch((err) => {
                    connection.rollback(() => {
                        connection.release();
                        reject(err);
                    });
                });
            });
        });
    });
}

// Export the functions as a module
export { executeReadQuery, executeWriteQuery, executeTransaction }