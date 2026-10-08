const express = require("express");

const router = express.Router();

const {
    getAllProducts,
    getProductById,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");


// GET /api/products
router.get("/", getAllProducts);

// GET /api/products/search?q=rice
router.get("/search", searchProducts);

// GET /api/products/:id
router.get("/:id", getProductById);

// POST /api/products
router.post("/", createProduct);

// PUT /api/products/:id
router.put("/:id", updateProduct);

// DELETE /api/products/:id
router.delete("/:id", deleteProduct);


module.exports = router;