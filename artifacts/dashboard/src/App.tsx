import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, getAuthToken } from "@/lib/auth";
import { Layout } from "@/components/layout";
import LoginPage from "@/pages/login";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Projects = lazy(() => import("@/pages/projects"));
const Revenue = lazy(() => import("@/pages/revenue"));
const Tasks = lazy(() => import("@/pages/tasks"));
const Content = lazy(() => import("@/pages/content"));
const Notes = lazy(() => import("@/pages/notes"));
const Keywords = lazy(() => import("@/pages/keywords"));
const Planner = lazy(() => import("@/pages/planner"));
const Expenses = lazy(() => import("@/pages/expenses"));
const Settings = lazy(() => import("@/pages/settings"));
const NotFound = lazy(() => import("@/pages/not-found"));

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient();

setAuthTokenGetter(() => getAuthToken());

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
    </div>
  );
}

function AuthenticatedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path="/">
            <Redirect to="/hub" />
          </Route>
          <Route path="/hub" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/revenue" component={Revenue} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/planner" component={Planner} />
          <Route path="/keywords" component={Keywords} />
          <Route path="/content" component={Content} />
          <Route path="/notes" component={Notes} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthenticatedRoutes />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </WouterRouter>
  );
}

export default App;
