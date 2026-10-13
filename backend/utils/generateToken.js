import jwt from 'jsonwebtoken'

export const genToken = (customerId)=>{
   const secret = process.env.JWT_SECRET || 'shopkart_local_secret'
   const token = jwt.sign({ customerId }, secret, { expiresIn: '10d' })
   return token
}