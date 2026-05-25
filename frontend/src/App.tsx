import React, { useState, useEffect } from "react";
import api from "./api";
import { Dashboard } from "./components/Dashboard";
import { Portfolio } from "./components/Portfolio";
import { PassiveIncome } from "./components/PassiveIncome";
import { Academy } from "./components/Academy";
import { CodePlayground } from "./components/CodePlayground";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"simulator" | "portfolio" | "passive" | "academy" | "playground">("simulator");
  const [prices, setPrices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>({
    cash: { usd_cash: 100000.0, hkd_cash: 800000.0 },
    holdings: [],
    valuation: { holdings_value_usd: 0, holdings_value_hkd: 0, net_worth_usd: 100000.0, net_worth_hkd: 800000.0 },
  });

  // Fetch live market data
  const refreshPrices = async () => {
    try {
      const livePrices = await api.getMarketPrices();
      setPrices(livePrices);
    } catch (e) {
      console.error("Failed to fetch simulated price feeds: ", e);
    }
  };

  // Fetch live portfolio data
  const refreshPortfolio = async () => {
    try {
      const port = await api.getPortfolio();
      setPortfolio(port);
    } catch (e) {
      console.error("Failed to fetch simulated portfolio valuation: ", e);
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshPrices();
    refreshPortfolio();

    // Fast-paced market price ticks: 1 second interval
    const pricesInterval = setInterval(refreshPrices, 1000);
    // Portfolios/metrics refresh: 3 seconds interval
    const portfolioInterval = setInterval(refreshPortfolio, 3000);

    return () => {
      clearInterval(pricesInterval);
      clearInterval(portfolioInterval);
    };
  }, []);

  return (
    <div className="app-container">
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">▲</div>
          <span className="logo-text">ApexInvest</span>
          <span style={{ fontSize: "0.65rem", verticalAlign: "middle", padding: "3px 8px", borderRadius: "9999px", backgroundColor: "rgba(59,130,246,0.1)", color: "var(--color-accent)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", border: "1px solid rgba(59,130,246,0.2)" }}>
            Sandbox v2
          </span>
        </div>

        {/* Global tab options */}
        <nav className="nav-links">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`nav-item ${activeTab === "simulator" ? "active" : ""}`}
          >
            📉 Trading Simulator
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`nav-item ${activeTab === "portfolio" ? "active" : ""}`}
          >
            💼 My Portfolio
          </button>
          <button
            onClick={() => setActiveTab("passive")}
            className={`nav-item ${activeTab === "passive" ? "active" : ""}`}
          >
            💸 Passive Income Hub
          </button>
          <button
            onClick={() => setActiveTab("academy")}
            className={`nav-item ${activeTab === "academy" ? "active" : ""}`}
          >
            🎓 Educational Academy
          </button>
          <button
            onClick={() => setActiveTab("playground")}
            className={`nav-item ${activeTab === "playground" ? "active" : ""}`}
          >
            🐍 Quant Playground
          </button>
        </nav>

        {/* Top-Right Portfolio Net Worth HUD */}
        <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ color: "var(--color-text-muted)", display: "block", fontSize: "0.75rem" }}>
              Net Worth (USD Base)
            </span>
            <span style={{ fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--color-up)" }}>
              ${portfolio.valuation.net_worth_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ display: "inline-block", width: "1px", height: "24px", backgroundColor: "var(--border-subtle)" }}></div>
          <div style={{ textAlign: "right" }}>
            <span style={{ color: "var(--color-text-muted)", display: "block", fontSize: "0.75rem" }}>
              Cash Reserves
            </span>
            <span style={{ fontWeight: "700", fontFamily: "var(--font-mono)" }}>
              ${portfolio.cash.usd_cash.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD / ${portfolio.cash.hkd_cash.toLocaleString(undefined, { maximumFractionDigits: 0 })} HKD
            </span>
          </div>
        </div>
      </header>

      {/* CORE PAGE VIEWER CONTAINER */}
      <main className="main-content">
        {activeTab === "simulator" && prices.length > 0 && (
          <Dashboard
            prices={prices}
            portfolio={portfolio}
            refreshPortfolio={refreshPortfolio}
          />
        )}
        {activeTab === "simulator" && prices.length === 0 && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid var(--border-subtle)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.88rem" }}>Connecting to live market simulation...</span>
          </div>
        )}
        {activeTab === "portfolio" && (
          <Portfolio
            portfolio={portfolio}
            refreshPortfolio={refreshPortfolio}
          />
        )}
        {activeTab === "passive" && (
          <PassiveIncome
            portfolio={portfolio}
          />
        )}
        {activeTab === "academy" && (
          <Academy />
        )}
        {activeTab === "playground" && (
          <CodePlayground />
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ padding: "18px 28px", borderTop: "1px solid var(--border-subtle)", textAlign: "center", fontSize: "0.72rem", color: "var(--color-text-muted)", backgroundColor: "rgba(5, 8, 16, 0.95)", letterSpacing: "0.01em" }}>
        <span>© 2026 ApexInvest Sandbox — Quantitative Investment Learning Platform. FastAPI + React + Python Simulation Engine.</span>
      </footer>
    </div>
  );
};
export default App;
