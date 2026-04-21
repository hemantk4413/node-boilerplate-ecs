const { Sequelize } = require("sequelize");
const { config: dotenvConfig } = require("dotenv");

// Load environment variables (local dev only — ECS uses Secrets Manager)
dotenvConfig();

const { DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD } = process.env;

// First connect without a database to create it if it doesn't exist
const initSequelize = new Sequelize({
  dialect: "mysql",
  host: DB_HOST,
  port: parseInt(DB_PORT) || 3306,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  dialectOptions: {
    connectTimeout: 10000,
    ssl: { rejectUnauthorized: false },
  },
  logging: false,
});

// Main sequelize instance used by the app
const sequelize = new Sequelize({
  dialect: "mysql",
  host: DB_HOST,
  port: parseInt(DB_PORT) || 3306,
  database: DB_DATABASE,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  dialectOptions: {
    connectTimeout: 10000,
    ssl: { rejectUnauthorized: false },
  },
  logging: false,
});

// Create the database if it doesn't exist, then authenticate
initSequelize
  .query(`CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\`;`)
  .then(() => {
    console.log(`Database '${DB_DATABASE}' ready.`);
    return sequelize.authenticate();
  })
  .then(() => {
    console.log("Database connection established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err.message);
  });

module.exports = sequelize;
