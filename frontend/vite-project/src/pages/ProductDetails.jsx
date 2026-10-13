import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCart } from '../context/CartContext'
import { getProductById } from '../services/api'

const LOW_STOCK_THRESHOLD = 10

function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)
  const { addToCart } = useCart()

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      setError('')

      try {
        setProduct(await getProductById(id))
      } catch {
        setError('Something went wrong while loading this product.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [id])

  const handleAddToCart = async () => {
    try {
      await addToCart(id, 1)
      setAdded(true)
      setTimeout(() => setAdded(false), 1600)
    } catch {
      setError('Unable to add to cart right now.')
    }
  }

  return (
    <main className="product-details-page">
      <Navbar />

      <section className="product-details-content">
        {isLoading && <p>Loading product...</p>}

        {!isLoading && error && <p>{error}</p>}

        {!isLoading && !error && product && (
          <>
            <p className="breadcrumb">
              <Link to="/products">Products</Link> / {product.category} /{' '}
              <span className="current">{product.name}</span>
            </p>

            <article className="product-details">
              <img className="product-details-image" src={product.image} alt={product.name} />

              <div>
                <p className="eyebrow">{product.category}</p>
                <h1>{product.name}</h1>
                <p className="product-details-description">{product.description}</p>

                <div className="price-row">
                  <p className="product-price">₹{product.price}</p>
                  <span
                    className={`stock-badge ${product.stock <= LOW_STOCK_THRESHOLD ? 'low' : 'ok'}`}
                  >
                    {product.stock} in stock
                  </span>
                </div>

                <button
                  className={`button button-primary${added ? ' added' : ''}`}
                  type="button"
                  onClick={handleAddToCart}
                >
                  {added ? 'Added ✓' : 'Add to Cart'}
                </button>
              </div>
            </article>
          </>
        )}
      </section>
    </main>
  )
}

export default ProductDetails
