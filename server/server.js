import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Reel from "./models/Reel.js";
import reelRoutes from "./routes/reelRoutes.js";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Backend Running" });
});

// Seed database with sample reels if empty
const seedReelsIfEmpty = async () => {
    try {
        const count = await Reel.countDocuments();
        if (count === 0) {
            const sample = [
                { title: "Java Meme", description: "A programmer jokes about Java boilerplate, JVM errors, and enterprise code.", category: "Developer Humor" },
                { title: "Coding Interview Joke", description: "Whiteboard anxiety, edge cases, and algorithm questions in interviews.", category: "Software Engineering" },
                { title: "Software Engineer Lifestyle", description: "A practical day with code reviews, debugging, standups, and focused build time.", category: "Career" },
                { title: "Laptop Comparison", description: "Choosing RAM, CPU, keyboard, battery, and ports for developer workflows.", category: "Developer Tools" },
                { title: "How HashMaps Work in 60s", description: "A visual explainer for keys, hashing, collisions, and lookup speed.", category: "Data Structures" },
                { title: "React State Mistakes", description: "Common useState and useEffect bugs in frontend apps.", category: "Frontend" },
                { title: "Deploying Node APIs", description: "Environment variables, routes, logs, and deployment checks for Express services.", category: "Backend" },
                { title: "Debugging Like a Senior Dev", description: "Reproducing bugs, reading traces, isolating causes, and fixing with confidence.", category: "Developer Tools" },
                { title: "Build a REST API", description: "Design routes, validate payloads, connect MongoDB, and return clean JSON.", category: "Backend" },
                { title: "AI Hype: 10 AI tools that will get you a job", description: "A flashy listicle promising shortcuts without explaining real skills.", category: "Hype" },
            ];

            await Reel.create(sample);
            console.log('Seeded sample reels');
        }
    } catch (e) {
        console.error('Seeding failed:', e.message);
    }
};

seedReelsIfEmpty();

app.use("/api/reels", reelRoutes);

// Provide legacy /api/recommendations endpoint to match client expectation
import { analyzeReelsWithAI } from './services/groqService.js';
import Recommendation from './models/Recommendation.js';

app.post('/api/recommendations', async (req, res) => {
    try {
        const { reels } = req.body;
        if (!Array.isArray(reels) || reels.length < 2 || reels.length > 8) {
            return res.status(400).json({ message: 'Select 2 to 8 reels for analysis' });
        }

        const analysis = await analyzeReelsWithAI(reels);

        try {
            await Recommendation.create({ ...analysis, rawReels: reels });
        } catch (e) {
            console.warn('Failed to persist recommendation:', e.message);
        }

        res.json(analysis);
    } catch (e) {
        console.error('recommendations error', e.message);
        res.status(500).json({ message: 'Failed to generate recommendation' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
