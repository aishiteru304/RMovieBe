import express from "express";
import multer from "multer";
import { createMovie, getAllMovies, createMovieReview, removeMovie, getMovies, uploadMovie, getTotalMovies, getAllBanners, getPopularMovies, getTopRateMovies, getMovieById, getMovieByCategory } from "../controllers/movie.js";
import { protect, admin } from "../middlewares/auth.js";


const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router()

// // Public routes
// router.get("/import", importMovie);
router.get("/", getMovies);
router.get("/banner", getAllBanners);
router.get("/popular", getPopularMovies);
router.get("/toprate", getTopRateMovies);
router.get("/:id", getMovieById);
router.get("/category/:category", getMovieByCategory);
router.post("/reviews", protect, createMovieReview);

// // Admin routes
router.post("/", protect, admin, createMovie);
router.patch("/upload/:id", protect, admin, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'images', maxCount: 10 }]), uploadMovie)
router.get("/all", protect, admin, getAllMovies);
router.get("/total", protect, admin, getTotalMovies);

// router.put("/", protect, admin, removeMovie);

export default router
