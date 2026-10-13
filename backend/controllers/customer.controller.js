import Customer from "../models/customer.model.js";
import bcrypt from "bcrypt";
import { genToken } from "../utils/generateToken.js";

// Cookie Options

const cookiesOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
};



export const registerCustomer = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;


        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({
                message: "All fields Required"
            });
        }


        if (password.length < 6) {
            return res.status(400).json({
                message: "Password Length should be greater than 6"
            });
        }


        if (phone.length < 10) {
            return res.status(400).json({
                message: "Phone Number should be 10 digits"
            });
        }

        if (phone.length > 10) {
            return res.status(400).json({
                message: "Phone Number should be 10 digits"
            });
        }

        const phoneExists = await Customer.findOne({ phone });

        if (phoneExists) {
            return res.status(409).json({
                message: "Phone Number Already Exists"
            });
        }




        const emailExists = await Customer.findOne({ email });

        if (emailExists) {
            return res.status(409).json({
                message: "Email Already Exists"
            });
        }


        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );


        const newCustomer = await Customer.create({
            fullName,
            email,
            password: hashedPassword,
            phone
        });

        const token = genToken(newCustomer._id);

        res.cookie(
            "token",
            token,
            cookiesOptions
        );


        // Don't send password

        res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            customer: {
                _id: newCustomer._id,
                fullName: newCustomer.fullName,
                email: newCustomer.email,
                phone: newCustomer.phone
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};


// Login Controller

export const loginCustomer = async (req, res) => {
    try {

        const { email, password } = req.body;


        if (!email || !password) {
            return res.status(400).json({
                message: "All fields Required"
            });
        }


        const customer = await Customer.findOne({ email });


        if (!customer) {
            return res.status(401).json({
                message: "Invalid Credentials"
            });
        }


        const isPasswordCorrect = await bcrypt.compare(
            password,
            customer.password
        );


        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid Credentials"
            });
        }


        // Generate token

        const token = genToken(customer._id);


        // Store token in cookie

        res.cookie(
            "token",
            token,
            cookiesOptions
        );


        // Don't send password

        res.status(200).json({
            success: true,
            message: "Login successful",
            customer: {
                _id: customer._id,
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

export const getCustomer = async (req, res) => {
    const { _id, fullName, email, phone } = req.user;

    res.status(200).json({
        message: 'Customer Authenticated',
        success: true,
        customerData: {
            _id,
            fullName,
            email,
            phone
        }
    });
};


// Logout Controller

export const logoutCustomer = async (req, res) => {
    try {

        res.clearCookie(
            "token",
            cookiesOptions
        );

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};
