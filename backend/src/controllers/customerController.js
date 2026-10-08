const pool = require("../config/database");

// =====================================================
// GET ALL CUSTOMERS
// =====================================================

const getAllCustomers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                name,
                mobile,
                address,
                email,
                notes,
                created_at,
                updated_at
             FROM customers
             ORDER BY name ASC`
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching customers:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customers"
        });
    }
};


// =====================================================
// SEARCH CUSTOMERS
// =====================================================

const searchCustomers = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const searchTerm = `%${q.trim()}%`;

        const result = await pool.query(
            `SELECT
                id,
                name,
                mobile,
                address,
                email,
                notes,
                created_at,
                updated_at
             FROM customers
             WHERE
                name ILIKE $1
                OR mobile ILIKE $1
             ORDER BY name ASC`,
            [searchTerm]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error searching customers:", error);

        res.status(500).json({
            success: false,
            message: "Failed to search customers"
        });
    }
};


// =====================================================
// GET CUSTOMER BY ID
// =====================================================

const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                id,
                name,
                mobile,
                address,
                email,
                notes,
                created_at,
                updated_at
             FROM customers
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching customer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer"
        });
    }
};


// =====================================================
// CREATE CUSTOMER
// =====================================================

const createCustomer = async (req, res) => {
    try {
        const {
            name,
            mobile,
            address,
            email,
            notes
        } = req.body;

        if (!name || !mobile) {
            return res.status(400).json({
                success: false,
                message: "Customer name and mobile number are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO customers
                (name, mobile, address, email, notes)
             VALUES
                ($1, $2, $3, $4, $5)
             RETURNING
                id,
                name,
                mobile,
                address,
                email,
                notes,
                created_at,
                updated_at`,
            [
                name.trim(),
                mobile.trim(),
                address?.trim() || null,
                email?.trim() || null,
                notes?.trim() || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating customer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create customer"
        });
    }
};


// =====================================================
// UPDATE CUSTOMER
// =====================================================

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            mobile,
            address,
            email,
            notes
        } = req.body;

        if (!name || !mobile) {
            return res.status(400).json({
                success: false,
                message: "Customer name and mobile number are required"
            });
        }

        const result = await pool.query(
            `UPDATE customers
             SET
                name = $1,
                mobile = $2,
                address = $3,
                email = $4,
                notes = $5,
                updated_at = NOW()
             WHERE id = $6
             RETURNING
                id,
                name,
                mobile,
                address,
                email,
                notes,
                created_at,
                updated_at`,
            [
                name.trim(),
                mobile.trim(),
                address?.trim() || null,
                email?.trim() || null,
                notes?.trim() || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating customer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update customer"
        });
    }
};


// =====================================================
// GET CUSTOMER'S BILLS
// =====================================================

const getCustomerBills = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        // Check whether customer exists
        const customerResult = await pool.query(
            `SELECT id, name, mobile
             FROM customers
             WHERE id = $1`,
            [id]
        );

        if (customerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        let query = `
            SELECT
                b.id,
                b.bill_number,
                b.customer_id,
                b.total_amount,
                b.payment_status,
                b.created_at,
                b.updated_at
            FROM bills b
            WHERE b.customer_id = $1
        `;

        const values = [id];

        if (status) {

            const normalizedStatus = status.toUpperCase();

            if (!["PAID", "UNPAID"].includes(normalizedStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be PAID or UNPAID"
                });
            }

            query += ` AND b.payment_status = $2`;
            values.push(normalizedStatus);
        }

        query += ` ORDER BY b.created_at DESC`;

        const billsResult = await pool.query(query, values);

        res.status(200).json({
            success: true,
            customer: customerResult.rows[0],
            count: billsResult.rows.length,
            data: billsResult.rows
        });

    } catch (error) {
        console.error("Error fetching customer bills:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer bills"
        });
    }
};


module.exports = {
    getAllCustomers,
    searchCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    getCustomerBills
};