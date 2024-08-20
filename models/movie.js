import mongoose from "mongoose";


const reviewSchema = mongoose.Schema({
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true })

const movieSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    liked: {
        type: Number,
        default: 0,
    },
    image: {
        type: String,
    },
    category: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
    },
    year: {
        type: String,
        required: true,
    },
    video: {
        type: String,
    },
    rate: {
        type: Number,
        default: 0,
    },
    numberOfReviews: {
        type: Number,
        default: 0,
    },
    reviews: [reviewSchema],
    casts: [
        {
            image: { type: String, required: true },
        }
    ],
}, { timestamps: true })

export default mongoose.model("Movie", movieSchema)