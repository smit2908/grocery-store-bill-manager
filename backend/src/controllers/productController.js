const pool = require("../config/database");

// Get all active products
const getAllProducts = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                id,
                name,
                category,
                product_type,
                unit,
                price,
                is_active,
                created_at,
                updated_at
             FROM products
             WHERE is_active = TRUE
             ORDER BY name ASC`
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error("Error fetching products:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};


// Get single product
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                id,
                name,
                category,
                product_type,
                unit,
                price,
                is_active,
                created_at,
                updated_at
             FROM products
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error fetching product:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};


// Search products
const searchProducts = async (req, res) => {
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
                category,
                product_type,
                unit,
                price,
                is_active
             FROM products
             WHERE is_active = TRUE
             AND (
                 name ILIKE $1
                 OR category ILIKE $1
             )
             ORDER BY name ASC`,
            [searchTerm]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error("Error searching products:", error);

        res.status(500).json({
            success: false,
            message: "Failed to search products"
        });
    }
};


// Add new product
const createProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            product_type,
            unit,
            price
        } = req.body;

        // Basic validation
        if (
            !name ||
            !category ||
            !product_type ||
            !unit ||
            price === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "All required product fields must be provided"
            });
        }

        if (!["LOOSE", "PACKAGED"].includes(product_type)) {
            return res.status(400).json({
                success: false,
                message: "product_type must be LOOSE or PACKAGED"
            });
        }

        if (Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        const result = await pool.query(
            `INSERT INTO products
                (name, category, product_type, unit, price)
             VALUES
                ($1, $2, $3, $4, $5)
             RETURNING
                id,
                name,
                category,
                product_type,
                unit,
                price,
                is_active,
                created_at,
                updated_at`,
            [
                name.trim(),
                category.trim(),
                product_type,
                unit.trim(),
                Number(price)
            ]
        );

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating product:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create product"
        });
    }
};


// Update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            category,
            product_type,
            unit,
            price
        } = req.body;

        if (
            !name ||
            !category ||
            !product_type ||
            !unit ||
            price === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "All required product fields must be provided"
            });
        }

        if (!["LOOSE", "PACKAGED"].includes(product_type)) {
            return res.status(400).json({
                success: false,
                message: "product_type must be LOOSE or PACKAGED"
            });
        }

        if (Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        const result = await pool.query(
            `UPDATE products
             SET
                name = $1,
                category = $2,
                product_type = $3,
                unit = $4,
                price = $5,
                updated_at = NOW()
             WHERE id = $6
             RETURNING
                id,
                name,
                category,
                product_type,
                unit,
                price,
                is_active,
                created_at,
                updated_at`,
            [
                name.trim(),
                category.trim(),
                product_type,
                unit.trim(),
                Number(price),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating product:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update product"
        });
    }
};


// Deactivate product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE products
             SET
                is_active = FALSE,
                updated_at = NOW()
             WHERE id = $1
             RETURNING id, name, is_active`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deactivated successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error deactivating product:", error);

        res.status(500).json({
            success: false,
            message: "Failed to deactivate product"
        });
    }
};


module.exports = {
    getAllProducts,
    getProductById,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct
};