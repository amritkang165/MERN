import jwt from 'jsonwebtoken';
import Customer from '../models/customer.model.js';

export const isAuthenticated = async (req, res, next) => {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!token) {
        return res.status(401).json({
            message: 'Not Authorized, Please Login'
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopkart_local_secret');
    } catch {
        return res.status(401).json({
            message: 'Not Authorized, Please Login'
        });
    }

    const user = await Customer.findById(decoded.customerId);

    if (!user) {
        return res.status(401).json({
            message: 'Not Authorized, Please Login'
        });
    }

    req.user = user;
    next();
};