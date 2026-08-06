import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router";
import SplashPage from "@/pages/SplashPage";
import { SetupGuard } from "@/routes/SetupGuard";
import { LoginGuard } from "@/routes/LoginGuard";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Spinner } from "@/components/ui/spinner";

const SetupPage = lazy(() => import("@/pages/SetupPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RecoverPage = lazy(() => import("@/pages/RecoverPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const PatientsPage = lazy(() => import("@/pages/PatientsPage").then((m) => ({ default: m.PatientsPage })));
const PatientProfilePage = lazy(() => import("@/pages/PatientProfilePage").then((m) => ({ default: m.PatientProfilePage })));
const AppointmentsPage = lazy(() => import("@/pages/AppointmentsPage").then((m) => ({ default: m.AppointmentsPage })));
const InvoicesPage = lazy(() => import("@/pages/InvoicesPage").then((m) => ({ default: m.InvoicesPage })));
const ReportsPage = lazy(() => import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const UserManagementPage = lazy(() => import("@/pages/UserManagementPage").then((m) => ({ default: m.UserManagementPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const InventoryPage = lazy(() => import("@/pages/InventoryPage").then((m) => ({ default: m.InventoryPage })));
const InventoryGuidePage = lazy(() => import("@/pages/InventoryGuidePage").then((m) => ({ default: m.InventoryGuidePage })));
const SuppliersPage = lazy(() => import("@/pages/SuppliersPage").then((m) => ({ default: m.SuppliersPage })));
const PurchaseOrdersPage = lazy(() => import("@/pages/PurchaseOrdersPage").then((m) => ({ default: m.PurchaseOrdersPage })));
const ClinicNotesPage = lazy(() => import("@/pages/ClinicNotesPage").then((m) => ({ default: m.ClinicNotesPage })));

function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}

function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary variant="page-level">
      {children}
    </ErrorBoundary>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route
        path="/setup"
        element={
          <Suspense fallback={<PageSpinner />}>
            <SetupGuard>
              <SetupPage />
            </SetupGuard>
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageSpinner />}>
            <LoginGuard>
              <LoginPage />
            </LoginGuard>
          </Suspense>
        }
      />
      <Route
        path="/recover"
        element={
          <Suspense fallback={<PageSpinner />}>
            <RecoverPage />
          </Suspense>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><DashboardPage /></PageErrorBoundary></Suspense>} />
        <Route path="/patients" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><PatientsPage /></PageErrorBoundary></Suspense>} />
        <Route path="/patients/:id" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><PatientProfilePage /></PageErrorBoundary></Suspense>} />
        <Route path="/appointments" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><AppointmentsPage /></PageErrorBoundary></Suspense>} />
        <Route path="/invoices" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><InvoicesPage /></PageErrorBoundary></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><ReportsPage /></PageErrorBoundary></Suspense>} />
        <Route path="/inventory" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><InventoryPage /></PageErrorBoundary></Suspense>} />
        <Route path="/inventory/guide" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><InventoryGuidePage /></PageErrorBoundary></Suspense>} />
        <Route path="/suppliers" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><SuppliersPage /></PageErrorBoundary></Suspense>} />
        <Route path="/purchase-orders" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><PurchaseOrdersPage /></PageErrorBoundary></Suspense>} />
        <Route path="/clinic-notes" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><ClinicNotesPage /></PageErrorBoundary></Suspense>} />
        <Route path="/users" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><UserManagementPage /></PageErrorBoundary></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageSpinner />}><PageErrorBoundary><SettingsPage /></PageErrorBoundary></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
