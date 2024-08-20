import express from "express";
import multer from "multer";
import { registerUser, loginUser, updatedUser, deleteUserProfile, changePassword, getLikedMovies, addLikedMovies, removeLikedMovies, getUsers, deleteUser, updatedAvatar, getProfileUser, getTotalUsers } from "../controllers/user.js";
import { protect, admin } from "../middlewares/auth.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });


const router = express.Router()

// Public routes
router.post("/", registerUser);
router.post("/login", loginUser);

// Private routes
router.patch("/", protect, updatedUser)
router.get("/profile", protect, getProfileUser)
router.patch("/avatar", protect, upload.single("avatar"), updatedAvatar)
router.delete("/", protect, deleteUserProfile)
router.patch("/password", protect, changePassword)

router.get("/likes", protect, getLikedMovies)
router.post("/like", protect, addLikedMovies)
// router.delete("/favorites", protect, deleteLikedMovies)
router.patch("/like", protect, removeLikedMovies)

// Admin routes
router.get("/", protect, admin, getUsers)
router.get("/total", protect, admin, getTotalUsers)
router.delete("/delete", protect, admin, deleteUser)

export default router
