import React, { useState, useEffect } from "react";
import { api } from "../api";
import { TradingChart } from "./TradingChart";

interface AssetPrice {
  symbol: string;
  name: string;
  category: string;
  currency: string;
  price: number;
  prev_price: number;
  high_24h: number;
  low_24h: number;
  change_pct: number;
  order_book: {
    bids: { price: number; quantity: number }[];
    asks: { price: number; quantity: number }[];
  };
}

interface PendingOrder {
  id: string;
  symbol: string;
  side: string;
  order_type: string;
  quantity: number;
  limit_price?: number;
  stop_price?: number;
  created_at: string;
}

interface DashboardProps {
  prices: AssetPrice[];
  portfolio: any;
  refreshPortfolio: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ prices, portfolio, refreshPortfolio }) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("TSLA");
  const [history, setHistory] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  
  // Trade Terminal Form State
  const [tradeSide, setTradeSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT" | "STOP">("MARKET");
  const [quantity, setQuantity] = useState<number>(1);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [stopPrice, setStopPrice] = useState<number>(0);
  
  // Feedback Messages
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const selectedAsset = prices.find((p) => p.symbol === selectedSymbol) || prices[0];

  // Fetch chart history and active orders
  const loadChartAndOrders = async () => {
    if (!selectedSymbol) return;
    try {
      const histData = await api.getMarketHistory(selectedSymbol);
      setHistory(histData);
      
      const orders = await api.getActiveOrders();
      setPendingOrders(orders);
    } catch (e) {
      console.error("Error loading terminal assets: ", e);
    }
  };

  useEffect(() => {
    loadChartAndOrders();
    
    // Periodically refresh active orders (every 3 seconds)
    const interval = setInterval(async () => {
      const orders = await api.getActiveOrders();
      setPendingOrders(orders);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Sync default price inputs on asset switch
  useEffect(() => {
    if (selectedAsset) {
      setLimitPrice(selectedAsset.price);
      setStopPrice(Math.round(selectedAsset.price * 0.9 * 100) / 100);
      setQuantity(selectedAsset.category === "HK_STOCK" ? (selectedAsset.symbol === "0005.HK" ? 400 : 100) : 1);
      setFeedback(null);
    }
  }, [selectedSymbol, selectedAsset?.price]);

  // Execute Trade Handler
  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setFeedback(null);
    setSubmitting(true);

    try {
      const payload: any = {
        symbol: selectedSymbol,
        side: tradeSide,
        order_type: orderType,
        quantity: Number(quantity),
      };

      if (orderType === "LIMIT") {
        payload.limit_price = Number(limitPrice);
      } else if (orderType === "STOP") {
        payload.stop_price = Number(stopPrice);
      }

      const resp = await api.placeTrade(payload);
      
      if (resp.status === "success") {
        setFeedback({ type: "success", text: resp.message });
      } else {
        setFeedback({ type: "success", text: `Order Queued: ${resp.message}` });
      }
      
      // Refresh portfolio status
      refreshPortfolio();
      const updatedOrders = await api.getActiveOrders();
      setPendingOrders(updatedOrders);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to execute transaction." });
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Pending Order
  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.cancelOrder(orderId);
      setPendingOrders(pendingOrders.filter((o) => o.id !== orderId));
      refreshPortfolio();
    } catch (err: any) {
      alert("Failed to cancel order: " + err.message);
    }
  };

  // Calculate trade estimated costs
  const getEstimatedCost = () => {
    if (!selectedAsset) return 0;
    const price = orderType === "LIMIT" ? limitPrice : selectedAsset.price;
    return quantity * price;
  };

  const estCost = getEstimatedCost();
  const currencySymbol = selectedAsset?.currency || "USD";
  const userCash = portfolio?.cash ? (selectedAsset?.currency === "USD" ? portfolio.cash.usd_cash : portfolio.cash.hkd_cash) : 0;
  const otherCurrency = selectedAsset?.currency === "USD" ? "HKD" : "USD";
  const otherCash = portfolio?.cash ? (selectedAsset?.currency === "USD" ? portfolio.cash.hkd_cash : portfolio.cash.usd_cash) : 0;
  const rate = selectedAsset?.currency === "USD" ? 1/7.8 : 7.8;
  const autoConversionAdvise = estCost > userCash && (userCash + otherCash * rate) >= estCost;

  return (
    <div className="dashboard-grid fade-in">
      
      {/* 1. LEFT PANEL: WATCHLIST */}
      <div className="premium-card" style={{ display: "flex", flexDirection: "column", height: "650px", padding: "16px" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "14px", color: "var(--color-text-secondary)" }}>Market Watchlist</h3>
        
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {prices.map((item) => {
            const isUp = item.price >= item.prev_price;
            const diffPct = item.change_pct;
            
            return (
              <div
                key={item.symbol}
                onClick={() => setSelectedSymbol(item.symbol)}
                className={`lesson-card`}
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: selectedSymbol === item.symbol ? "var(--color-accent-bg)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${selectedSymbol === item.symbol ? "var(--border-focus)" : "var(--border-subtle)"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{item.symbol}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{item.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    className={isUp ? "text-up" : "text-down"}
                    style={{ fontWeight: "700", fontSize: "0.95rem" }}
                  >
                    {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className={diffPct >= 0 ? "bg-up-pill" : "bg-down-pill"} style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                    {diffPct >= 0 ? "+" : ""}{diffPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MIDDLE PANEL: CHARTS & DEPTH BOOK */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Real-time Candlestick Chart */}
        <div className="premium-card" style={{ height: "400px", padding: "12px", overflow: "hidden" }}>
          {history.length > 0 ? (
            <TradingChart
              symbol={selectedSymbol}
              history={history}
              currentPrice={selectedAsset?.price || 0}
            />
          ) : (
            <div className="flex-between" style={{ height: "100%", justifyContent: "center", color: "var(--color-text-muted)" }}>
              Loading Price Chart...
            </div>
          )}
        </div>

        {/* Dynamic Simulated Order Book */}
        <div className="premium-card" style={{ flex: 1, padding: "16px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "var(--color-text-secondary)" }}>
            Live Order Book - {selectedSymbol} Depth
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            
            {/* Bids (Buy Orders) */}
            <div>
              <div className="text-up" style={{ fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "4px" }}>
                Bids (Buy Demand)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {selectedAsset?.order_book.bids.map((b, i) => {
                  const maxBidQty = Math.max(...(selectedAsset.order_book.bids.map(b => b.quantity) || [1]));
                  const depthPct = (b.quantity / maxBidQty) * 100;
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontFamily: "var(--font-mono)", position: "relative", padding: "2px 4px" }}>
                      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: `${depthPct}%`, backgroundColor: "rgba(16,185,129,0.06)", zIndex: 1, borderRadius: "2px" }} />
                      <span className="text-up" style={{ zIndex: 2 }}>{b.price.toFixed(2)}</span>
                      <span className="text-muted" style={{ zIndex: 2 }}>{b.quantity.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asks (Sell Orders) */}
            <div>
              <div className="text-down" style={{ fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "4px" }}>
                Asks (Sell Supply)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {selectedAsset?.order_book.asks.map((a, i) => {
                  const maxAskQty = Math.max(...(selectedAsset.order_book.asks.map(a => a.quantity) || [1]));
                  const depthPct = (a.quantity / maxAskQty) * 100;
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontFamily: "var(--font-mono)", position: "relative", padding: "2px 4px" }}>
                      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: `${depthPct}%`, backgroundColor: "rgba(239,68,68,0.06)", zIndex: 1, borderRadius: "2px" }} />
                      <span className="text-down" style={{ zIndex: 2 }}>{a.price.toFixed(2)}</span>
                      <span className="text-muted" style={{ zIndex: 2 }}>{a.quantity.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. RIGHT PANEL: TRADE PANELS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Terminal Order Form */}
        <div className="premium-card">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Trading Controls</h3>
          
          {/* Side Select Tab */}
          <div style={{ display: "flex", borderRadius: "var(--radius-md)", backgroundColor: "rgba(255,255,255,0.03)", padding: "4px", marginBottom: "18px", border: "1px solid var(--border-subtle)" }}>
            <button
              type="button"
              onClick={() => setTradeSide("BUY")}
              style={{
                flex: 1, padding: "8px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
                backgroundColor: tradeSide === "BUY" ? "var(--color-up)" : "transparent",
                color: "#fff", fontWeight: "700", transition: "all 0.2s"
              }}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => setTradeSide("SELL")}
              style={{
                flex: 1, padding: "8px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
                backgroundColor: tradeSide === "SELL" ? "var(--color-down)" : "transparent",
                color: "#fff", fontWeight: "700", transition: "all 0.2s"
              }}
            >
              SELL
            </button>
          </div>

          <form onSubmit={handleTradeSubmit}>
            
            {/* Order Type */}
            <div className="form-group">
              <label>Order Execution Strategy</label>
              <select
                className="form-control"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as any)}
              >
                <option value="MARKET">Market (Immediate execution)</option>
                <option value="LIMIT">Limit (Target price boundary)</option>
                <option value="STOP">Stop-Loss (Capital protection floor)</option>
              </select>
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label>Quantity {selectedAsset?.category === "HK_STOCK" && `(Lot size: ${selectedAsset.lot_size} shares)`}</label>
              <input
                type="number"
                step={selectedAsset?.category === "CRYPTO" ? "0.0001" : "1"}
                min="0.0001"
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>

            {/* Limit Price */}
            {orderType === "LIMIT" && (
              <div className="form-group">
                <label>Limit Buy/Sell Price ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                  required
                />
              </div>
            )}

            {/* Stop Price */}
            {orderType === "STOP" && (
              <div className="form-group">
                <label>Stop Trigger Price ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(Number(e.target.value))}
                  required
                />
              </div>
            )}

            {/* Pricing Advisory box */}
            <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "12px", marginBottom: "16px", fontSize: "0.8rem" }}>
              <div className="flex-between" style={{ marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Available Cash:</span>
                <span style={{ fontWeight: "700" }}>{userCash.toLocaleString()} {currencySymbol}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Estimated Trade Value:</span>
                <span style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>{estCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencySymbol}</span>
              </div>
              
              {/* Automated Currency Advice */}
              {autoConversionAdvise && (
                <div style={{ color: "var(--color-warning)", marginTop: "6px", display: "flex", gap: "4px", flexDirection: "column" }}>
                  <span>⚠️ Balance insufficient. Auto-exchanging {((estCost - userCash) * rate).toFixed(2)} {otherCurrency} to cover shortfall.</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={tradeSide === "BUY" ? "btn-success" : "btn-danger"}
              style={{ width: "100%", padding: "12px", fontSize: "1rem" }}
            >
              {submitting ? "Sending Order..." : `${tradeSide} ${selectedSymbol}`}
            </button>
          </form>

          {/* Feedback Messages */}
          {feedback && (
            <div
              style={{
                marginTop: "14px",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.82rem",
                border: "1px solid",
                backgroundColor: feedback.type === "success" ? "var(--color-up-bg)" : "var(--color-down-bg)",
                borderColor: feedback.type === "success" ? "var(--color-up)" : "var(--color-down)",
                color: feedback.type === "success" ? "var(--color-up)" : "var(--color-down)"
              }}
            >
              {feedback.text}
            </div>
          )}

        </div>

        {/* Pending Limit / Stop Orders */}
        <div className="premium-card" style={{ flex: 1, padding: "16px", maxHeight: "250px", overflowY: "auto" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "var(--color-text-secondary)" }}>
            Pending Matching Orders ({pendingOrders.length})
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pendingOrders.length === 0 ? (
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textAlign: "center", display: "block", padding: "12px" }}>
                No active limit or stop orders.
              </span>
            ) : (
              pendingOrders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ fontSize: "0.8rem" }}>
                    <span className={o.side === "BUY" ? "text-up" : "text-down"} style={{ fontWeight: "700" }}>{o.side}</span>{" "}
                    {o.quantity} {o.symbol}
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                      {o.order_type === "LIMIT" ? `Limit at ${o.limit_price}` : `Stop-Loss at ${o.stop_price}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelOrder(o.id)}
                    style={{
                      border: "none",
                      backgroundColor: "rgba(239,68,68,0.1)",
                      color: "var(--color-down)",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.75rem",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
