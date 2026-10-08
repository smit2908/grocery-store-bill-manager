import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, searchProducts } from "../api/api";
import ProductCard from "../components/ProductCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

const categories = [
  "All",
  "Grains & Flours",
  "Pulses & Legumes",
  "Oils & Ghee",
  "Spices & Condiments",
  "Dairy & Produce",
  "Household & Personal Care",
  "Other",
];


function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = search.trim()
          ? await searchProducts(search.trim())
          : await getProducts();

        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : data?.products || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load products.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(loadProducts, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const filteredProducts = useMemo(() => {
    if (category === "All") {
      return products;
    }

    return products.filter(
      (product) =>
        String(product.category || "").toLowerCase() ===
        category.toLowerCase()
    );
  }, [products, category]);

  

       return (
    <>
      <section className="rm-hero">
        <div className="container">
          <div className="rm-hero-content">
            <span className="rm-eyebrow">GENERAL STORE MANAGEMENT</span>

            <h1>Simple billing for your everyday store.</h1>

            <p>
              Manage products, customers and bills from one simple system.
            </p>

            <div className="rm-hero-actions">
              <Link to="/bills/new" className="btn btn-rm-primary">
                <i className="bi bi-plus-circle me-2"></i>
                Create New Bill
              </Link>

              <Link to="/items" className="btn btn-rm-outline">
                <i className="bi bi-box-seam me-2"></i>
                Manage Items
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container rm-section">
        <div className="rm-section-header">
          <div>
            <span className="rm-section-eyebrow">       </span>
            <h2>Browse Items</h2>
          </div>
{/* 
          <Link to="/items" className="btn btn-rm-outline btn-rm-sm">
            View All Items
          </Link> */}
        </div>

        <div className="rm-search-box mb-4">
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rm-category-pills mb-4">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={`rm-category-pill ${
                category === item ? "active" : ""
              }`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <Loading message="Loading products..." />
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon="bi-box-seam"
            title="No products found"
            message="Try another search or category."
          />
        ) : (
          <div className="row g-4">
            {filteredProducts.map((product) => (
              <div className="col-md-6 col-lg-4" key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default Home;