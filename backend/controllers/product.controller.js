import mongoose from "mongoose";
import Product from "../models/product.model.js";

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, image, stock } = req.body;

        if (!name || !description || !category || !image) {
            return res.status(400).json({
                message: "All fields Required"
            });
        }

        if (price === undefined || price <= 0) {
            return res.status(400).json({
                message: "Price must be greater than 0"
            });
        }

        if (stock === undefined || stock < 0) {
            return res.status(400).json({
                message: "Stock cannot be negative"
            });
        }

        const newProduct = await Product.create({
            name,
            description,
            price,
            category,
            image,
            stock
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: newProduct
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};



export const getProducts = async (req, res) => {
    try {
        const { search, category } = req.query;

        const query = {};

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (category) {
            query.category = category;
        }

        const products = await Product.find(query);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};


// Get a single product by id

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Product Id"
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};
