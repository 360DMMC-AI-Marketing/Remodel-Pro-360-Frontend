import { Button } from "../atoms/Button"
import { Container } from "../atoms/Container"
import { NavLink } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useState } from "react"


const Header = () => {
    const [isOpen, setIsOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-b-neutral-200 h-header">
        <Container className="h-full flex items-center justify-between">
            <h3 className="cursor-default">RP360</h3>
            <div className="hidden md:flex h-full items-center gap-10">
                <nav>
                    <NavLink to="/" className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200">
                        How It Works
                    </NavLink>
                    <NavLink to="/pricing" className="ml-6 text-neutral-500 hover:text-neutral-900 transition-colors duration-200">
                        Pricing
                    </NavLink>
                </nav>
                <div>
                    <Button variant="ghost" size="sm" className="mr-2">
                        Log In
                    </Button>
                    <Button variant="primary" size="sm">
                        Get Started
                    </Button>
                </div>
            </div>
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden cursor-pointer">
                {isOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
        </Container>
        {
            isOpen && (
                <div className="md:hidden bg-white border-y border-y-neutral-200">
                    <nav className="flex flex-col items-start gap-4 p-4">
                        <NavLink to="/" className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200">
                            How It Works
                        </NavLink>
                        <NavLink to="/pricing" className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200">
                            Pricing
                        </NavLink>
                        <div className="mt-4 w-full">
                            <Button variant="ghost" size="sm" className="w-full mb-2">
                                Log In
                            </Button>
                            <Button variant="primary" size="sm" className="w-full">
                                Get Started
                            </Button>
                        </div>
                    </nav>
                </div>
            )
        }
    </header>
  )
}

export default Header