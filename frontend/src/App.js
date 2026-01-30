// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* ========= Auth & Company ========= */
import Login from "./components/Login";
import CompanyForm from "./components/CompanyForm";
import CompanyList from "./components/CompanyList";

/* ========= Dashboard & Settings ========= */
import Dash from "./pages/Dash";
import POSSetting from "./components/POSSetting";

/* ========= POS & Printing ========= */
import Pos from "./components/Pos";
import PosThermalPrint from "./components/PosThermalPrint";

/* ========= Products & Customers ========= */
import ProductList from "./components/ProductList";
import PoleScaleLabel from "./components/PoleScaleLabel";
import Customer from "./components/Customer";
import AddCustomerModal from "./components/AddCustomerModal";

/* ========= Deals ========= */
import DealPage from "./components/DealPage";

/* ========= Invoices ========= */
import InvoicePage from "./components/InvoicePage";
import InvoiceForm from "./components/InvoiceForm";
import InvoicePrintA4 from "./components/InvoicePrintA4";

/* ========= Sales ========= */
import SalesPage from "./components/Sales/SalesPage";
import CustomerPage from "./components/Sales/CustomerPage";
import QuotePage from "./components/Sales/QuotePage";
import QuoteList from "./components/Sales/QuoteList";
import DeliveryChallanForm from "./components/Sales/DeliveryChallanForm";
import DeliveryChallanModal from "./components/Sales/DeliveryChallanModal";

/* ========= Payments & Notes ========= */
import PaymentReceived from "./components/Sales/PaymentReceived";
import AddPaymentPage from "./components/Sales/AddPaymentPage";
import RecurringInvoices from "./components/Sales/RecurringInvoices";
import EditRecurringPage from "./components/Sales/EditRecurringPage";
import NewRecurringPage from "./components/Sales/NewRecurringPage";
import CreditNotes from "./components/Sales/CreditNotes";
import CreditNotesList from "./components/Sales/CreditNotesList";
import PaymentReceipt from "./components/Sales/PaymentReceipt";
import Payment from "./components/Payment";

/* ========= Purchase ========= */
import TotalPurchase from "./components/TotalPurchase";
import PurchaseList from "./components/PurchaseList";
import PurchaseForm from "./components/PurchaseForm";
import PurchasePrintA4 from "./components/PurchasePrintA4";
import VendorForm from "./components/VendorForm";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import VendorList from "./components/VendorList";

/* ========= Reports Hub & Misc ========= */
import Reports from "./components/Reports";
import Return from "./components/Return";
import Analytics from "./components/Analytics";
import Shift from "./components/Shift";
import Options from "./components/Options";

/* ========= Reports: Pages ========= */
import SalesSummaryReport from "./components/reports/SalesSummaryReport";
import ProductSalesReport from "./components/reports/ProductSalesReport";
import DayZReport from "./components/reports/DayZReport";
import ShiftReport from "./components/reports/ShiftReport";
import CustomerReport from "./components/reports/CustomerReport";
import PurchaseReport from "./components/reports/PurchaseReport";
import ReturnCancellationReport from "./components/reports/ReturnCancellationReport";
import PaymentCollectionReport from "./components/reports/PaymentCollectionReport";
import VatReport from "./components/reports/VatReport";
import VatSummaryReport from "./components/reports/VatSummaryReport";
import AgingReport from "./components/reports/AgingReport";
import ExpenseReport from "./components/reports/ExpenseReport";
import SupplierOutstandingReport from "./components/reports/SupplierOutstandingReport";

/* ========= Accounts ========= */
import Account from "./components/Account";
import Ledger from "./components/accounts/Ledger";
import Groups from "./components/accounts/Groups";

/* ========= Hardware ========= */
import PoleDisplay from "./components/PoleDisplay";
import Scale from "./components/Scale";

/* ========= Developer ========= */
import DeveloperScreen from "./components/DeveloperScreen";

/* ========= Guards / Helpers ========= */
const ROLES = { Admin: "Admin", Developer: "Developer", Cashier: "Cashier" };

const normalizeRole = (r) => {
  const x = String(r || "").trim().toLowerCase();
  if (x === "admin") return ROLES.Admin;
  if (x === "developer" || x === "dev") return ROLES.Developer;
  if (x === "cashier" || x === "client") return ROLES.Cashier;
  return "";
};

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("authToken");
  return token ? children : <Navigate to="/" replace />;
};

