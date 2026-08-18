import "dotenv/config";
import Groq from "groq-sdk";

const getGroqClient = () => new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Helper to sanitize hype content
const containsHype = (text) => {
    if (!text) return false;
    const hypePatterns = [
        /10\s+ai\s+tools/i,
        /get a job in \d+\s+days?/i,
        /become\s+rich\s+with\s+ai/i,
        /get\s+rich\s+quick/i,
        /earn\s+\$?\d+[kKmM]?\s+fast/i,
    ];
    return hypePatterns.some((p) => p.test(text));
};

export const analyzeReelsWithAI = async (reels) => {
    if (!process.env.GROQ_API_KEY) {
        console.warn("GROQ_API_KEY missing. Using heuristic analysis.");
        return buildHeuristicAnalysis(reels);
    }

    // Build a detailed reel block with interaction signals (if present)
    const reelData = reels
        .map((reel, index) => {
            const watch = reel.watchPercent ?? reel.watch ?? 100;
            const liked = !!reel.liked;
            const saved = !!reel.saved;
            const skipped = !!reel.skipped;

            // simple signal array for transparency
            const signals = [];
            signals.push(`watchPercent:${watch}`);
            if (liked) signals.push("liked");
            if (saved) signals.push("saved");
            if (skipped) signals.push("skipped");

            return `${index + 1}. Title: ${reel.title}
Description: ${reel.description}
Category: ${reel.category}
Signals: ${signals.join(", ")}`;
        })
        .join("\n\n");

    const prompt = `You are an assistant that MUST return strict JSON only (no prose outside JSON).\n\n` +
        `Task:\n` +
        `1) Read the list of watched Reels and their interaction signals. Analyze them together to infer the user's broader interest (not just keyword frequency).\n` +
        `Important trap: if selected reels include Java Meme, Coding Interview Joke, Software Engineer Lifestyle, and Laptop Comparison, infer "Software Engineering / Technology", not "Java" and not another Java meme.\n` +
        `2) Produce an interest profile array with scored interests (0-1) derived from interaction signals and content. Also provide "signals" — short evidences from reels.\n` +
        `3) Provide one specific recommended technical Reel title (fictional but specific), its category, difficulty (Beginner/Intermediate/Advanced), and a concise reason.\n` +
        `4) Explain why a generic/hype recommendation ("10 AI tools" etc.) was avoided. If any input reel contains hype-style content, flag it and ignore it for recommendation reasoning.\n\n` +
        `Input Reels:\n\n${reelData}\n\n` +
        `Return valid JSON ONLY in the exact shape below (fill values):\n\n` +
        `{
  "interestDetected": "",
  "interestSummary": "",
  "why": "",
  "signals": [],
  "interestProfile": [],
  "recommendedTechReel": "",
  "category": "",
  "whyThisRecommendation": "",
  "whyNotGenericRecommendation": "",
  "difficulty": "",
  "confidence": "",
  "qualityReason": ""
}
`;

    try {
        const completion = await getGroqClient().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.15,
            max_tokens: 1000,
        });

        const raw = completion.choices[0].message.content;

        // Try to parse; if parsing fails, attempt to extract JSON block
        let parsed = null;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            // Attempt to find first { ... } block
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    parsed = JSON.parse(match[0]);
                } catch (e) {
                    console.error('Failed to parse AI result:', e.message);
                    throw new Error('Invalid AI response');
                }
            } else {
                console.error('No JSON found in AI response');
                throw new Error('Invalid AI response');
            }
        }

        // Post-process: ensure fields exist and simple hype filtering
        if (Array.isArray(parsed.signals) === false) parsed.signals = [];
        if (Array.isArray(parsed.interestProfile) === false) parsed.interestProfile = [];

        // If any input reel looks like hype, add a note
        const foundHype = reels.some(r => containsHype(r.title || '') || containsHype(r.description || ''));
        if (foundHype) {
            parsed.qualityReason = (parsed.qualityReason || '') + ' Some input reels contained hype/generic content and were downweighted.';
        }

        return parsed;
    } catch (err) {
        console.warn('Groq AI failed, falling back to heuristic analysis:', err.message);

        return buildHeuristicAnalysis(reels);
    }
};

