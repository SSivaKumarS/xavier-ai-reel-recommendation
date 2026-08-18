import express from "express";
import Reel from "../models/Reel.js";
import Recommendation from "../models/Recommendation.js";
import { analyzeReelsWithAI } from "../services/groqService.js";

const router = express.Router();

// GET /api/reels - return all reels from DB (with fallback to sample data if DB query fails)
router.get("/", async (req, res) => {
    try {
        const reels = await Reel.find().sort({ createdAt: 1 });
        res.json(reels);
    } catch (error) {
        console.error("Fetch reels error, returning fallback sample data:", error.message);
        const fallbackReels = [
            { _id: "6a83f6d5d96b92f5ebd3193b", title: "Java Meme", description: "A programmer jokes about Java boilerplate, JVM errors, and enterprise code.", category: "Developer Humor" },
            { _id: "6a83f6d5d96b92f5ebd3193c", title: "Coding Interview Joke", description: "Whiteboard anxiety, edge cases, and algorithm questions in interviews.", category: "Software Engineering" },
            { _id: "6a83f6d5d96b92f5ebd3193d", title: "Software Engineer Lifestyle", description: "A practical day with code reviews, debugging, standups, and focused build time.", category: "Career" },
            { _id: "6a83f6d5d96b92f5ebd3193e", title: "Laptop Comparison 2025", description: "Choosing RAM, CPU, keyboard, battery, and ports for developer workflows.", category: "Developer Tools" },
            { _id: "6a83f6d5d96b92f5ebd3193f", title: "How HashMaps Work in 60s", description: "A visual explainer for keys, hashing, collisions, and lookup speed.", category: "Data Structures" },
            { _id: "6a83f6d5d96b92f5ebd31940", title: "React State Mistakes", description: "Common useState and useEffect bugs in frontend apps.", category: "Frontend" },
            { _id: "6a83f6d5d96b92f5ebd31941", title: "Deploying Node APIs", description: "Environment variables, routes, logs, and deployment checks for Express services.", category: "Backend" },
            { _id: "6a83f6d5d96b92f5ebd31942", title: "Debugging Like a Senior Dev", description: "Reproducing bugs, reading traces, isolating causes, and fixing with confidence.", category: "Developer Tools" },
            { _id: "6a83f6d5d96b92f5ebd31943", title: "Build a REST API", description: "Design routes, validate payloads, connect MongoDB, and return clean JSON.", category: "Backend" },
            { _id: "6a83f6d5d96b92f5ebd31944", title: "AI Hype: 10 AI tools that will get you a job", description: "A flashy listicle promising shortcuts without explaining real skills.", category: "Hype" }
        ];
        res.json(fallbackReels);
    }
});

// POST /api/reels/analyze - analyze provided reels (keeps parity with existing client call)
router.post("/analyze", async (req, res) => {
    try {
        const { reels } = req.body;

        if (!Array.isArray(reels) || reels.length < 2 || reels.length > 8) {
            return res.status(400).json({
                message: "Select 2 to 8 reels for analysis",
            });
        }

        const result = await analyzeReelsWithAI(reels);

        res.json(result);
    } catch (error) {
        console.error("AI Analysis Error:", error);

        res.status(500).json({
            message: "Failed to analyze reels",
        });
    }
});

// POST /api/recommendations - returns full recommendation JSON and persists it
router.post("/recommendations", async (req, res) => {
    try {
        const { reels } = req.body;

        if (!Array.isArray(reels) || reels.length < 2 || reels.length > 8) {
            return res.status(400).json({ message: "Select 2 to 8 reels for analysis" });
        }

        const analysis = await analyzeReelsWithAI(reels);

        // persist recommendation for future analytics
        try {
            await Recommendation.create({
                ...analysis,
                rawReels: reels,
            });
        } catch (e) {
            console.warn('Failed to persist recommendation:', e.message);
        }

        res.json(analysis);
    } catch (error) {
        console.error("Recommendation error:", error);
        res.status(500).json({ message: "Failed to generate recommendation" });
    }
});

export default router;
