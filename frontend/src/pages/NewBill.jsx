import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  getCustomers,
  searchCustomers,
  createCustomer,
  getProducts,
  searchProducts,
  createBill,
} from "../api/api";

import Toast from "../components/Toast";

function NewBill() {
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    mobile: "",
    address: "",
    email: "",
    notes: "",
  });

  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [createdBill, setCreatedBill] = useState(null);

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  useEffect(() => {
    const customerId = searchParams.get("customer");

    if (!customerId) return;

    const loadCustomer = async () => {
      try {
        const data = await getCustomers();

        const customer = data.find(
          (item) => String(item.id) === String(customerId)
        );

        if (customer) {
          setSelectedCustomer(customer);
        }
      } catch (err) {
        setToast({
          message: err.message || "Failed to load customer.",
          type: "error",
        });
      }
    };

    loadCustomer();
  }, [searchParams]);


  useEffect(() => {
    let cancelled = false;

    const fetchCustomers = async () => {
      try {
        const data = customerSearch.trim()
          ? await searchCustomers(customerSearch)
          : await getCustomers();

        if (!cancelled) {
          setCustomers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setToast({
            message: err.message || "Failed to load customers.",
            type: "error",
          });
        }
      }
    };

    const timer = setTimeout(fetchCustomers, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [customerSearch]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const data = productSearch.trim()
          ? await searchProducts(productSearch)
          : await getProducts();

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

    const timer = setTimeout(fetchProducts, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [productSearch]);

  const addProduct = (product) => {
    setItems((previous) => {
      const existing = previous.find(
        (item) => item.product_id === product.id
      );

      if (existing) {
        return previous.map((item) =>
          item.product_id === product.id
            ? {
              ...item,
              quantity: item.quantity + 1,
            }
            : item
        );
      }

      return [
        ...previous,
        {
          product_id: product.id,
          name: product.name,
          unit: product.unit,
          price: Number(product.price),
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    // Keep the item in the table even when quantity is 0.
    // Empty input is temporarily treated as 0.
    const numericQuantity =
      quantity === "" ? 0 : Number(quantity);

    setItems((previous) =>
      previous.map((item) =>
        item.product_id === productId
          ? {
            ...item,
            quantity: numericQuantity,
          }
          : item
      )
    );
  };

  const removeItem = (productId) => {
    setItems((previous) =>
      previous.filter((item) => item.product_id !== productId)
    );
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCreateCustomer = async (e) => {
    e.preventDefault();

    if (!newCustomer.name.trim()) {
      setToast({
        message: "Customer name is required.",
        type: "warning",
      });
      return;
    }

    try {
      const customer = await createCustomer({
        name: newCustomer.name.trim(),
        mobile: newCustomer.mobile.trim(),
        address: newCustomer.address.trim(),
        email: newCustomer.email.trim(),
        notes: newCustomer.notes.trim(),
      });

      setSelectedCustomer(customer);
      setShowNewCustomer(false);

      setNewCustomer({
        name: "",
        mobile: "",
        address: "",
        email: "",
        notes: "",
      });

      setToast({
        message: "Customer created successfully.",
        type: "success",
      });
    } catch (err) {
      setToast({
        message: err.message || "Failed to create customer.",
        type: "error",
      });
    }
  };

  const handleCreateBill = async () => {
    if (!selectedCustomer) {
      setToast({
        message: "Please select a customer.",
        type: "warning",
      });
      return;
    }

    if (items.length === 0) {
      setToast({
        message: "Please add at least one product.",
        type: "warning",
      });
      return;
    }

    try {
      setCreating(true);

      const payload = {
        customer_id: selectedCustomer.id,

        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),

        payment_status: paymentStatus,
      };

      if (paymentStatus === "PAID") {
        payload.payment = {
          amount: total,
          method: paymentMethod,
        };
      }

      const bill = await createBill(payload);

      setCreatedBill(bill);
    } catch (err) {
      setToast({
        message: err.message || "Failed to create bill.",
        type: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  if (createdBill) {
    return (
      <div className="container rm-page">
        <div className="rm-card text-center py-5">
          <div className="mb-3">
            <i className="bi bi-check-circle-fill display-1 text-success"></i>
          </div>

          <h2>Bill Created Successfully</h2>

          <p className="text-muted">
            Your bill has been created successfully.
          </p>

          {createdBill.bill_number && (
            <p>
              Bill Number:{" "}
              <strong>{createdBill.bill_number}</strong>
            </p>
          )}

          <div className="d-flex justify-content-center gap-2 mt-4">
            <Link
              to="/bills"
              className="btn btn-rm-primary"
            >
              View Bill History
            </Link>

            <button
              type="button"
              className="btn btn-rm-outline"
              onClick={() => window.location.reload()}
            >
              Create Another Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container rm-page">
      <div className="rm-page-header">
        <div>
          <span className="rm-section-eyebrow">BILLING</span>
          <h1>New Bill</h1>
          <p>Create a new customer bill.</p>
        </div>
      </div>

      <div className="rm-stepper mb-4">
        <div className={`rm-step ${step >= 1 ? "active" : ""}`}>
          <span>1.</span>
          <label>Select Customer</label>
        </div>

        <div className={`rm-step ${step >= 2 ? "active" : ""}`}>
          <span>2.</span>
          <label>Add Products</label>
        </div>

        <div className={`rm-step ${step >= 3 ? "active" : ""}`}>
          <span>3.</span>
          <label>Review & Create</label>
        </div>
      </div>

      {step === 1 && (
        <div className="rm-card">
          <h4 className="mb-3">Select Customer</h4>

          {selectedCustomer ? (
            <div className="rm-selected-card">
              <div>
                <strong>{selectedCustomer.name}</strong>

                <div className="text-muted">
                  {selectedCustomer.mobile || "No mobile number"}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-rm-outline"
                onClick={() => setSelectedCustomer(null)}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="rm-search-box mb-3">
                <i className="bi bi-search"></i>

                <input
                  type="text"
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={(e) =>
                    setCustomerSearch(e.target.value)
                  }
                />
              </div>

              <div className="list-group mb-3">
                {customers.map((customer) => (
                  <button
                    type="button"
                    key={customer.id}
                    className="list-group-item list-group-item-action"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <strong>{customer.name}</strong>

                    <small className="d-block text-muted">
                      {customer.mobile || "No mobile number"}
                    </small>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-rm-outline"
                onClick={() => setShowNewCustomer(true)}
              >
                <i className="bi bi-person-plus me-2"></i>
                New Customer
              </button>
            </>
          )}

          <div className="text-end mt-4">
            <button
              type="button"
              className="btn btn-rm-primary"
              disabled={!selectedCustomer}
              onClick={() => setStep(2)}
            >
              Next
              <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rm-card">
          <h4 className="mb-3">Add Products</h4>

          <div className="rm-search-box mb-3">
            <i className="bi bi-search"></i>

            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-muted">Loading products...</p>
          ) : (
            <div className="row g-3 mb-4">
              {products.map((product) => (
                <div
                  className="col-md-6 col-lg-4"
                  key={product.id}
                >
                  <div className="rm-product-select-card">
                    <div>
                      <strong>{product.name}</strong>

                      <div className="text-muted small">
                        {product.unit || "-"} · ₹
                        {Number(product.price || 0).toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-rm-primary"
                      onClick={() => addProduct(product)}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <>
              <h5 className="mb-3">Bill Items</h5>

              <div className="table-responsive">
                <table className="table rm-table align-middle">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th style={{ width: "150px" }}>Quantity</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr key={item.product_id}>
                        <td>
                          <strong>{item.name}</strong>
                        </td>

                        <td>
                          ₹{item.price.toFixed(2)}
                        </td>

                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.product_id,
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          ₹
                          {(
                            item.price * item.quantity
                          ).toFixed(2)}
                        </td>

                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              removeItem(item.product_id)
                            }
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-end">
                <h4>
                  Total: ₹{total.toFixed(2)}
                </h4>
              </div>
            </>
          )}

          <div className="d-flex justify-content-between mt-4">
            <button
              type="button"
              className="btn btn-rm-outline"
              onClick={() => setStep(1)}
            >
              Back
            </button>

            {/* <button
              type="button"
              className="btn btn-rm-primary"
              disabled={items.length === 0}
              onClick={() => setStep(3)}
            >
              Review
              <i className="bi bi-arrow-right ms-2"></i>
            </button> */}
            <button
              type="button"
              className="btn btn-rm-primary"
              disabled={items.length === 0}
              onClick={() => {
                const validItems = items.filter(
                  (item) => Number(item.quantity) > 0
                );

                if (validItems.length === 0) {
                  setToast({
                    message:
                      "Please enter a quantity greater than 0 for at least one product.",
                    type: "warning",
                  });
                  return;
                }

                setItems(validItems);
                setStep(3);
              }}
            >
              Review
              <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rm-card">
          <h4 className="mb-4">Review & Create Bill</h4>

          <div className="row g-4">
            <div className="col-lg-6">
              <div className="rm-summary-card">
                <h5>Customer</h5>

                <strong>
                  {selectedCustomer?.name}
                </strong>

                <p className="text-muted mb-0">
                  {selectedCustomer?.mobile || ""}
                </p>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="rm-summary-card">
                <h5>Bill Total</h5>

                <h3>
                  ₹{total.toFixed(2)}
                </h3>
              </div>
            </div>
          </div>

          <hr />

          <h5>Payment</h5>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">
                Payment Status
              </label>

              <select
                className="form-select"
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value)
                }
              >
                <option value="UNPAID">UNPAID</option>
                <option value="PAID">PAID</option>
              </select>
            </div>

            {paymentStatus === "PAID" && (
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Payment Method
                </label>

                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value)
                  }
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-between mt-4">
            <button
              type="button"
              className="btn btn-rm-outline"
              onClick={() => setStep(2)}
            >
              Back
            </button>

            <button
              type="button"
              className="btn btn-rm-primary"
              disabled={creating}
              onClick={handleCreateBill}
            >
              {creating ? "Creating..." : "Create Bill"}
            </button>
          </div>
        </div>
      )}

      {showNewCustomer && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleCreateCustomer}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    New Customer
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() =>
                      setShowNewCustomer(false)
                    }
                  ></button>
                </div>

                <div className="modal-body">
                  <input
                    className="form-control mb-3"
                    placeholder="Name"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        name: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    className="form-control mb-3"
                    placeholder="Mobile"
                    value={newCustomer.mobile}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        mobile: e.target.value,
                      })
                    }
                  />

                  <input
                    className="form-control mb-3"
                    placeholder="Email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        email: e.target.value,
                      })
                    }
                  />

                  <textarea
                    className="form-control mb-3"
                    placeholder="Address"
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        address: e.target.value,
                      })
                    }
                  />

                  <textarea
                    className="form-control"
                    placeholder="Notes"
                    value={newCustomer.notes}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setShowNewCustomer(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-rm-primary"
                  >
                    Create Customer
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

export default NewBill;