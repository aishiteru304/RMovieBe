import asyncHandler from "express-async-handler"
import Movie from '../models/movie.js'
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase.js";


const getMovies = asyncHandler(async (req, res) => {
    try {
        const { moviesName, page = 1 } = req.query;
        const pageSize = 8;
        const skip = (page - 1) * pageSize;
        const query = moviesName ? { name: { $regex: moviesName, $options: 'i' } } : {};

        const movies = await Movie.find(query)
            .skip(skip)
            .limit(pageSize);

        const totalMovies = await Movie.countDocuments(query);

        res.json({
            movies,
            currentPage: page,
            totalPages: Math.ceil(totalMovies / pageSize),
            totalMovies
        })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const getAllMovies = asyncHandler(async (req, res) => {
    try {
        const movies = await Movie.find({})
        res.json({ movies })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const getMovieById = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const movie = await Movie.findById(id).populate({
            path: 'reviews.userId',
            select: 'name image'
        })
        if (!movie) {
            res.status(401)
            throw new Error("Movie not found")
        }

        res.json({ movie })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const getMovieByCategory = asyncHandler(async (req, res) => {
    try {
        const category = req.params.category;
        const movies = category
            ? await Movie.find({ category }).limit(6)
            : await Movie.find({}).limit(6);

        res.json({ movies });

    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const getAllBanners = asyncHandler(async (req, res) => {
    try {
        const movies = await Movie.find({}).limit(3);
        res.json({ banner: movies })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const getPopularMovies = asyncHandler(async (req, res) => {
    try {
        const movies = await Movie.find({})
            .sort({ liked: -1 })
            .limit(8);
        res.json({ popularMovies: movies })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const getTopRateMovies = asyncHandler(async (req, res) => {
    try {
        const movies = await Movie.find({})
            .sort({ rate: -1 })
            .limit(8);
        res.json({ topRateMovies: movies })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const getTotalMovies = asyncHandler(async (req, res) => {
    try {
        const movies = await Movie.find({})
        const allCategories = movies.map(movie => movie.category)
        const uniqueCategories = [...new Set(allCategories)];
        res.json({ totalMovies: movies.length, totalCategories: uniqueCategories.length })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

const createMovieReview = asyncHandler(async (req, res) => {
    const { rating, comment, movieId } = req.body
    try {
        const movie = await Movie.findById(movieId)
        if (movie) {
            const alreadyReviewed = movie.reviews.find(
                (r) => r.userId.toString() === req.user._id.toString()
            )
            if (alreadyReviewed) {
                res.status(400)
                throw new Error("You already reviewed this movie")
            }
            const review = {
                userId: req.user._id,
                rating: Number(rating),
                comment,
            }
            movie.reviews.push(review)
            movie.rate = (movie.rate * movie.numberOfReviews + review.rating) / (movie.numberOfReviews + 1)
            movie.numberOfReviews += 1
            await movie.save()
            const newMovie = await Movie.findById(movieId).populate({
                path: 'reviews.userId',
                select: 'name image'
            })
            res.status(201).json({ movie: newMovie })
        }
        else {
            res.status(404)
            throw new Error("Movie not found")
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})


// ADMIN
const createMovie = asyncHandler(async (req, res) => {
    try {
        const { name, category, language, year } = req.body
        if (!name || !category || !language || !year) {
            res.status(400);
            throw new Error("Name, category, language and year are required.")
        }
        //  Create movie in DB
        const movie = await Movie.create({
            name,
            category,
            language,
            year: year,
        })
        // if movie created successfully send movie to client
        if (movie) res.status(201).json({ message: "Movie created successfully" })
        else {
            res.status(400);
            throw new Error("Invalid movie data")
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }

})

const uploadMovie = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const movie = await Movie.findById(id);

        if (!movie) {
            res.status(401)
            throw new Error("Movie not found")
        }
        // Ensure a file is uploaded
        const imageFile = req.files['image'] ? req.files['image'][0] : null;
        const videoFile = req.files['video'] ? req.files['video'][0] : null;
        const imageFiles = req.files['images'] || [];

        if (!imageFile || !videoFile || !imageFiles.length) {
            res.status(400);
            throw new Error("No file uploaded");
        }

        // Tải lên Firebase
        const uploadToFirebase = async (file, folder) => {
            const storageRef = ref(storage, `${folder}/${file.originalname}`);
            await uploadBytes(storageRef, file.buffer);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        };

        const image = await uploadToFirebase(imageFile, 'imageMovies');
        const video = await uploadToFirebase(videoFile, 'videosMovies');
        let casts = []

        for (const file of imageFiles) {
            const cast = await uploadToFirebase(file, 'castMovies');
            casts.push({ image: cast })
        }
        movie.image = image
        movie.video = video
        movie.casts = casts
        await movie.save()

        res.json({ message: 'Files uploaded successfully' });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

const removeMovie = asyncHandler(async (req, res) => {
    const { movieId } = req.body
    try {
        // Find movie in DB
        const movie = await Movie.findById(movieId)

        if (movie) {
            // await user.remove()
            await Movie.deleteOne({ _id: movieId })
            res.status(201).json({ message: "Movie deleted successfully" })
        }
        else {
            res.status(401)
            throw new Error("Movie not found")
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

export { getMovies, getAllMovies, createMovieReview, createMovie, removeMovie, uploadMovie, getTotalMovies, getAllBanners, getPopularMovies, getTopRateMovies, getMovieById, getMovieByCategory }
