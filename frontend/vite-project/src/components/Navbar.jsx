import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getCurrentCustomer, logoutCustomer } from '../services/api'

function Navbar() {
  const [customer, setCustomer] = useState(null)
  const [checked, setChecked] = useState(false)
  const navigate = useNavigate()
  const { count } = useCart()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setCustomer(await getCurrentCustomer())
      } catch {
        setCustomer(null)
      } finally {
        setChecked(true)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await logoutCustomer()
    } finally {
      setCustomer(null)
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link className="brand" to="/" aria-label="ShopKart home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8h12l-1 12H7L6 8z" strokeLinejoin="round" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
            </svg>
          </span>
          <span>ShopKart</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/products?category=Electronics">Electronics</Link>
          <Link to="/products?category=Fashion">Fashion</Link>
          <Link to="/products?category=Books">Books</Link>
        </nav>

        <div className="nav-icons">
          <Link className="wishlist-nav-link" to="/wishlist">Wishlist</Link>
          <Link className="wishlist-nav-link" to="/cart">Cart ({count})</Link>
          <Link className="wishlist-nav-link" to="/orders">Orders</Link>
          <Link className="icon-btn" to="/products" aria-label="Search products" title="Search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </Link>

          {checked && (
            customer ? (
              <div className="nav-account">
                <span className="nav-greeting">Hi, {customer.fullName?.split(' ')[0]}</span>
                <button className="icon-btn" type="button" onClick={handleLogout} title="Log out" aria-label="Log out">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link className="icon-btn" to="/login" aria-label="Login" title="Login">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" strokeLinecap="round" />
                </svg>
              </Link>
            )
          )}
        </div>

        <Link className="button button-primary nav-shop-btn" to="/products">
          Shop Now
        </Link>
      </div>
    </header>
  )
}

export default Navbar