const RequireRole = ({ roles = [], children }) => {
  const role = normalizeRole(localStorage.getItem("userRole"));
  if (!role) return <Navigate to="/" replace />;
  if (roles.length && !roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
};

/** Combines auth + role in one place */
const Protected = ({ roles = [], children }) => (
  <RequireAuth>
    <RequireRole roles={roles}>{children}</RequireRole>
  </RequireAuth>
);

/** Small helper so each route is concise */
const guard = (Comp, roles, extraProps) => (
  <Protected roles={roles}>
    <Comp {...(extraProps || {})} />
  </Protected>
);

/* ========= App ========= */
function App() {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />

        {/* Dashboard & Settings */}
        <Route path="/dashboard" element={guard(Dash, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/settings" element={guard(POSSetting, [ROLES.Admin, ROLES.Developer])} />

        {/* Company */}
        <Route path="/company" element={guard(CompanyForm, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/companies" element={guard(CompanyList, [ROLES.Admin, ROLES.Developer])} />

        {/* Developer */}
        <Route path="/developer" element={guard(DeveloperScreen, [ROLES.Developer])} />

        {/* POS */}
        <Route path="/pos" element={guard(Pos, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/print" element={guard(PosThermalPrint, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />

        {/* Products & Customers */}
        <Route path="/products" element={guard(ProductList, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/customers" element={guard(Customer, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/pole-scale-label" element={guard(PoleScaleLabel, [ROLES.Admin, ROLES.Developer])} />
        <Route
          path="/add-customer"
          element={guard(AddCustomerModal, [ROLES.Admin, ROLES.Developer, ROLES.Cashier], { onClose: () => window.history.back() })}
        />

        {/* Payment print */}
        <Route path="/print/payment/:id" element={guard(PaymentReceipt, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />

        {/* Deals */}
        <Route path="/deals" element={guard(DealPage, [ROLES.Admin, ROLES.Developer])} />

        {/* Invoices */}
        <Route path="/invoice" element={guard(InvoicePage, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/invoice/form" element={guard(InvoiceForm, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/invoice/a4/:id" element={guard(InvoicePrintA4, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />

        {/* Sales */}
        <Route path="/sales" element={guard(SalesPage, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/sales/customers" element={guard(CustomerPage, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/sales/quotes" element={guard(QuotePage, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/sales/view-quotes" element={guard(QuoteList, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route
          path="/sales/delivery"
          element={guard(DeliveryChallanForm, [ROLES.Admin, ROLES.Developer, ROLES.Cashier], { onClose: () => window.history.back() })}
        />
        <Route
          path="/sales/delivery/list"
          element={guard(DeliveryChallanModal, [ROLES.Admin, ROLES.Developer, ROLES.Cashier], { onClose: () => window.history.back() })}
        />

        {/* Payments */}
        <Route path="/payment" element={guard(PaymentReceived, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/payment/new" element={guard(AddPaymentPage, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/pos/payment-entry" element={guard(Payment, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />

        {/* Recurring Invoices */}
        <Route path="/sales/recurring" element={guard(RecurringInvoices, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/sales/recurring/new" element={guard(NewRecurringPage, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/sales/recurring/:id/edit" element={guard(EditRecurringPage, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />

        {/* Credit Notes */}
        <Route path="/sales/creditnotes" element={guard(CreditNotesList, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/sales/creditnotes/new" element={guard(CreditNotes, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/sales/creditnotes/:id" element={guard(CreditNotes, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />

        {/* Purchase */}
        <Route path="/total-purchase" element={guard(TotalPurchase, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/total-purchase/purchase" element={guard(PurchaseList, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/total-purchase/purchase/add" element={guard(PurchaseForm, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/total-purchase/purchase/a4" element={guard(PurchasePrintA4, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/total-purchase/purchase/a4/:id" element={guard(PurchasePrintA4, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/total-purchase/vendor" element={guard(VendorForm, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/vendors" element={guard(VendorList, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/total-purchase/expense" element={guard(ExpenseForm, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/expenses" element={guard(ExpenseList, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />

        {/* Accounts */}
        <Route path="/accounts" element={guard(Account, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/accounts/groups" element={guard(Groups, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/accounts/ledgers" element={guard(Ledger, [ROLES.Admin, ROLES.Developer])} />

        {/* Reports Hub & Other */}
        <Route path="/reports" element={guard(Reports, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/return" element={guard(Return, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/analytics" element={guard(Analytics, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/shift" element={guard(Shift, [ROLES.Admin, ROLES.Developer, ROLES.Cashier])} />
        <Route path="/options" element={guard(Options, [ROLES.Admin, ROLES.Developer])} />

        {/* Reports: Individual Pages */}
        <Route path="/reports/sales-summary" element={guard(SalesSummaryReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/product-sales" element={guard(ProductSalesReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/dayz" element={guard(DayZReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/shift" element={guard(ShiftReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/customer" element={guard(CustomerReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/purchase" element={guard(PurchaseReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/returns" element={guard(ReturnCancellationReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/payments" element={guard(PaymentCollectionReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/vat" element={guard(VatReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/vat-summary" element={guard(VatSummaryReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/aging" element={guard(AgingReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/expenses" element={guard(ExpenseReport, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/reports/supplier-outstanding" element={guard(SupplierOutstandingReport, [ROLES.Admin, ROLES.Developer])} />

        {/* Hardware */}
        <Route path="/pole-display" element={guard(PoleDisplay, [ROLES.Admin, ROLES.Developer])} />
        <Route path="/scale" element={guard(Scale, [ROLES.Admin, ROLES.Developer])} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
