import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import HomePage from "@/pages/home";
import TechSectionPage from "@/pages/tech-section";
import CodeAnalyzer from "@/pages/code-analyzer";
import RepoScanner from "@/pages/repo-scanner";
import VulnerabilityScanner from "@/pages/vulnerability-scanner";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/home" component={HomePage} />
      <Route path="/tech/:section" component={TechSectionPage} />
      <Route path="/code-analyzer" component={CodeAnalyzer} />
      <Route path="/repo-scanner" component={RepoScanner} />
      <Route path="/vulnerability-scanner" component={VulnerabilityScanner} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
