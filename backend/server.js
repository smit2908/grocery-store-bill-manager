require("dotenv").config();

const app = require("./src/app");
const pool = require("./src/config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await pool.query("SELECT NOW()");

        console.log("Database connection verified");

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Unable to connect to database:", error.message);
        process.exit(1);
    }
};

startServer();