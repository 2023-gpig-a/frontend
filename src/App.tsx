import { StrictMode } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import "./index.css";
import "./App.css";
import MapPage from "./pages/droneStatus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DataPage from "./pages/data";
import { Assistant } from "./components/Assistant";
import { Navbar } from "./components/Navbar";

function Layout() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main className="bg-green p-4 text-white w-full">
        <Outlet />
      </main>
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <MapPage />,
      },
      {
        path: "/data",
        element: <DataPage />,
      },
    ],
  },
]);

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Assistant />
        </QueryClientProvider>
      </StrictMode>
    </>
  );
}

export default App;
