import { StrictMode } from 'react'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import './App.css'
import MapPage from './pages/map';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const router = createBrowserRouter([{
    path: "/",
    element: <MapPage />,
  }
]);

const queryClient = new QueryClient()

function App() {
  return (
    <>
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>
    </>
  )
}

export default App
