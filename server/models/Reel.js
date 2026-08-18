import mongoose from "mongoose";

const reelSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    // interaction fields (optional on stored reels, provided by client when analyzing)
    watchPercent: { type: Number, default: 100 },
    liked: { type: Boolean, default: false },
    saved: { type: Boolean, default: false },
    skipped: { type: Boolean, default: false },
    // computed signal strength (0-1)
    interestStrength: { type: Number, default: 0 },
}, { timestamps: true });

const Reel = mongoose.model("Reel", reelSchema);

export default Reel;