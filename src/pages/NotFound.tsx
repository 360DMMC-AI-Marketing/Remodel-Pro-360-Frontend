import { useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"

const NotFound = () => {
  const location = useLocation()
  useEffect(() => {
    console.log("404 Error: User attempted to access non-existent route:", location.pathname)
  }, [location])
  return (
    <div className="w-screen min-h-screen flex justify-center items-center bg-neutral-200">
        <div className="text-center">
            <h1 className="mb-4">404</h1>
            <p className="text-xl text-neutral-700 mb-5">Page Not Found</p>
            <NavLink to="/" className="text-primary-600 hover:underline">
                Go back home
            </NavLink>
        </div>
    </div>
  )
}

export default NotFound