import { Link } from "react-router-dom";

function ProductCard({ product }) {
  const price = Number(product.price || 0);

  return (
    <div className="product-card">
      <div className="product-card-icon">
        <i className="bi bi-box-seam"></i>
      </div>

      <div className="product-card-body">
        <div className="product-card-category">
          {product.category || "Other"}
        </div>

        <h4 className="product-card-title">
          {product.name}
        </h4>

        <p className="product-card-meta">
          {product.product_type || "Grocery"} ·{" "}
          {product.unit || "-"}
        </p>

        <div className="product-card-bottom">
          <strong className="product-card-price">
            ₹{price.toFixed(2)}
          </strong>

          <Link
            to="/bills/new"
            className="btn btn-rm-primary btn-rm-sm"
          >
            <i className="bi bi-plus-lg me-1"></i>
            Add to Bill
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;