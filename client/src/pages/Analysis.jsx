import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://xavier-ai-recommendation.onrender.com";

function Analysis() {
  const [reels] = useState(() => {
    const storedReels = sessionStorage.getItem("selectedReels");
    return storedReels ? JSON.parse(storedReels) : [];
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const analyzeInterests = useCallback(async (selectedReels) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/reels/analyze`, {
        reels: selectedReels,
      });
      setAnalysis(response.data);
      sessionStorage.setItem("reelMindAnalysis", JSON.stringify(response.data));
    } catch (error) {
      console.error("Analysis error:", error);
      setError(error.response?.data?.message || "The analysis service could not complete this run.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (reels.length === 0) {
      navigate("/");
      return;
    }
    analyzeInterests(reels);
  }, [analyzeInterests, navigate, reels]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loader"></div>
        <h2>Running one multi-Reel AI analysis...</h2>
        <p>Groq is combining behavior, content, skips, saves, and hype signals.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="navbar">
        <h2>ReelMind AI</h2>
        <span>AI Analysis</span>
      </header>

      <main className="container">
        <div className="analysis-header">
          <span className="eyebrow">AI ANALYSIS</span>
          <h1>The model found the broader interest, not the keyword.</h1>
        </div>

        <section className="analysis-card">
          <h3>REELS ANALYZED TOGETHER</h3>
          <div className="analyzed-reels">
            {reels.map((reel) => (
              <span key={reel._id}>{reel.title}</span>
            ))}
          </div>
        </section>

        {error && (
          <section className="state-card error-state">
            <h3>Analysis paused</h3>
            <p>{error}</p>
            <button className="secondary-button" onClick={() => navigate("/")}>Back to simulator</button>
          </section>
        )}

        {!error && analysis && (
          <>
            <section className="insight-hero">
              <div>
                <span className="eyebrow">INTEREST DETECTED</span>
                <h1>{analysis.interestDetected}</h1>
                <p>{analysis.interestSummary}</p>
              </div>
              <div className="score-orbit">
                <strong>{analysis.confidence}</strong>
                <span>confidence</span>
              </div>
            </section>

            <section className="analysis-layout">
              <div className="interest-card">
                <h3>INTEREST PROFILE</h3>
                <div className="profile-grid">
                  {analysis.interestProfile?.map((item) => (
                    <div key={item.interest || item.name} className="profile-row">
                      <div>
                        <strong>{item.interest || item.name}</strong>
                        <span>{Math.round((item.score || 0) * 100)}%</span>
                      </div>
                      <div className="meter">
                        <span style={{ width: `${Math.round((item.score || 0) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="interest-card">
                <h3>WHY THIS IS ADVANCED</h3>
                <p>{analysis.why}</p>
                <div className="proof-grid">
                  <div><strong>Not Java</strong><span>Trap resolves to Software Engineering / Technology</span></div>
                  <div><strong>Not hype</strong><span>Listicles are filtered before recommendation</span></div>
                  <div><strong>Behavioral</strong><span>Watch depth, likes, saves, skips become signal strength</span></div>
                </div>
              </div>
            </section>

            <section className="interest-card">
              <h3>MODEL SIGNALS</h3>
              <div className="signal-list">
                {analysis.signals?.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>
            </section>
          </>
        )}

        {!error && (
          <button className="primary-button" onClick={() => navigate("/recommendations")}>
            Show Final Recommendation →
          </button>
        )}
      </main>
    </div>
  );
}

export default Analysis;
