const pool = require("../config/database");

// GET /api/bills
// Bill History: search by bill number/customer name and sort
const getAllBills = async (req, res) => {
    try {
        const { search, status, sort = "newest" } = req.query;

        const values = [];
        const conditions = [];

        if (search) {
            values.push(`%${search}%`);
            conditions.push(`
                (
                    b.bill_number ILIKE $${values.length}
                    OR c.name ILIKE $${values.length}
                    OR c.mobile ILIKE $${values.length}
                )
            `);
        }

        if (status) {
            const normalizedStatus = status.toUpperCase();

            if (!["PAID", "UNPAID"].includes(normalizedStatus)) {
                return res.status(400).json({
                    message: "Status must be PAID or UNPAID"
                });
            }

            values.push(normalizedStatus);
            conditions.push(`b.payment_status = $${values.length}`);
        }

        let orderBy = "b.created_at DESC";

        if (sort === "oldest") {
            orderBy = "b.created_at ASC";
        } else if (sort === "amount_high") {
            orderBy = "b.total_amount DESC";
        } else if (sort === "amount_low") {
            orderBy = "b.total_amount ASC";
        }

        let query = `
            SELECT
                b.id,
                b.bill_number,
                b.customer_id,
                c.name AS customer_name,
                c.mobile AS customer_mobile,
                b.total_amount,
                b.payment_status,
                b.created_at,
                b.updated_at
            FROM bills b
            LEFT JOIN customers c ON b.customer_id = c.id
        `;

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }

        query += ` ORDER BY ${orderBy}`;

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("Get bills error:", error);

        res.status(500).json({
            message: "Failed to fetch bills"
        });
    }
};


// GET /api/bills/:id
const getBillById = async (req, res) => {
    try {
        const { id } = req.params;

        const billResult = await pool.query(
            `
            SELECT
                b.id,
                b.bill_number,
                b.customer_id,
                c.name AS customer_name,
                c.mobile AS customer_mobile,
                c.address,
                c.email,
                c.notes,
                b.total_amount,
                b.payment_status,
                b.created_at,
                b.updated_at
            FROM bills b
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE b.id = $1
            `,
            [id]
        );

        if (billResult.rows.length === 0) {
            return res.status(404).json({
                message: "Bill not found"
            });
        }

        const itemsResult = await pool.query(
            `
            SELECT
                bi.id,
                bi.product_id,
                p.name AS product_name,
                p.category,
                p.unit,
                bi.quantity,
                bi.unit_price,
                bi.total_price
            FROM bill_items bi
            JOIN products p ON bi.product_id = p.id
            WHERE bi.bill_id = $1
            ORDER BY bi.id
            `,
            [id]
        );

        const paymentsResult = await pool.query(
            `
            SELECT
                id,
                amount,
                payment_method,
                payment_date,
                notes
            FROM payments
            WHERE bill_id = $1
            ORDER BY payment_date DESC
            `,
            [id]
        );

        res.json({
            bill: billResult.rows[0],
            items: itemsResult.rows,
            payments: paymentsResult.rows
        });

    } catch (error) {
        console.error("Get bill error:", error);

        res.status(500).json({
            message: "Failed to fetch bill"
        });
    }
};


