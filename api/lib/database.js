import 'dotenv/config'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zped_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: 'Z',
  decimalNumbers: true,
})

export async function query(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params)
    return rows
  } catch (error) {
    console.error('[mysql] query failed:', error.code || error.message)
    throw error
  }
}

export async function execute(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params)
    return result
  } catch (error) {
    console.error('[mysql] execute failed:', error.code || error.message)
    throw error
  }
}

export async function withTransaction(callback) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export default pool