import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid Product Id" });
        }

        const product = await Product.findById(productId).select("_id");
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const customer = await Customer.findOneAndUpdate(
            { _id: req.user._id, wishlist: { $ne: product._id } },
            { $addToSet: { wishlist: product._id } },
            { new: true }
        );

        if (!customer) {
            return res.status(409).json({ message: "Product already in wishlist" });
        }

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

export const getWishlist = async (req, res) => {
    try {
        const customer = await Customer.findById(req.user._id)
            .select("wishlist")
            .populate({
                path: "wishlist",
                select: "name price category image stock"
            });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const wishlist = customer.wishlist.filter(Boolean);
        return res.status(200).json({
            success: true,
            count: wishlist.length,
            wishlist
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid Product Id" });
        }

        const customer = await Customer.findOneAndUpdate(
            { _id: req.user._id, wishlist: productId },
            { $pull: { wishlist: productId } },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ message: "Product not in wishlist" });
        }

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};