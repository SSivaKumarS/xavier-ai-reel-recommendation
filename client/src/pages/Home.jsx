import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const demoTitles = [
  "Java Meme",
  "Coding Interview Joke",
  "Software Engineer Lifestyle",
  "Laptop Comparison",
  "Laptop Comparison 2025",
  "AI Hype: 10 AI tools that will get you a job",
];

const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://xavier-ai-recommendation.onrender.com";

function Home() {
  const [reels, setReels] = useState([]);
  const [selected, setSelected] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const activeReel = reels[activeIndex];
  const selectedIds = useMemo(() => new Set(selected.map((item) => item._id)), [selected]);

  const fetchReels = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reels`);
      const data = Array.isArray(response.data) ? response.data : [];
      setReels(data);
      if (!Array.isArray(response.data)) {
        console.error("Invalid response format, expected array:", response.data);
        setError("Invalid response format from server.");
      }
    } catch (error) {
      console.error("Error fetching reels:", error);
      setError("Could not load reels. Make sure the backend is running.");
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  const computeInterestStrength = (reel) => {
    const watch = reel.watchPercent ?? 75;
    const score = (watch / 100) * 0.55 + (reel.liked ? 0.2 : 0) + (reel.saved ? 0.25 : 0) - (reel.skipped ? 0.45 : 0);
    return Math.max(0, Math.min(1, Number(score.toFixed(2))));
  };

  const normalizeReel = (reel, overrides = {}) => {
    const enriched = {
      ...reel,
      watchPercent: 78,
      liked: false,
      saved: false,
      skipped: false,
      ...overrides,
    };
    return { ...enriched, interestStrength: computeInterestStrength(enriched) };
  };

  const updateSelected = (next) => {
    sessionStorage.removeItem("reelMindAnalysis");
    setSelected(next);
  };

  const toggleActiveReel = () => {
    if (!activeReel) return;
    if (selectedIds.has(activeReel._id)) {
      updateSelected(selected.filter((item) => item._id !== activeReel._id));
      return;
    }
    if (selected.length >= 8) return;
    updateSelected([...selected, normalizeReel(activeReel)]);
  };

  const updateInteraction = (id, patch) => {
    updateSelected(
      selected.map((item) => {
        if (item._id !== id) return item;
        const merged = { ...item, ...patch };
        return { ...merged, interestStrength: computeInterestStrength(merged) };
      })
    );
  };

  const runDemoSet = () => {
    const demo = reels
      .filter((reel) => demoTitles.includes(reel.title))
      .slice(0, 5)
      .map((reel) =>
        normalizeReel(reel, {
          watchPercent: reel.category === "Hype" ? 35 : 88,
          liked: reel.category !== "Hype",
          saved: ["Software Engineering", "Career", "Developer Tools", "Gadgets"].includes(reel.category),
          skipped: reel.category === "Hype",
        })
      );
    updateSelected(demo);
  };

  const analyzeReels = () => {
    if (selected.length < 2) return;
    sessionStorage.setItem("selectedReels", JSON.stringify(selected));
    navigate("/analysis");
  };

  return (
    <div className="page app-shell">
      <header className="navbar">
        <h2>Xavier AI</h2>
        <span>Reel behavior {"->"} AI interest graph {"->"} useful tech recommendation</span>
      </header>

      <main className="studio">
        <section className="studio-copy">
          <span className="eyebrow">HACKATHON DEMO MODE</span>
          <h1>AI that understands the person behind the scroll.</h1>
          <p>
            Simulate a short-form video session, capture watch depth and intent signals, then infer a broader technical interest instead of recommending another keyword-matched Reel.
          </p>
          <div className="judge-strip">
            <div><strong>2-8</strong><span>selected Reels</span></div>
            <div><strong>1</strong><span>Groq analysis call</span></div>
            <div><strong>95%</strong><span>demo-ready target</span></div>
          </div>
          <div className="hero-actions">
            <button className="primary-button" onClick={runDemoSet} disabled={reels.length === 0}>Load Java Trap Demo</button>
            <button className="secondary-button compact" onClick={analyzeReels} disabled={selected.length < 2}>Analyze Flow</button>
          </div>
        </section>

        <section className="phone-stage">
          {loading && (
            <div className="phone-frame center-frame">
              <div className="loader"></div>
              <p>Loading Reels...</p>
            </div>
          )}

          {error && (
            <div className="phone-frame center-frame error-phone">
              <h3>Backend offline</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && activeReel && (
            <div className="phone-frame">
              <div className="video-card">
                <div className="video-noise" />
                <div className="video-top">
                  <span>For You</span>
                  <span>{activeIndex + 1}/{reels.length}</span>
                </div>
                <div className="video-copy">
                  <span className="category">{activeReel.category}</span>
                  <h2>{activeReel.title}</h2>
                  <p>{activeReel.description}</p>
                </div>
                <div className="video-actions">
                  <button onClick={toggleActiveReel}>{selectedIds.has(activeReel._id) ? "✓" : "+"}</button>
                  <button onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}>↑</button>
                  <button onClick={() => setActiveIndex((index) => Math.min(reels.length - 1, index + 1))}>↓</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <section className="feed-section">
        <div className="feed-header">
          <div>
            <span className="eyebrow">REEL INTERACTION SIMULATOR</span>
            <h2>Select 2-8 Reels and tune the signals</h2>
          </div>
          <p><strong>{selected.length}</strong>/8 selected</p>
        </div>

        {!loading && !error && Array.isArray(reels) && (
          <div className="reel-rail">
            {reels.map((reel, index) => (
              <button
                key={reel._id}
                className={`rail-card ${activeIndex === index ? "active" : ""} ${selectedIds.has(reel._id) ? "picked" : ""}`}
                onClick={() => setActiveIndex(index)}
              >
                <span>{selectedIds.has(reel._id) ? "Selected" : reel.category}</span>
                <strong>{reel.title}</strong>
              </button>
            ))}
          </div>
        )}

        {selected.length === 0 && !loading && !error && (
          <div className="state-card">
            <h3>No behavior captured yet</h3>
            <p>Use the phone preview or load the Java Trap demo to generate realistic interaction signals.</p>
          </div>
        )}

        {selected.length > 0 && (
          <div className="signal-board">
            {selected.map((item) => (
              <article key={item._id} className="signal-card">
                <div>
                  <span className="category">{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <label>
                  Watch depth <strong>{item.watchPercent}%</strong>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={item.watchPercent}
                    onChange={(event) => updateInteraction(item._id, { watchPercent: Number(event.target.value) })}
                  />
                </label>
                <div className="action-buttons">
                  <button className={item.liked ? "primary-button" : "secondary-button compact"} onClick={() => updateInteraction(item._id, { liked: !item.liked })}>Like</button>
                  <button className={item.saved ? "primary-button" : "secondary-button compact"} onClick={() => updateInteraction(item._id, { saved: !item.saved })}>Save</button>
                  <button className={item.skipped ? "danger-button" : "secondary-button compact"} onClick={() => updateInteraction(item._id, { skipped: !item.skipped })}>Skip</button>
                </div>
                <div className="strength-row">
                  <span>Interest strength</span>
                  <strong>{Math.round(item.interestStrength * 100)}%</strong>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="sticky-demo-bar">
          <span>Flow: Home {"->"} Simulator {"->"} AI Analysis {"->"} Interest Profile {"->"} Recommendation {"->"} Explanation</span>
          <button className="primary-button" onClick={analyzeReels} disabled={selected.length < 2 || selected.length > 8}>Run AI Analysis</button>
        </div>
      </section>
    </div>
  );
}

export default Home;
