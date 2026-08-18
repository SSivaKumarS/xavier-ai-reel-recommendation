import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema({
  interestDetected: String,
  interestSummary: String,
  why: String,
  signals: Array,
  interestProfile: Array,
  recommendedTechReel: String,
  category: String,
  whyThisRecommendation: String,
  whyNotGenericRecommendation: String,
  difficulty: String,
  confidence: String,
  qualityReason: String,
  rawReels: Array,
}, { timestamps: true });

const Recommendation = mongoose.model("Recommendation", recommendationSchema);

export default Recommendation;