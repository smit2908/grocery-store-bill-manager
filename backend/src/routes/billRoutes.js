const express = require("express");

const router = express.Router();

const {
    getAllBills,
    getBillById,
    createBill,
    updateBillPayment
} = require("../controllers/billController");

router.get("/", getAllBills);

router.get("/:id", getBillById);

router.post("/", createBill);

router.put("/:id/payment", updateBillPayment);

module.exports = router;