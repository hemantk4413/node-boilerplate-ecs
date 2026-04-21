const { Sequelize } = require("sequelize");
const { Signer } = require("@aws-sdk/rds-signer");
const { config: dotenvConfig } = require("dotenv");

// Load environment variables
dotenvConfig();

// Extract required variables from environment
const { DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_REGION } = process.env;

// AWS RDS Signer options
const signerOptions = {
  region: DB_REGION,
  hostname: DB_HOST,
  port: parseInt(DB_PORT),
  username: DB_USERNAME,
};

// Initialize AWS RDS signer
const signer = new Signer(signerOptions);

// Function to generate IAM authentication token
const generateAuthToken = async () => {
  try {
    const token = await signer.getAuthToken();
    return token;
  } catch (error) {
    throw new Error(`Failed to generate auth token: ${error.message}`);
  }
};

// Sequelize connection configuration
const sequelize = new Sequelize({
  dialect: "mysql",
  host: DB_HOST,
  database: DB_DATABASE,
  username: DB_USERNAME,
  port: parseInt(DB_PORT),
  dialectOptions: {
    connectTimeout: 5000,
    ssl: {
      rejectUnauthorized: false,
    },
    authPlugins: {
      mysql_clear_password: () => () => {
        return signer.getAuthToken();
      },
    },
  },
});

// Set authentication token before connecting
sequelize.beforeConnect(async (config) => {
  try {
    const authToken = await generateAuthToken();
    config.password = authToken;
  } catch (error) {
    console.error("Failed to generate auth token:", error.message);
    throw error;
  }
});

// Authenticate Sequelize connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = sequelize;
