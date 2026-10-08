const API_BASE_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

return data?.data ?? data;}

/* =========================
   PRODUCTS
========================= */

export const getProducts = () => {
  return request("/products");
};

export const getProduct = (id) => {
  return request(`/products/${id}`);
};

export const searchProducts = (query) => {
  return request(`/products/search?q=${encodeURIComponent(query)}`);
};

export const createProduct = (product) => {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
};

export const updateProduct = (id, product) => {
  return request(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
};

export const deleteProduct = (id) => {
  return request(`/products/${id}`, {
    method: "DELETE",
  });
};

/* =========================
   CUSTOMERS
========================= */

export const getCustomers = () => {
  return request("/customers");
};

export const getCustomer = (id) => {
  return request(`/customers/${id}`);
};

export const searchCustomers = (query) => {
  return request(`/customers/search?q=${encodeURIComponent(query)}`);
};

export const createCustomer = (customer) => {
  return request("/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });
};

export const updateCustomer = (id, customer) => {
  return request(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(customer),
  });
};

export const getCustomerBills = (id) => {
  return request(`/customers/${id}/bills`);
};

/* =========================
   BILLS
========================= */

export const getBills = (params = {}) => {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.append("search", params.search);
  }

  if (params.status) {
    searchParams.append("status", params.status);
  }

  if (params.sort) {
    searchParams.append("sort", params.sort);
  }

  const queryString = searchParams.toString();

  return request(`/bills${queryString ? `?${queryString}` : ""}`);
};

export const getBill = (id) => {
  return request(`/bills/${id}`);
};

export const createBill = (bill) => {
  return request("/bills", {
    method: "POST",
    body: JSON.stringify(bill),
  });
};

export const markBillAsPaid = (id, paymentMethod = "CASH") => {
  return request(`/bills/${id}/payment`, {
    method: "PUT",
    body: JSON.stringify({
      payment_method: paymentMethod,
    }),
  });
};

/* =========================
   DEFAULT API OBJECT
========================= */

const api = {
  // Products
  getProducts,
  getProduct,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,

  // Customers
  getCustomers,
  getCustomer,
  searchCustomers,
  createCustomer,
  updateCustomer,
  getCustomerBills,

  // Bills
  getBills,
  getBill,
  createBill,
  markBillAsPaid,
};

export default api;