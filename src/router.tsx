import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import LandingPage from "./pages/LandingPage";
import HowItWorks from "./pages/HowItWorks";
import CommingSoon from "./pages/CommingSoon";
import Dashboard from "./pages/homeowner/Dashboard";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <LandingPage />
            },
            {
                path: "login",
                element: <Login />
            },
            {
                path: "register",
                element: <Register />
            },
            {
                path: "how-it-works",
                element: <HowItWorks />
            },
            {
                path: "pricing",
                element: <CommingSoon />
            },
            {
                path: "homeowner",
                element: <Dashboard />
            }
        ]
    }
])