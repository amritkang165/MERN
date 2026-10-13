import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { addToWishlist } from '../services/api'

const LOW_STOCK_THRESHOLD = 10
const DISCOUNT_RATE = 0.2

function Stars() {
  return (
    <span className="stars" aria-hidden="true">
      {'★★★★★'.split('').map((s, i) => (
        <span key={i} className={i < 4 ? 'star-filled' : ''}>{s}</span>
      ))}
    </span>
  )
}

function ProductCard({ product, tag }) {
  const isLow = product.stock <= LOW_STOCK_THRESHOLD
  const [wishlistState, setWishlistState] = useState('idle')
  const [cartState, setCartState] = useState('idle')
  const oldPrice = Math.round(product.price / (1 - DISCOUNT_RATE))
  const { addToCart } = useCart()
  const isSaved = wishlistState === 'saved' || wishlistState === 'already-saved'

  const handleAddToWishlist = async () => {
    if (wishlistState === 'saving' || isSaved) return

    setWishlistState('saving')
    try {
      await addToWishlist(product._id)
      setWishlistState('saved')
    } catch (error) {
      setWishlistState(error.response?.status === 409 ? 'already-saved' : 'error')
    }
  }

  const handleAddToCart = async () => {
    setCartState('adding')
    try {
      await addToCart(product._id, 1)
      setCartState('added')
    } catch (error) {
      setCartState('error')
    }
  }

  return (
    <article className="product-card">
      {tag && <span className="card-tag">{tag}</span>}

      <div className="product-media">
        <img className="product-image" src={product.image} alt={product.name} />
        <button
          className={`wish-btn${isSaved ? ' wished' : ''}`}
          type="button"
          onClick={handleAddToWishlist}
          disabled={wishlistState === 'saving' || isSaved}
          aria-label={isSaved ? 'Added to wishlist' : 'Add to wishlist'}
          aria-pressed={isSaved}
        >
          {isSaved ? '♥' : '♡'}
        </button>
      </div>

      <div className="product-info">
        <p className="eyebrow">{product.category}</p>
        <h3>{product.name}</h3>
        <Stars />

        <div className="product-meta-row">
          <p className="product-price">
            ₹{product.price} <span className="old-price">₹{oldPrice}</span>
          </p>
          <span className={`stock-badge ${isLow ? 'low' : 'ok'}`}>
            {isLow ? `Only ${product.stock} left` : 'In stock'}
          </span>
        </div>

        <Link className="button view-btn" to={`/products/${product._id}`}>
          View Details
        </Link>
        <button
          className="button button-primary cart-mini-button"
          type="button"
          onClick={handleAddToCart}
          disabled={cartState === 'adding' || cartState === 'added'}
        >
          {cartState === 'adding' ? 'Adding...' : cartState === 'added' ? 'Added to Cart' : 'Add to Cart'}
        </button>
        <button
          className={`wishlist-action${wishlistState === 'saved' ? ' saved' : ''}`}
          type="button"
          onClick={handleAddToWishlist}
          disabled={wishlistState === 'saving' || isSaved}
          aria-live="polite"
        >
          {wishlistState === 'saving' && 'Saving...'}
          {wishlistState === 'saved' && '♥ Added to Wishlist'}
          {wishlistState === 'already-saved' && '♥ Already in Wishlist'}
          {(wishlistState === 'idle' || wishlistState === 'error') && '♡ Add to Wishlist'}
        </button>
        {wishlistState === 'error' && (
          <p className="wishlist-action-error" role="alert">
            Unable to save product. Please try again.
          </p>
        )}
        {wishlistState === 'already-saved' && (
          <p className="wishlist-action-error" role="status">
            This product is already in your wishlist.
          </p>
        )}
      </div>
    </article>
  )
}

export default ProductCard