const interactionStrength = (reel) => {
    const watch = Number(reel.watchPercent ?? reel.watch ?? 100);
    const score = (watch / 100) * 0.55 + (reel.liked ? 0.2 : 0) + (reel.saved ? 0.25 : 0) - (reel.skipped ? 0.45 : 0);
    return Math.max(0, Math.min(1, Number(score.toFixed(2))));
};

const buildHeuristicAnalysis = (reels) => {
    const foundHype = reels.some(r => containsHype(r.title || '') || containsHype(r.description || ''));
    const weighted = {};
    const signals = reels.map((r) => {
        const strength = interactionStrength(r);
        const text = `${r.title} ${r.description} ${r.category}`.toLowerCase();
        const add = (name, amount) => {
            weighted[name] = (weighted[name] || 0) + amount * strength;
        };

        if (!containsHype(text)) {
            if (/java|coding|interview|software|engineer|developer|laptop|debug|api|react|node|hashmap/.test(text)) add("Software Engineering / Technology", 1);
            if (/hashmap|data|algorithm|interview/.test(text)) add("Data Structures and Interviews", 0.65);
            if (/react|frontend|state|effect/.test(text)) add("Frontend Engineering", 0.55);
            if (/node|api|express|mongo|backend/.test(text)) add("Backend Engineering", 0.55);
            if (/debug|tools|laptop|workflow/.test(text)) add("Developer Tools and Workflow", 0.5);
            if (/career|lifestyle|standup|review/.test(text)) add("Engineering Career", 0.45);
        }

        const actions = [`watched ${r.watchPercent ?? 100}%`];
        if (r.liked) actions.push("liked");
        if (r.saved) actions.push("saved");
        if (r.skipped) actions.push("skipped/downweighted");
        return `${r.title}: ${actions.join(", ")}; strength ${strength}`;
    });

    if (!Object.keys(weighted).length) weighted["General Learning"] = 0.45;
    const max = Math.max(...Object.values(weighted), 1);
    const interestProfile = Object.entries(weighted)
        .map(([interest, value]) => ({ interest, score: Number(Math.min(1, value / max).toFixed(2)) }))
        .sort((a, b) => b.score - a.score);

    const top = interestProfile[0]?.interest || "General Learning";
    const isTech = top.includes("Software Engineering") || interestProfile.some(i => i.interest.includes("Backend") || i.interest.includes("Frontend"));

    return {
        interestDetected: isTech ? "Software Engineering / Technology" : top,
        interestSummary: isTech
            ? "Your interactions point to a broader software engineering interest across coding humor, interviews, developer lifestyle, tools, and practical engineering topics."
            : `Your strongest pattern is ${top}.`,
        why: `The model combined all selected reels and interaction strength instead of matching one title. ${signals.join(" | ")}`,
        signals,
        interestProfile,
        recommendedTechReel: isTech ? "System Design Basics: Turning Features into Reliable APIs" : "How to Learn a Technical Topic Without Hype",
        category: isTech ? "System Design" : "Learning Strategy",
        whyThisRecommendation: isTech
            ? "It follows the broader software engineering pattern without overfitting to Java; it connects interviews, APIs, debugging, and developer workflow into a useful next step."
            : "It favors a concrete learning path over generic content.",
        whyNotGenericRecommendation: foundHype
            ? "A hype/listicle reel was detected and downweighted, so the recommendation avoids shortcut promises like '10 AI tools to get a job'."
            : "Generic listicles were avoided because the selected signals support a more specific technical recommendation.",
        difficulty: isTech ? "Intermediate" : "Beginner",
        confidence: interestProfile[0]?.score >= 0.75 ? "High" : "Medium",
        qualityReason: foundHype ? "Hype content present and downweighted." : "Recommendation is based on durable skill signals rather than trend keywords.",
    };
};
