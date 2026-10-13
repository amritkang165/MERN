import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getWishlist, removeFromWishlist } from '../services/api'

function Wishlist() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [removingId, setRemovingId] = useState('')
  const [removeError, setRemoveError] = useState('')

  useEffect(() => {
    let isCurrentRequest = true

    const loadWishlist = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getWishlist()
        if (isCurrentRequest) setProducts(data.wishlist)
      } catch {
        if (isCurrentRequest) setError('Unable to load wishlist.')
      } finally {
        if (isCurrentRequest) setIsLoading(false)
      }
    }

    loadWishlist()
    return () => {
      isCurrentRequest = false
    }
  }, [retryCount])

  const handleRemove = async (productId) => {
    setRemovingId(productId)
    setRemoveError('')

    try {
      await removeFromWishlist(productId)
      setProducts((currentProducts) => currentProducts.filter((product) => product._id !== productId))
    } catch {
      setRemoveError('Unable to remove this product. Please try again.')
    } finally {
      setRemovingId('')
    }
  }

  return (
    <main className="wishlist-page">
      <Navbar />

      <section className="wishlist-content">
        <div className="wishlist-heading">
          <div>
            <p className="eyebrow">Saved for later</p>
            <h1>My Wishlist</h1>
          </div>
          {!isLoading && !error && (
            <span className="wishlist-count">
              {products.length} {products.length === 1 ? 'product' : 'products'} saved
            </span>
          )}
        </div>

        {isLoading && (
          <p className="wishlist-state" role="status">Loading your wishlist...</p>
        )}

        {!isLoading && error && (
          <div className="wishlist-state wishlist-error" role="alert">
            <h2>Something went wrong.</h2>
            <p>We couldn't load your wishlist.</p>
            <button className="button button-primary" type="button" onClick={() => setRetryCount((count) => count + 1)}>
              Try Again
            </button>
            <p className="wishlist-login-hint">
              Your wishlist is tied to your account. <Link to="/login">Log in</Link> if needed.
            </p>
          </div>
        )}

        {!isLoading && !error && products.length === 0 && (
          <div className="wishlist-state wishlist-empty">
            <span className="wishlist-empty-heart" aria-hidden="true">♡</span>
            <h2>Your wishlist is empty</h2>
            <p>Save products you love and find them here later.</p>
            <Link className="button button-primary" to="/products">Browse Products</Link>
          </div>
        )}

        {!isLoading && !error && products.length > 0 && (
          <>
            {removeError && <p className="form-error" role="alert">{removeError}</p>}
            <div className="wishlist-grid">
              {products.map((product) => (
                <article className="wishlist-card" key={product._id}>
                  <Link className="wishlist-card-image-link" to={`/products/${product._id}`}>
                    <img src={product.image} alt={product.name} />
                  </Link>
                  <div className="wishlist-card-info">
                    <p className="eyebrow">{product.category}</p>
                    <h2>{product.name}</h2>
                    <p className="wishlist-card-price">₹{product.price}</p>
                    <p className={`wishlist-stock${product.stock === 0 ? ' out' : ''}`}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} units left`}
                    </p>
                    <Link className="button view-btn" to={`/products/${product._id}`}>
                      View Details
                    </Link>
                    <button
                      className="wishlist-remove"
                      type="button"
                      onClick={() => handleRemove(product._id)}
                      disabled={removingId === product._id}
                    >
                      {removingId === product._id ? 'Removing...' : 'Remove from Wishlist'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default Wishlist