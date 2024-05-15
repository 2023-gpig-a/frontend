import { StrictMode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import "./App.css";
import MapPage from "./pages/map";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DataPage from "./pages/data";
import { Assistant } from "./components/Assistant";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MapPage />,
  },
  {
    path: "/data",
    element: <DataPage />,
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
