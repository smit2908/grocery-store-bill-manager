import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Items from "./pages/Items";
import Customers from "./pages/Customers";
import NewBill from "./pages/NewBill";
import BillHistory from "./pages/BillHistory";
import BillDetails from "./pages/BillDetails";
import Footer from "./components/Footer";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />

        <main>
          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

            {/* Products / Items */}
            <Route path="/items" element={<Items />} />

            {/* Customers */}
            <Route path="/customers" element={<Customers />} />

            {/* Billing */}
            <Route path="/bills/new" element={<NewBill />} />
            <Route path="/bills" element={<BillHistory />} />
            <Route path="/bills/:id" element={<BillDetails />} />

            {/* Fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;