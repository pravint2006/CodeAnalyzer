import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home";
import TechSectionPage from "@/pages/tech-section";
import CodeAnalyzer from "@/pages/code-analyzer";
import RepoScanner from "@/pages/repo-scanner";
import VulnerabilityScanner from "@/pages/vulnerability-scanner";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/tech/:section" component={TechSectionPage} />
      <Route path="/code-analyzer" component={CodeAnalyzer} />
      <Route path="/repo-scanner" component={RepoScanner} />
      <Route path="/vulnerability-scanner" component={VulnerabilityScanner} />
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
