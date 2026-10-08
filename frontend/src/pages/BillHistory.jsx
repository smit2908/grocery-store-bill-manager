import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getBills } from "../api/api";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

function BillHistory() {
  const [bills, setBills] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBills = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBills({
        search,
        status,
        sort,
      });

      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load bills.");
    } finally {
      setLoading(false);
    }
  }, [search, status, sort]);

   

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBills();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadBills]);

  return (
    <div className="container rm-page">
      <div className="rm-page-header">
        <div>
          <span className="rm-section-eyebrow">BILLING</span>
          <h1>Bill History</h1>
          <p>View and manage previously created bills.</p>
        </div>

        <Link
          to="/bills/new"
          className="btn btn-rm-primary"
        >
          <i className="bi bi-plus-lg me-2"></i>
          New Bill
        </Link>
      </div>

      <div className="rm-card mb-4">
        <div className="row g-3">
          <div className="col-lg-5">
            <div className="rm-search-box">
              <i className="bi bi-search"></i>

              <input
                type="text"
                placeholder="Search bill number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4 col-lg-3">
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          <div className="col-md-4 col-lg-3">
            <select
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">
                Amount: High to Low
              </option>
              <option value="amount_low">
                Amount: Low to High
              </option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading message="Loading bill history..." />
      ) : error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          icon="bi-receipt"
          title="No bills found"
          message="No bills match your current filters."
        />
      ) : (
        <div className="rm-card">
          <div className="table-responsive">
            <table className="table rm-table align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bill Number</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>

              <tbody>
                {bills.map((bill, index) => (
                  <tr key={bill.id}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>
                        {bill.bill_number || `#${bill.id}`}
                      </strong>
                    </td>

                    <td>
                      {bill.customer_name ||
                        bill.customer?.name ||
                        "Walk-in Customer"}
                    </td>

                    <td>
                      {bill.created_at
                        ? new Date(
                            bill.created_at
                          ).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td>
                      <strong>
                        ₹
                        {Number(
                          bill.total_amount ??
                            bill.total ??
                            0
                        ).toFixed(2)}
                      </strong>
                    </td>

                    <td>
                      <StatusBadge
                        status={bill.payment_status}
                      />
                    </td>

                    <td className="text-end">
                      <Link
                        to={`/bills/${bill.id}`}
                        className="btn btn-sm btn-rm-outline"
                      >
                        <i className="bi bi-eye me-1"></i>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillHistory;