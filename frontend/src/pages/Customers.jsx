import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
} from "../api/api";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";

const emptyForm = {
  name: "",
  mobile: "",
  address: "",
  email: "",
  notes: "",
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const data = await getCustomers();

      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setToast({
        message: err.message || "Failed to load customers.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchCustomers = async () => {
      try {
        setLoading(true);

        const data = await getCustomers();

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
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCustomers();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const value = search.toLowerCase();

    return (
      String(customer.name || "").toLowerCase().includes(value) ||
      String(customer.mobile || "").toLowerCase().includes(value) ||
      String(customer.email || "").toLowerCase().includes(value)
    );
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      mobile: customer.mobile || "",
      address: customer.address || "",
      email: customer.email || "",
      notes: customer.notes || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCustomer(null);
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
        message: "Customer name is required.",
        type: "warning",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        notes: form.notes.trim(),
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);

        setToast({
          message: "Customer updated successfully.",
          type: "success",
        });
      } else {
        await createCustomer(payload);

        setToast({
          message: "Customer added successfully.",
          type: "success",
        });
      }

      closeModal();
      await loadCustomers();
    } catch (err) {
      setToast({
        message: err.message || "Failed to save customer.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container rm-page">
      <div className="rm-page-header">
        <div>
          <span className="rm-section-eyebrow">CUSTOMER MANAGEMENT</span>
          <h1>Customers</h1>
          <p>Manage your store customers.</p>
        </div>

        <button
          type="button"
          className="btn btn-rm-primary"
          onClick={openAddModal}
        >
          <i className="bi bi-person-plus me-2"></i>
          Add Customer
        </button>
      </div>

      <div className="rm-card mb-4">
        <div className="rm-search-box">
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loading message="Loading customers..." />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon="bi-people"
          title="No customers found"
          message="Add a customer to get started."
        />
      ) : (
        <div className="rm-card">
          <div className="table-responsive">
            <table className="table rm-table align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>{customer.name}</strong>
                    </td>

                    <td>{customer.mobile || "-"}</td>

                    <td>{customer.email || "-"}</td>

                    <td>{customer.address || "-"}</td>

                    <td className="text-end">
                      <Link
                        to={`/bills/new?customer=${customer.id}`}
                        className="btn btn-sm btn-rm-primary me-2"
                      >
                        <i className="bi bi-receipt"></i>
                      </Link>

                      <button
                        type="button"
                        className="btn btn-sm btn-rm-outline"
                        onClick={() => openEditModal(customer)}
                      >
                        <i className="bi bi-pencil"></i>
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
                    {editingCustomer
                      ? "Edit Customer"
                      : "Add Customer"}
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
                      Customer Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={form.name}
                      pattern="[A-Za-z ]{2,50}"
                      minLength={2}
                      maxLength={50}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Mobile
                      </label>

                      <input
                        type="text"
                        name="mobile"
                        className="form-control"
                        pattern="[6-9][0-9]{9}"
                        maxLength={10}
                        inputMode="numeric"
                        value={form.mobile}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"                        
                        maxLength={100}
                        className="form-control"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Address
                    </label>

                    <textarea
                      name="address"
                      className="form-control"
                      rows="2"
                      value={form.address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      className="form-control"
                      rows="2"
                      value={form.notes}
                      onChange={handleChange}
                    />
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
                    {saving ? "Saving..." : "Save Customer"}
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

export default Customers;