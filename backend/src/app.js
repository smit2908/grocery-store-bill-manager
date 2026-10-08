// const express = require("express");

// const app = express();

// app.use(express.json());

// app.get("/", (req, res) => {
//     res.json({
//         message: "Ration Store Bill Manager API is running"
//     });
// });

// module.exports = app;

const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const billRoutes = require("./routes/billRoutes");

const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Root route
app.get("/", (req, res) => {
    res.json({
        message: "Ration Store Bill Manager API is running"
    });
});


// Product routes
app.use("/api/products", productRoutes);

// Customer API
app.use("/api/customers", customerRoutes);

// Bill API
app.use("/api/bills", billRoutes);

module.exports = app;