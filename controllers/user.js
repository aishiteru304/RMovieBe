import asyncHandler from "express-async-handler"
import User from '../models/user.js'
import Movie from '../models/movie.js'
import bcrypt from 'bcryptjs'
import { generateToken } from '../middlewares/auth.js'
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase.js";
import user from "../models/user.js";

// USER
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body
    try {
        const userExists = await User.findOne({ email })

        if (userExists) {
            res.status(400)
            throw new Error("User already exists")
        }

        // Hash Password 
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        //  Create user in DB
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        })

        // if user created successfully send user to client
        if (user) res.status(201).json({ message: "User created successfully" })
        else {
            res.status(400);
            throw new Error("Invalid user data")
        }
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    try {
        // Find user in DB
        const user = await User.findOne({ email })

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                token: generateToken(user._id)
            })
        }
        else {
            res.status(401)
            throw new Error("Invalid email or password.")
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const updatedUser = asyncHandler(async (req, res) => {
    const { name } = req.body
    try {
        // Find user in DB
        const user = await User.findById(req.user._id)

        if (user) {
            user.name = name || user.name
            await user.save()

            res.status(200).json({ message: "User updated successfully" })
        }
        else {
            res.status(401)
            throw new Error("User not found")
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const getProfileUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('name isAdmin image');
        if (user) {
            res.json(user)
        }
        else {
            res.status(404)
            throw new Error("User not found")
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const updatedAvatar = asyncHandler(async (req, res) => {
    try {
        // Ensure a file is uploaded
        if (!req.file) {
            res.status(400);
            throw new Error("No file uploaded");
        }

        // Find user in DB
        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(401);
            throw new Error("User not found");
        }

        // // Firebase storage setup
        const storageRef = ref(storage, `avatars/${req.file.originalname}`);

        // // Upload file to Firebase
        await uploadBytes(storageRef, req.file.buffer);

        // // Get the download URL for the uploaded file
        const downloadURL = await getDownloadURL(storageRef);

        // // Update user image
        user.image = downloadURL;
        await user.save();

        res.status(200).json({ message: "Avatar updated successfully", image: downloadURL });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

const deleteUserProfile = asyncHandler(async (req, res) => {
    try {
        // Find user in DB
        const user = await User.findById(req.user._id)

        if (user) {
            if (user.isAdmin) {
                res.status(400)
                throw new Error("Can't delete admin user")
            }
            console.log(user)
            // await user.remove()
            await User.deleteOne({ _id: req.user._id })
            res.json({ message: "User deleted successfully" })
        }
        else {
            res.status(401)
            throw new Error("User not found")
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const changePassword = asyncHandler(async (req, res) => {
    try {

        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            res.status(400)
            throw new Error("Old password and new password are required.")
        }
        // Find user in DB
        const user = await User.findById(req.user._id)

        if (user && (await bcrypt.compare(oldPassword, user.password))) {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(newPassword, salt)
            user.password = hashedPassword
            await user.save()

            res.json({
                message: "Password changed succesfully."
            })
        }
        else {
            res.status(401)
            throw new Error("Invalid old Password")
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const getLikedMovies = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("likedMovies")
        if (user) {
            res.json({ listLiked: user.likedMovies, total: user.likedMovies.length })
        }
        else {
            res.status(404)
            throw new Error("User not found")
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const addLikedMovies = asyncHandler(async (req, res) => {
    const { movieId } = req.body
    try {
        const movie = await Movie.findById(movieId)
        const user = await User.findById(req.user._id)
        if (!user || !movie) {
            res.status(404)
            throw new Error("User or movie not found")
        }

        if (user.likedMovies.includes(movieId)) {
            res.status(400)
            throw new Error("Movie already liked")
        }

        user.likedMovies.push(movieId)
        movie.liked += 1

        await movie.save()
        await user.save()

        res.json({ message: "Like successfully", })

    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const removeLikedMovies = asyncHandler(async (req, res) => {
    try {
        const { movieId } = req.body
        const movie = await Movie.findById(movieId)
        const user = await User.findById(req.user._id)
        if (!user || !movie) {
            res.status(404)
            throw new Error("User or movie not found")
        }

        const index = user.likedMovies.indexOf(movieId);
        if (index == -1) {
            res.status(404)
            throw new Error('MovieId invalid');
        }

        user.likedMovies.splice(index, 1);
        movie.liked -= 1

        await user.save()
        await movie.save()

        const newUser = await User.findById(req.user._id).populate("likedMovies")

        res.json({ message: "Remove movie successfully.", listLiked: newUser.likedMovies })

    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})


// ADMIN

const getUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json({ users })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const getTotalUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json({ total: users.length })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body
    try {
        // Find user in DB
        const user = await User.findById(id)

        if (user) {
            if (user.isAdmin) {
                res.status(400)
                throw new Error("Can't delete admin user")
            }
            await User.deleteOne({ _id: id })
            const users = await User.find({})
            res.json({ users })
        }
        else {
            res.status(401)
            throw new Error("User not found")
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

export {
    registerUser,
    loginUser,
    updatedUser,
    updatedAvatar,
    getProfileUser,
    deleteUserProfile,
    changePassword,
    getLikedMovies,
    addLikedMovies,
    removeLikedMovies,
    getUsers,
    deleteUser,
    getTotalUsers
}

