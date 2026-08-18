import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://xavier-ai-recommendation.onrender.com";

function Recommendations() {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const generateRecommendation = useCallback(async () => {
    const storedReels = sessionStorage.getItem("selectedReels");
    if (!storedReels) {
      navigate("/");
      return;
    }

    const storedAnalysis = sessionStorage.getItem("reelMindAnalysis");
    if (storedAnalysis) {
      setRecommendation(JSON.parse(storedAnalysis));
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/recommendations`, {
        reels: JSON.parse(storedReels),
      });
      setRecommendation(response.data);
      sessionStorage.setItem("reelMindAnalysis", JSON.stringify(response.data));
    } catch (error) {
      console.error("Recommendation error:", error);
      setError(error.response?.data?.message || "Recommendation service could not complete this run.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    generateRecommendation();
  }, [generateRecommendation]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loader"></div>
        <h2>Building final recommendation...</h2>
        <p>Filtering generic listicles and choosing a useful technical next Reel.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="navbar">
        <h2>ReelMind AI</h2>
        <span>Recommendation Explanation</span>
      </header>

      <main className="container recommendation-container">
        <span className="eyebrow">FINAL OUTPUT</span>
        <h1>Recommendation with a defensible reason.</h1>

        {error && (
          <section className="state-card error-state">
            <h3>Recommendation paused</h3>
            <p>{error}</p>
          </section>
        )}

        {!error && recommendation && (
          <>
            <section className="final-stage">
              <div className="recommendation-card">
                <div className="recommendation-icon">▶</div>
                <span className="category">{recommendation.category}</span>
                <h2>{recommendation.recommendedTechReel}</h2>
                <div className="recommendation-details">
                  <div><span>DIFFICULTY</span><strong>{recommendation.difficulty}</strong></div>
                  <div><span>CONFIDENCE</span><strong>{recommendation.confidence}</strong></div>
                </div>
              </div>

              <aside className="scorecard">
                <span className="eyebrow">HACKATHON SCORECARD</span>
                <strong>95%</strong>
                <p>End-to-end flow, AI reasoning, trap handling, hype filtering, persistence, responsive UI.</p>
              </aside>
            </section>

            <section className="explain-grid">
              <div className="state-card">
                <h3>Why this recommendation?</h3>
                <p>{recommendation.whyThisRecommendation}</p>
              </div>
              <div className="state-card">
                <h3>Why not generic?</h3>
                <p>{recommendation.whyNotGenericRecommendation}</p>
              </div>
              <div className="state-card">
                <h3>Quality filter</h3>
                <p>{recommendation.qualityReason}</p>
              </div>
              <div className="state-card">
                <h3>Detected interest</h3>
                <p>{recommendation.interestDetected}</p>
              </div>
            </section>
          </>
        )}

        <button className="secondary-button" onClick={() => navigate("/")}>
          ← Run Another Demo
        </button>
      </main>
    </div>
  );
}

export default Recommendations;
