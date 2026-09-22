import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
    ActionPlansPage,
    AccessBridgePage,
  AlertsPage,
  CitizenIntelligencePage,
  DashboardPage,
  EvidencePage,
  OfflinePage,
  ProfilePage,
  RiskMapPage,
  SafetyPage,
  SettingsPage,
} from "./pages/WorkspacePages";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/risk-map" component={RiskMapPage} />
      <Route path="/action-plans" component={ActionPlansPage} />
      <Route path="/accessibility" component={AccessBridgePage} />
      <Route path="/evidence" component={EvidencePage} />
      <Route path="/citizen" component={CitizenIntelligencePage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/safety" component={SafetyPage} />
      <Route path="/offline" component={OfflinePage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
