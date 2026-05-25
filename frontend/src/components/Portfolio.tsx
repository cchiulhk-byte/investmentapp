import React, { useState, useEffect } from "react";
import { api } from "../api";

interface Holding {
  symbol: string;
  name: string;
  category: string;
  quantity: number;
  avg_buy_price: number;
  drip_enabled: number;
  staked_quantity: number;
  current_price: number;
  market_value: number;
  currency: string;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
}

interface PortfolioProps {
  portfolio: {
    cash: { usd_cash: number; hkd_cash: number };
    holdings: Holding[];
    valuation: {
      holdings_value_usd: number;
      holdings_value_hkd: number;
      net_worth_usd: number;
      net_worth_hkd: number;
    };
  };
  refreshPortfolio: () => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ portfolio, refreshPortfolio }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Crypto Staking State
  const [stakeSymbol, setStakeSymbol] = useState<"ETH" | "SOL">("ETH");
  const [stakeAction, setStakeAction] = useState<"STAKE" | "UNSTAKE">("STAKE");
  const [stakeQty, setStakeQty] = useState<number>(1);
  const [stakingFeedback, setStakingFeedback] = useState<string | null>(null);
  const [stakingLoading, setStakingLoading] = useState<boolean>(false);

  // Load transactions list
  const loadTransactions = async () => {
    try {
      const tx = await api.getTransactions();
      setTransactions(tx);
    } catch (e) {
      console.error("Error loading transactions:", e);
    }
  };

  useEffect(() => {
    loadTransactions();
    
    // Auto-update transactions list occasionally
    const interval = setInterval(loadTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle DRIP toggle
  const handleDripToggle = async (symbol: string, currentStatus: boolean) => {
    try {
      await api.toggleDrip(symbol, !currentStatus);
      refreshPortfolio();
    } catch (err: any) {
      alert("Failed to toggle DRIP: " + err.message);
    }
  };

  // Handle Crypto Staking
  const handleStakingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStakingFeedback(null);
    setStakingLoading(true);
    
    try {
      const resp = await api.manageStaking(stakeSymbol, stakeAction, stakeQty);
      setStakingFeedback(`[✓] ${resp.message}`);
      refreshPortfolio();
      loadTransactions();
    } catch (err: any) {
      setStakingFeedback(`[-] Staking Error: ${err.message}`);
    } finally {
      setStakingLoading(false);
    }
  };

  const cash = portfolio.cash;
  const valuation = portfolio.valuation;
  const holdings = portfolio.holdings;

  // Staking details from active holdings
  const getCryptoStakingInfo = (sym: "ETH" | "SOL") => {
    const holding = holdings.find((h) => h.symbol === sym);
    return {
      unstaked: holding ? holding.quantity : 0,
      staked: holding ? holding.staked_quantity : 0,
      apy: sym === "ETH" ? 4.2 : 6.5,
    };
  };

  const selectedStakingInfo = getCryptoStakingInfo(stakeSymbol);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* 1. PORTFOLIO NET WORTH SUMMARY CARD */}
      <div className="info-grid">
        <div className="premium-card info-item" style={{ borderLeft: "4px solid var(--color-accent)" }}>
          <div className="info-item-label">Net Worth (USD Base)</div>
          <div className="info-item-value">${valuation.net_worth_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            HKD Equiv: ${valuation.net_worth_hkd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="premium-card info-item" style={{ borderLeft: "4px solid var(--color-up)" }}>
          <div className="info-item-label">Invested Valuation</div>
          <div className="info-item-value">${valuation.holdings_value_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Allocation: {((valuation.holdings_value_usd / valuation.net_worth_usd) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="premium-card info-item">
          <div className="info-item-label">USD Cash Balance</div>
          <div className="info-item-value" style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem" }}>
            ${cash.usd_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Cash Reserve USD
          </div>
        </div>

        <div className="premium-card info-item">
          <div className="info-item-label">HKD Cash Balance</div>
          <div className="info-item-value" style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem" }}>
            ${cash.hkd_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Cash Reserve HKD
          </div>
        </div>
      </div>

      {/* 2. HOLDINGS LEDGER SECTION */}
      <div className="premium-card">
        <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Asset Holdings & DRIP Status</h3>
        
        {holdings.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-muted)" }}>
            Your portfolio is currently 100% Cash. Head over to the Trading Terminal to build a position!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--color-text-secondary)" }}>
                  <th style={{ padding: "12px 8px" }}>Asset Name</th>
                  <th style={{ padding: "12px 8px" }}>Symbol</th>
                  <th style={{ padding: "12px 8px" }}>Position Qty</th>
                  <th style={{ padding: "12px 8px" }}>Avg Buy Price</th>
                  <th style={{ padding: "12px 8px" }}>Current Market Price</th>
                  <th style={{ padding: "12px 8px" }}>Market Valuation</th>
                  <th style={{ padding: "12px 8px" }}>Unrealized Gain/Loss</th>
                  <th style={{ padding: "12px 8px" }}>Auto-DRIP</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const isGain = h.unrealized_pnl >= 0;
                  const showDripToggle = h.category === "HK_STOCK" || h.category === "US_STOCK";
                  const totalQuantity = h.quantity + h.staked_quantity;
                  
                  return (
                    <tr key={h.symbol} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.2s" }} className="table-row-hover">
                      <td style={{ padding: "14px 8px", fontWeight: "600" }}>{h.name}</td>
                      <td style={{ padding: "14px 8px", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                        <span className="bg-up-pill" style={{ color: "var(--color-text-primary)", backgroundColor: "var(--border-subtle)", padding: "2px 6px" }}>{h.symbol}</span>
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        {totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 5 })}
                        {h.staked_quantity > 0 && (
                          <div style={{ fontSize: "0.7rem", color: "var(--color-accent)" }}>
                            ({h.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })} tradeable / {h.staked_quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })} staked)
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 8px", fontFamily: "var(--font-mono)" }}>
                        {h.avg_buy_price.toFixed(2)} {h.currency}
                      </td>
                      <td style={{ padding: "14px 8px", fontFamily: "var(--font-mono)" }}>
                        {h.current_price.toFixed(2)} {h.currency}
                      </td>
                      <td style={{ padding: "14px 8px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>
                        {h.market_value.toLocaleString()} {h.currency}
                      </td>
                      <td style={{ padding: "14px 8px", fontWeight: "700" }} className={isGain ? "text-up" : "text-down"}>
                        {isGain ? "+" : ""}{h.unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })} {h.currency}
                        <div style={{ fontSize: "0.75rem", fontWeight: "600" }}>
                          ({isGain ? "+" : ""}{h.unrealized_pnl_pct}%)
                        </div>
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        {showDripToggle ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={h.drip_enabled === 1}
                                onChange={() => handleDripToggle(h.symbol, h.drip_enabled === 1)}
                              />
                              <span className="slider"></span>
                            </label>
                            <span style={{ fontSize: "0.75rem", color: h.drip_enabled === 1 ? "var(--color-up)" : "var(--color-text-muted)", fontWeight: "600" }}>
                              {h.drip_enabled === 1 ? "ON" : "OFF"}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                            Not applicable
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "20px" }}>
        
        {/* 3. CRYPTO STAKING CENTER */}
        <div className="premium-card" style={{ height: "fit-content" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "var(--color-accent)" }}>Crypto Staking Hub</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
            Delegate holdings to Proof-of-Stake network validators to generate recurring rewards.
          </p>

          <form onSubmit={handleStakingSubmit}>
            
            {/* Token Selector */}
            <div className="form-group">
              <label>Select Staking Network</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setStakeSymbol("ETH")}
                  className={`nav-item ${stakeSymbol === "ETH" ? "active" : ""}`}
                  style={{ flex: 1, justifyContent: "center", border: "1px solid var(--border-subtle)" }}
                >
                  Ethereum (4.2% APY)
                </button>
                <button
                  type="button"
                  onClick={() => setStakeSymbol("SOL")}
                  className={`nav-item ${stakeSymbol === "SOL" ? "active" : ""}`}
                  style={{ flex: 1, justifyContent: "center", border: "1px solid var(--border-subtle)" }}
                >
                  Solana (6.5% APY)
                </button>
              </div>
            </div>

            {/* Action Select Staking or Unstaking */}
            <div className="form-group">
              <label>Direction</label>
              <div style={{ display: "flex", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "2px", backgroundColor: "rgba(0,0,0,0.2)" }}>
                <button
                  type="button"
                  onClick={() => setStakeAction("STAKE")}
                  style={{
                    flex: 1, border: "none", cursor: "pointer", borderRadius: "4px", padding: "6px",
                    backgroundColor: stakeAction === "STAKE" ? "var(--color-accent)" : "transparent",
                    color: "#fff", fontWeight: "600", fontSize: "0.8rem"
                  }}
                >
                  STAKE (Lock yield)
                </button>
                <button
                  type="button"
                  onClick={() => setStakeAction("UNSTAKE")}
                  style={{
                    flex: 1, border: "none", cursor: "pointer", borderRadius: "4px", padding: "6px",
                    backgroundColor: stakeAction === "UNSTAKE" ? "var(--color-accent)" : "transparent",
                    color: "#fff", fontWeight: "600", fontSize: "0.8rem"
                  }}
                >
                  UNSTAKE (Release coins)
                </button>
              </div>
            </div>

            {/* Staking quantities details box */}
            <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "10px", marginBottom: "14px", fontSize: "0.78rem" }}>
              <div className="flex-between" style={{ marginBottom: "3px" }}>
                <span>Unstaked liquid wallet:</span>
                <span style={{ fontWeight: "700" }}>{selectedStakingInfo.unstaked.toLocaleString()} {stakeSymbol}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: "3px" }}>
                <span>Locked in staking:</span>
                <span style={{ fontWeight: "700", color: "var(--color-accent)" }}>{selectedStakingInfo.staked.toLocaleString()} {stakeSymbol}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label>Amount to stake/unstake</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                className="form-control"
                value={stakeQty}
                onChange={(e) => setStakeQty(Number(e.target.value))}
                required
              />
            </div>

            {/* Submit btn */}
            <button
              type="submit"
              disabled={stakingLoading}
              className="btn-primary"
              style={{ width: "100%", padding: "10px", fontSize: "0.9rem" }}
            >
              {stakingLoading ? "Processing transaction..." : `${stakeAction} ${stakeSymbol}`}
            </button>
          </form>

          {/* Staking Feedback message */}
          {stakingFeedback && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.78rem",
                border: "1px solid",
                backgroundColor: stakingFeedback.startsWith("[✓]") ? "var(--color-up-bg)" : "var(--color-down-bg)",
                borderColor: stakingFeedback.startsWith("[✓]") ? "var(--color-up)" : "var(--color-down)",
                color: stakingFeedback.startsWith("[✓]") ? "var(--color-up)" : "var(--color-down)"
              }}
            >
              {stakingFeedback}
            </div>
          )}

        </div>

        {/* 4. TRANSACTION LOGS LEDGER */}
        <div className="premium-card" style={{ display: "flex", flexDirection: "column", height: "450px" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "14px" }}>Transaction Ledger & Income Journal</h3>
          
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
            {transactions.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                Your transaction ledger is empty. Complete a trade or accrue staking yields to write records!
              </div>
            ) : (
              transactions.map((tx) => {
                const isBuy = tx.side === "BUY" || tx.side === "STAKE";
                const isSell = tx.side === "SELL" || tx.side === "UNSTAKE";
                const isIncome = tx.side.startsWith("DIVIDEND") || tx.side === "STAKING_REWARD";
                
                let badgeColor = "var(--border-subtle)";
                let badgeText = tx.side;
                
                if (isBuy) {
                  badgeColor = "rgba(59, 130, 246, 0.15)";
                } else if (isSell) {
                  badgeColor = "rgba(239, 68, 68, 0.15)";
                } else if (isIncome) {
                  badgeColor = "rgba(16, 185, 129, 0.15)";
                }
                
                const date = new Date(tx.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <div
                    key={tx.id}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "rgba(255,255,255,0.01)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "0.68rem", fontWeight: "700", padding: "1px 6px", borderRadius: "3px",
                            backgroundColor: badgeColor,
                            color: isBuy ? "var(--color-accent)" : (isSell ? "var(--color-down)" : "var(--color-up)")
                          }}
                        >
                          {badgeText}
                        </span>
                        <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>{tx.symbol}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                        {tx.description}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                        {tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })} units @ {tx.price.toFixed(2)} {tx.currency}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                        {timeStr}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
