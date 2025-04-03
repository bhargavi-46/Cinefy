import mongoose from "mongoose";

const favSchema = new mongoose.Schema({
    Content_id: {
        type: String,
        required: true,
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    premium: {
        type: Boolean,
        required: true,
        default: false,
    },
    premiumStartDate: {
        type: Date,
        default: null,
    },
    premiumEndDate: {
        type: Date,
        default: null,
    },
    fav: [favSchema],
});

// Export User model
export default mongoose.models.User || mongoose.model("User", userSchema);
