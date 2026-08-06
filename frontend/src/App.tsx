import { AppProviders } from "@/providers/AppProviders";
import { AppRoutes } from "@/routes";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { UpdateNotification } from "@/components/common/UpdateNotification";

function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRoutes />
        <UpdateNotification />
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