// POST /api/bills
const createBill = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            customer_id,
            customer,
            items,
            payment_status = "UNPAID",
            payment
        } = req.body;

        // Basic validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "At least one product is required"
            });
        }

        const normalizedStatus = payment_status.toUpperCase();

        if (!["PAID", "UNPAID"].includes(normalizedStatus)) {
            return res.status(400).json({
                message: "Payment status must be PAID or UNPAID"
            });
        }

        await client.query("BEGIN");

        // ----------------------------------------------------
        // 1. Find or create customer
        // ----------------------------------------------------

        let finalCustomerId = customer_id || null;

        if (finalCustomerId) {
            const customerResult = await client.query(
                `SELECT id FROM customers WHERE id = $1`,
                [finalCustomerId]
            );

            if (customerResult.rows.length === 0) {
                throw new Error("Customer not found");
            }

        } else {

            if (!customer || !customer.name || !customer.mobile) {
                throw new Error(
                    "Customer name and mobile are required"
                );
            }

            // Search existing customer by mobile
            const existingCustomer = await client.query(
                `
                SELECT id
                FROM customers
                WHERE mobile = $1
                LIMIT 1
                `,
                [customer.mobile]
            );

            if (existingCustomer.rows.length > 0) {

                finalCustomerId = existingCustomer.rows[0].id;

            } else {

                const newCustomer = await client.query(
                    `
                    INSERT INTO customers
                    (
                        name,
                        mobile,
                        address,
                        email,
                        notes
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                    `,
                    [
                        customer.name,
                        customer.mobile,
                        customer.address || null,
                        customer.email || null,
                        customer.notes || null
                    ]
                );

                finalCustomerId = newCustomer.rows[0].id;
            }
        }

        // ----------------------------------------------------
        // 2. Get product prices from database
        // ----------------------------------------------------

        const preparedItems = [];
        let billTotal = 0;

        for (const item of items) {

            if (!item.product_id || !item.quantity) {
                throw new Error(
                    "Each item requires product_id and quantity"
                );
            }

            const quantity = Number(item.quantity);

            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new Error(
                    "Product quantity must be greater than zero"
                );
            }

            const productResult = await client.query(
                `
                SELECT
                    id,
                    name,
                    price,
                    is_active
                FROM products
                WHERE id = $1
                `,
                [item.product_id]
            );

            if (productResult.rows.length === 0) {
                throw new Error(
                    `Product ${item.product_id} not found`
                );
            }

            const product = productResult.rows[0];

            if (!product.is_active) {
                throw new Error(
                    `Product "${product.name}" is inactive`
                );
            }

            const unitPrice = Number(product.price);

            const totalPrice = Number(
                (quantity * unitPrice).toFixed(2)
            );

            billTotal += totalPrice;

            preparedItems.push({
                productId: product.id,
                quantity,
                unitPrice,
                totalPrice
            });
        }

        billTotal = Number(billTotal.toFixed(2));

        // ----------------------------------------------------
        // 3. Generate bill number
        // ----------------------------------------------------

        const datePart = new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");

        const uniquePart = Date.now().toString().slice(-6);

        const billNumber = `B-${datePart}-${uniquePart}`;

        // ----------------------------------------------------
        // 4. Create bill
        // ----------------------------------------------------

        const billResult = await client.query(
            `
            INSERT INTO bills
            (
                bill_number,
                customer_id,
                total_amount,
                payment_status
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                bill_number,
                customer_id,
                total_amount,
                payment_status,
                created_at
            `,
            [
                billNumber,
                finalCustomerId,
                billTotal,
                normalizedStatus
            ]
        );

        const bill = billResult.rows[0];

        // ----------------------------------------------------
        // 5. Insert bill items
        // ----------------------------------------------------

        for (const item of preparedItems) {

            await client.query(
                `
                INSERT INTO bill_items
                (
                    bill_id,
                    product_id,
                    quantity,
                    unit_price,
                    total_price
                )
                VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    bill.id,
                    item.productId,
                    item.quantity,
                    item.unitPrice,
                    item.totalPrice
                ]
            );
        }

        // ----------------------------------------------------
        // 6. Create payment record if PAID
        // ----------------------------------------------------

        if (normalizedStatus === "PAID") {

            const paymentMethod =
                payment?.payment_method || "CASH";

            const allowedMethods = [
                "CASH",
                "UPI",
                "CARD",
                "OTHER"
            ];

            if (!allowedMethods.includes(paymentMethod)) {
                throw new Error(
                    "Invalid payment method"
                );
            }

            await client.query(
                `
                INSERT INTO payments
                (
                    bill_id,
                    amount,
                    payment_method,
                    notes
                )
                VALUES ($1, $2, $3, $4)
                `,
                [
                    bill.id,
                    billTotal,
                    paymentMethod,
                    payment?.notes || null
                ]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({
            message: "Bill created successfully",
            bill: {
                id: bill.id,
                bill_number: bill.bill_number,
                customer_id: bill.customer_id,
                total_amount: bill.total_amount,
                payment_status: bill.payment_status,
                created_at: bill.created_at
            },
            items: preparedItems
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Create bill error:", error);

        res.status(400).json({
            message: error.message || "Failed to create bill"
        });

    } finally {
        client.release();
    }
};


// PUT /api/bills/:id/payment
const updateBillPayment = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const {
            payment_method = "CASH",
            notes
        } = req.body;

        await client.query("BEGIN");

        const billResult = await client.query(
            `
            SELECT
                id,
                total_amount,
                payment_status
            FROM bills
            WHERE id = $1
            FOR UPDATE
            `,
            [id]
        );

        if (billResult.rows.length === 0) {
            throw new Error("Bill not found");
        }

        const bill = billResult.rows[0];

        if (bill.payment_status === "PAID") {
            throw new Error("Bill is already paid");
        }

        const allowedMethods = [
            "CASH",
            "UPI",
            "CARD",
            "OTHER"
        ];

        if (!allowedMethods.includes(payment_method)) {
            throw new Error("Invalid payment method");
        }

        await client.query(
            `
            INSERT INTO payments
            (
                bill_id,
                amount,
                payment_method,
                notes
            )
            VALUES ($1, $2, $3, $4)
            `,
            [
                id,
                bill.total_amount,
                payment_method,
                notes || null
            ]
        );

        const updatedBill = await client.query(
            `
            UPDATE bills
            SET
                payment_status = 'PAID',
                updated_at = NOW()
            WHERE id = $1
            RETURNING
                id,
                bill_number,
                total_amount,
                payment_status,
                updated_at
            `,
            [id]
        );

        await client.query("COMMIT");

        res.json({
            message: "Bill payment updated successfully",
            bill: updatedBill.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Update payment error:", error);

        res.status(400).json({
            message: error.message || "Failed to update payment"
        });

    } finally {
        client.release();
    }
};


module.exports = {
    getAllBills,
    getBillById,
    createBill,
    updateBillPayment
};