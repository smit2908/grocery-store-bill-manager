const express = require("express");

const router = express.Router();

const {
    getAllCustomers,
    searchCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    getCustomerBills
} = require("../controllers/customerController");


// GET /api/customers
router.get("/", getAllCustomers);

// GET /api/customers/search?q=rahul
router.get("/search", searchCustomers);

// GET /api/customers/:id
router.get("/:id", getCustomerById);

// GET /api/customers/:id/bills
router.get("/:id/bills", getCustomerBills);

// POST /api/customers
router.post("/", createCustomer);

// PUT /api/customers/:id
router.put("/:id", updateCustomer);


module.exports = router;