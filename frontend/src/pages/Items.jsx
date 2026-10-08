import { useEffect, useState } from "react";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/api";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";

const emptyForm = {
  name: "",
  category: "Other",
  product_type: "PACKAGED",
  unit: "",
  price: "",
};

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

function Items() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  const loadProducts = async () => {
    try {
      const data = await getProducts();

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setToast({
        message: err.message || "Failed to load products.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const data = await getProducts();

        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setToast({
            message: err.message || "Failed to load products.",
            type: "error",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !search ||
      String(product.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" ||
      String(product.category || "").toLowerCase() ===
      category.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      category: product.category || "Other",
      product_type: product.product_type || "PACKAGED",
      unit: product.unit || "",
      price: product.price || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setToast({
        message: "Product name is required.",
        type: "warning",
      });
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      setToast({
        message: "Enter a valid price.",
        type: "warning",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        category: form.category,
        product_type: form.product_type,
        unit: form.unit.trim(),
        price: Number(form.price),
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);

        setToast({
          message: "Product updated successfully.",
          type: "success",
        });
      } else {
        await createProduct(payload);

        setToast({
          message: "Product added successfully.",
          type: "success",
        });
      }

      closeModal();
      await loadProducts();
    } catch (err) {
      setToast({
        message: err.message || "Failed to save product.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Deactivate "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteProduct(product.id);

      setToast({
        message: "Product deactivated successfully.",
        type: "success",
      });

      await loadProducts();
    } catch (err) {
      setToast({
        message: err.message || "Failed to deactivate product.",
        type: "error",
      });
    }
  };

  return (
    <div className="container rm-page">
      <div className="rm-page-header">
        <div>
          <span className="rm-section-eyebrow">MASTER DATA</span>
          <h1>Items</h1>
          <p>Manage products available in your store.</p>
        </div>

        <button
          type="button"
          className="btn btn-rm-primary"
          onClick={openAddModal}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Item
        </button>
      </div>

      <div className="rm-card mb-4">
        <div className="rm-search-box">
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rm-category-pills mt-3">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={`rm-category-pill ${category === item ? "active" : ""
                }`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading message="Loading items..." />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="bi-box-seam"
          title="No items found"
          message="Add an item or change your search."
        />
      ) : (
        <div className="rm-card">
          <div className="table-responsive">
            <table className="table rm-table align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Product Type</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>{product.name}</strong>
                    </td>

                    <td>{product.category || "-"}</td>

                    <td>{product.product_type || "-"}</td>

                    <td>{product.unit || "-"}</td>

                    <td>
                      ₹{Number(product.price || 0).toFixed(2)}
                    </td>

                    <td>
                      <span className="badge-rm badge-rm-paid">
                        ACTIVE
                      </span>
                    </td>

                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-rm-outline me-2"
                        onClick={() => openEditModal(product)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(product)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingProduct ? "Edit Item" : "Add Item"}
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Item Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Category
                      </label>

                      <select
                        name="category"
                        className="form-select"
                        value={form.category}
                        onChange={handleChange}
                      >
                        {categories
                          .filter((item) => item !== "All")
                          .map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Product Type
                      </label>

                      <select
                        name="product_type"
                        className="form-select"
                        value={form.product_type}
                        onChange={handleChange}
                        required
                      >
                        <option value="PACKAGED">PACKAGED</option>
                        <option value="LOOSE">LOOSE</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Unit
                      </label>

                      <select
                        name="unit"
                        className="form-select"
                        value={form.unit}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Unit</option>
                        <option value="piece">Piece</option>
                        <option value="packet">Packet</option>
                        <option value="litre">Litre</option>
                        <option value="kg">Kg</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Price
                      </label>

                      <input
                        type="number"
                        name="price"
                        className="form-control"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-rm-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() =>
          setToast({
            message: "",
            type: "success",
          })
        }
      />
    </div>
  );
}

export default Items;