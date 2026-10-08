import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getBill,
  markBillAsPaid,
} from "../api/api";

import Loading from "../components/Loading";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

function BillDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState("CASH");

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  const loadBill = async () => {
    try {
      setLoading(true);

      const data = await getBill(id);

      console.log("BILL DETAILS API RESPONSE:", data);

      setBill({
        ...data.bill,
        items: data.items || [],
        payments: data.payments || [],
      });
    } catch (err) {
      console.error(err);

      setToast({
        message: err.message || "Failed to load bill.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchBill = async () => {
      try {
        setLoading(true);

        const data = await getBill(id);

        console.log("BILL DETAILS API RESPONSE:", data);

        if (!cancelled) {
          setBill({
            ...data.bill,
            items: data.items || [],
            payments: data.payments || [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);

          setToast({
            message:
              err.message || "Failed to load bill.",
            type: "error",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBill();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleMarkAsPaid = async () => {
    try {
      setSaving(true);

      await markBillAsPaid(id, paymentMethod);

      setToast({
        message: "Bill marked as paid.",
        type: "success",
      });

      setShowPaymentModal(false);

      await loadBill();
    } catch (err) {
      setToast({
        message:
          err.message || "Failed to update payment.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container rm-page">
        <Loading message="Loading bill details..." />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="container rm-page">
        <div className="alert alert-danger">
          Bill not found.
        </div>

        <button
          type="button"
          className="btn btn-rm-outline"
          onClick={() => navigate("/bills")}
        >
          Back to Bill History
        </button>
      </div>
    );
  }

  /*
   * ==============================
   * NORMALIZE BILL DATA
   * ==============================
   */

  const customer = {
    name: bill.customer_name || "Walk-in Customer",
    mobile: bill.customer_mobile || "",
    // address: bill.address || "",
  };

  const items = bill.items || [];

  const billNumber =
    bill.bill_number || `#${bill.id}`;

  const createdDate = bill.created_at;

  const paymentStatus =
    bill.payment_status || "UNPAID";

  const calculatedTotal = items.reduce(
    (sum, item) => {
      return sum + Number(item.total_price || 0);
    },
    0
  );

  const total = Number(
    bill.total_amount || calculatedTotal
  );

  const payment = bill.payments?.[0];

  const paymentMethodValue =
    payment?.payment_method || "-";

  const paymentAmount = Number(
    payment?.amount || 0
  );

  const isPaid =
    String(paymentStatus).toUpperCase() === "PAID";

  return (
    <>
      <div className="container rm-page">

        {/* =========================
            HEADER
        ========================== */}

        <div className="rm-page-header">
          <div>
            <Link
              to="/bills"
              className="text-decoration-none"
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Bill History
            </Link>

            <h1 className="mt-2">
              Bill Details
            </h1>
          </div>

          <div className="d-flex gap-2">
            {!isPaid && (
              <button
                type="button"
                className="btn btn-rm-primary"
                onClick={() =>
                  setShowPaymentModal(true)
                }
              >
                <i className="bi bi-cash-coin me-2"></i>
                Mark as Paid
              </button>
            )}

            <button
              type="button"
              className="btn btn-rm-outline"
              onClick={handlePrint}
            >
              <i className="bi bi-printer me-2"></i>
              Print
            </button>
          </div>
        </div>

        <div className="row g-4">

          {/* =========================
              MAIN BILL
          ========================== */}

          <div className="col-lg-8">
            <div className="rm-card">

              {/* Bill Number + Status */}

              <div className="d-flex justify-content-between align-items-start mb-4">

                <div>
                  <span className="text-muted">
                    Bill Number
                  </span>

                  <h3 className="mb-0">
                    {billNumber}
                  </h3>
                </div>

                <StatusBadge
                  status={paymentStatus}
                />
              </div>

              {/* Customer + Date */}

              <div className="row mb-4">

                <div className="col-md-6">

                  <span className="text-muted">
                    Customer
                  </span>

                  <h5 className="mt-1 mb-1">
                    {customer.name ||
                      "Walk-in Customer"}
                  </h5>

                  {customer.mobile && (
                    <p className="mb-0">
                      {customer.mobile}
                    </p>
                  )}

                  {customer.address && (
                    <p className="text-muted mb-0">
                      {customer.address}
                    </p>
                  )}

                </div>

                <div className="col-md-6">

                  <span className="text-muted">
                    Bill Created Date
                  </span>

                  <h5 className="mt-1">
                    {createdDate
                      ? new Date(
                        createdDate
                      ).toLocaleString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                      : "-"}
                  </h5>

                </div>

              </div>

              {/* =========================
                  ITEMS TABLE
              ========================== */}

              <div className="table-responsive">

                <table className="table rm-table align-middle">

                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th className="text-end">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {items.length > 0 ? (
                      items.map((item, index) => {

                        const price = Number(
                          item.price ??
                          item.unit_price ??
                          item.unitPrice ??
                          item.product_price ??
                          0
                        );

                        const quantity = Number(
                          item.quantity ?? 0
                        );

                        const itemTotal = Number(
                          item.total ??
                          item.item_total ??
                          item.amount ??
                          item.subtotal ??
                          price * quantity
                        );

                        const productName =
                          item.product_name ||
                          item.productName ||
                          item.name ||
                          item.product?.name ||
                          "-";

                        return (
                          <tr
                            key={
                              item.id ||
                              item.product_id ||
                              index
                            }
                          >

                            <td>
                              {index + 1}
                            </td>

                            <td>
                              <strong>
                                {productName}
                              </strong>
                            </td>

                            <td>
                              ₹{price.toFixed(2)}
                            </td>

                            <td>
                              {quantity}
                            </td>

                            <td className="text-end">
                              ₹
                              {itemTotal.toFixed(
                                2
                              )}
                            </td>

                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center text-muted"
                        >
                          No bill items found.
                        </td>
                      </tr>
                    )}

                  </tbody>

                  <tfoot>

                    <tr>
                      <th
                        colSpan="4"
                        className="text-end"
                      >
                        Grand Total
                      </th>

                      <th className="text-end">
                        ₹{total.toFixed(2)}
                      </th>
                    </tr>

                  </tfoot>

                </table>

              </div>

            </div>
          </div>

          {/* =========================
              RIGHT SIDEBAR
          ========================== */}

          <div className="col-lg-4">

            {/* Payment Information */}

            <div className="rm-card mb-4">

              <h5>
                Payment Information
              </h5>

              <hr />

              <div className="d-flex justify-content-between mb-3">

                <span>
                  Status
                </span>

                <StatusBadge
                  status={paymentStatus}
                />

              </div>

              <div className="d-flex justify-content-between mb-3">

                <span>
                  Grand Total
                </span>

                <strong>
                  ₹{total.toFixed(2)}
                </strong>

              </div>

              <div className="d-flex justify-content-between mb-3">

                <span>
                  Payment Method
                </span>

                <strong>
                  {paymentMethodValue}
                </strong>

              </div>

              {paymentAmount > 0 && (
                <div className="d-flex justify-content-between">

                  <span>
                    Paid Amount
                  </span>

                  <strong>
                    ₹{paymentAmount.toFixed(2)}
                  </strong>

                </div>
              )}

            </div>

            {/* Bill Summary */}

            <div className="rm-card">

              <h5>
                Bill Summary
              </h5>

              <hr />

              <div className="d-flex justify-content-between mb-2">

                <span>
                  Number of Items
                </span>

                <span>
                  {items.length}
                </span>

              </div>

              <div className="d-flex justify-content-between">

                <strong>
                  Grand Total
                </strong>

                <strong>
                  ₹{total.toFixed(2)}
                </strong>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =========================
          PAYMENT MODAL
      ========================== */}

      {showPaymentModal && (
        <div
          className="modal d-block"
          style={{
            backgroundColor:
              "rgba(0,0,0,0.45)",
          }}
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content">

              <div className="modal-header">

                <h5 className="modal-title">
                  Mark Bill as Paid
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setShowPaymentModal(false)
                  }
                ></button>

              </div>

              <div className="modal-body">

                <label className="form-label">
                  Payment Method
                </label>

                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value
                    )
                  }
                >

                  <option value="CASH">
                    Cash
                  </option>

                  <option value="UPI">
                    UPI
                  </option>

                  <option value="CARD">
                    Card
                  </option>

                  <option value="OTHER">
                    Other
                  </option>

                </select>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setShowPaymentModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-rm-primary"
                  disabled={saving}
                  onClick={handleMarkAsPaid}
                >
                  {saving
                    ? "Updating..."
                    : "Confirm Payment"}
                </button>

              </div>

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
    </>
  );
}

export default BillDetails;