import React, { useState } from "react";

interface PassiveIncomeProps {
  portfolio: any;
}

export const PassiveIncome: React.FC<PassiveIncomeProps> = ({ portfolio }) => {
  // Calculator States
  const [initCapital, setInitCapital] = useState<number>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [expectedYield, setExpectedYield] = useState<number>(6); // 6%
  const [withholdingTax, setWithholdingTax] = useState<number>(30); // 30% tax
  const [timeHorizon, setTimeHorizon] = useState<number>(20); // 20 years

  // Calculate annual projected income from actual portfolio holdings
  const getActualProjectedPassiveIncome = () => {
    if (!portfolio || !portfolio.holdings) return { usd: 0, hkd: 0 };
    
    let totalUsd = 0;
    const usdHkdRate = 7.8;
    
    portfolio.holdings.forEach((h: any) => {
      const isDripStock = h.category === "US_STOCK" || h.category === "HK_STOCK";
      const totalQty = h.quantity + h.staked_quantity;
      const valNative = totalQty * h.current_price;
      
      let rate = 0;
      if (h.symbol === "0005.HK") rate = 0.065; // HSBC 6.5%
      else if (h.symbol === "0700.HK") rate = 0.012; // Tencent 1.2%
      else if (h.symbol === "AAPL") rate = 0.005; // Apple 0.5%
      else if (h.symbol === "NVDA") rate = 0.001; // Nvidia 0.1%
      else if (h.symbol === "ETH") rate = 0.042; // ETH Staking 4.2%
      else if (h.symbol === "SOL") rate = 0.065; // SOL Staking 6.5%
      
      const yieldUsd = h.currency === "USD" ? valNative * rate : (valNative * rate) / usdHkdRate;
      totalUsd += yieldUsd;
    });
    
    return {
      usd: Math.round(totalUsd),
      hkd: Math.round(totalUsd * usdHkdRate),
    };
  };

  const actualYields = getActualProjectedPassiveIncome();

  // Mathematical projections for calculator
  const netYield = (expectedYield / 100) * (1 - withholdingTax / 100);
  
  const generateProjectionData = () => {
    const data: { year: number; linear: number; compounded: number }[] = [];
    
    let linearVal = initCapital;
    let compoundedVal = initCapital;
    
    data.push({ year: 0, linear: linearVal, compounded: compoundedVal });
    
    for (let y = 1; y <= timeHorizon; y++) {
      // Annual contributions added at start of year
      linearVal += monthlyContribution * 12;
      compoundedVal += monthlyContribution * 12;
      
      // Calculate yields
      const linearDiv = linearVal * netYield; // spent, not compounded
      const compoundedDiv = compoundedVal * netYield; // reinvested!
      
      compoundedVal += compoundedDiv;
      
      data.push({
        year: y,
        linear: Math.round(linearVal),
        compounded: Math.round(compoundedVal),
      });
    }
    
    return data;
  };

  const projection = generateProjectionData();
  const finalLinear = projection[projection.length - 1]?.linear || initCapital;
  const finalCompounded = projection[projection.length - 1]?.compounded || initCapital;
  const improvement = ((finalCompounded - finalLinear) / finalLinear) * 100;

  // Custom SVG Plot Math
  const padding = 40;
  const width = 580;
  const height = 280;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const maxVal = Math.max(finalLinear, finalCompounded, 1000);
  const minVal = initCapital;

  const getX = (y: number) => padding + (y / timeHorizon) * plotWidth;
  const getY = (val: number) => padding + plotHeight - ((val - minVal) / (maxVal - minVal || 1)) * plotHeight;

  // SVG lines
  let linearPath = "";
  let compoundedPath = "";
  
  projection.forEach((pt, idx) => {
    const x = getX(pt.year);
    const yLin = getY(pt.linear);
    const yComp = getY(pt.compounded);
    
    if (idx === 0) {
      linearPath = `M ${x} ${yLin}`;
      compoundedPath = `M ${x} ${yComp}`;
    } else {
      linearPath += ` L ${x} ${yLin}`;
      compoundedPath += ` L ${x} ${yComp}`;
    }
  });

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* 1. ACTUAL YIELD HUB HEADERS */}
      <div className="info-grid">
        <div className="premium-card info-item" style={{ borderLeft: "4px solid var(--color-up)" }}>
          <div className="info-item-label">Projected Annual Passive Income</div>
          <div className="info-item-value" style={{ color: "var(--color-up)" }}>
            ${actualYields.usd.toLocaleString()} USD
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            HKD Equivalent: ${actualYields.hkd.toLocaleString()} HKD
          </div>
        </div>

        <div className="premium-card info-item">
          <div className="info-item-label">Projected Monthly Passive Cash</div>
          <div className="info-item-value" style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem" }}>
            ${Math.round(actualYields.usd / 12).toLocaleString()} USD
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Est. average monthly payout cashflow
          </div>
        </div>

        <div className="premium-card info-item">
          <div className="info-item-label">Active DRIP Channels</div>
          <div className="info-item-value" style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem" }}>
            {portfolio.holdings ? portfolio.holdings.filter((h: any) => h.drip_enabled === 1).length : 0} Stocks
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Active compounding channels
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        {/* 2. DYNAMIC SLIDER CALCULATOR CONTAINER */}
        <div className="premium-card">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Compounding Dividend Calculator</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Init Capital */}
            <div>
              <div className="flex-between" style={{ fontSize: "0.85rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Initial Principal Capital</span>
                <span style={{ fontWeight: "700", fontFamily: "var(--font-mono)" }}>${initCapital.toLocaleString()} USD</span>
              </div>
              <input
                type="range"
                min="1000"
                max="250000"
                step="1000"
                style={{ width: "100%", accentColor: "var(--color-accent)" }}
                value={initCapital}
                onChange={(e) => setInitCapital(Number(e.target.value))}
              />
            </div>

            {/* Monthly addition */}
            <div>
              <div className="flex-between" style={{ fontSize: "0.85rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Monthly Contribution</span>
                <span style={{ fontWeight: "700", fontFamily: "var(--font-mono)" }}>${monthlyContribution.toLocaleString()} USD</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                style={{ width: "100%", accentColor: "var(--color-accent)" }}
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              />
            </div>

            {/* Expected Yield */}
            <div>
              <div className="flex-between" style={{ fontSize: "0.85rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Expected Dividend Yield (APY)</span>
                <span style={{ fontWeight: "700", fontFamily: "var(--font-mono)" }}>{expectedYield}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="0.5"
                style={{ width: "100%", accentColor: "var(--color-accent)" }}
                value={expectedYield}
                onChange={(e) => setExpectedYield(Number(e.target.value))}
              />
            </div>

            {/* Withholding tax */}
            <div>
              <div className="flex-between" style={{ fontSize: "0.85rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Dividend Withholding Tax Rate</span>
                <span style={{ fontWeight: "700", fontFamily: "var(--font-mono)" }}>{withholdingTax}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                style={{ width: "100%", accentColor: "var(--color-accent)" }}
                value={withholdingTax}
                onChange={(e) => setWithholdingTax(Number(e.target.value))}
              />
            </div>

            {/* Years Horizon */}
            <div>
              <div className="flex-between" style={{ fontSize: "0.85rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Time Horizon</span>
                <span style={{ fontWeight: "700", fontFamily: "var(--font-mono)" }}>{timeHorizon} Years</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                style={{ width: "100%", accentColor: "var(--color-accent)" }}
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(Number(e.target.value))}
              />
            </div>

          </div>

          <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "10px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Principal (No DRIP)</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                ${finalLinear.toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: "var(--color-up-bg)", border: "1px solid var(--color-up)", borderRadius: "var(--radius-sm)", padding: "10px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-up)" }}>Principal (With DRIP)</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--color-up)", marginTop: "4px" }}>
                ${finalCompounded.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 3. DYNAMIC REINVESTMENT PROJECTIONS GRAPH */}
        <div className="premium-card" style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "6px" }}>Compounding Projections Graph</h3>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "14px" }}>
            Visualize how compounding shares out-paces cash withdrawals (Advantage: <strong className="text-up">+{improvement.toFixed(1)}%</strong>).
          </span>

          <div style={{ position: "relative", flex: 1, minHeight: "260px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: "100%", display: "block" }}>
              {/* Plot grids */}
              <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" />

              {/* Y axis text labels */}
              <text x={padding - 6} y={padding + 4} fill="#64748b" fontSize="8" textAnchor="end">${maxVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>
              <text x={padding - 6} y={height - padding + 3} fill="#64748b" fontSize="8" textAnchor="end">${minVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>

              {/* X axis text labels */}
              <text x={padding} y={height - padding + 16} fill="#64748b" fontSize="8" textAnchor="middle">0 Yrs</text>
              <text x={width - padding} y={height - padding + 16} fill="#64748b" fontSize="8" textAnchor="middle">{timeHorizon} Yrs</text>

              {/* Graph Curves */}
              {linearPath && (
                <path
                  d={linearPath}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}
              {compoundedPath && (
                <path
                  d={compoundedPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  className="fade-in"
                />
              )}

              {/* Plot node circles */}
              <circle cx={getX(timeHorizon)} cy={getY(finalLinear)} r="4" fill="#94a3b8" />
              <circle cx={getX(timeHorizon)} cy={getY(finalCompounded)} r="4.5" fill="#10b981" />
            </svg>

            {/* Floating Legends */}
            <div style={{ position: "absolute", bottom: "10px", right: "20px", display: "flex", gap: "12px", fontSize: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ display: "inline-block", width: "10px", height: "10px", backgroundColor: "#10b981", borderRadius: "50%" }}></span>
                <span style={{ color: "var(--color-text-secondary)" }}>DRIP Reinvested</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ display: "inline-block", width: "10px", height: "3px", borderTop: "2px dashed #94a3b8" }}></span>
                <span style={{ color: "var(--color-text-secondary)" }}>Linear Withdrawals</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. PASSIVE INCOME YIELD POOLS KNOWLEDGE CARDS */}
      <div className="premium-card">
        <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>High-Yield Staking & Dividend Pools</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          
          <div style={{ padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", backgroundColor: "rgba(255,255,255,0.01)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "0.95rem" }}>HSBC Holdings (0005.HK)</strong>
              <span className="bg-up-pill" style={{ fontSize: "0.75rem", backgroundColor: "rgba(16,185,129,0.12)" }}>6.5% Yield</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
              A financial behemoth and traditional Hong Kong blue-chip dividend champion. Payouts are made quarterly in HKD. Minimum lot size requires 400 shares.
            </p>
          </div>

          <div style={{ padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", backgroundColor: "rgba(255,255,255,0.01)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "0.95rem" }}>Ethereum Validation (ETH)</strong>
              <span className="bg-up-pill" style={{ fontSize: "0.75rem", backgroundColor: "rgba(59,130,246,0.12)", color: "var(--color-accent)" }}>4.2% APY</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
              Staking ETH delegates tokens to network validators validating blockchain consensus. Earn rewards continuously in rapid simulation ticks.
            </p>
          </div>

          <div style={{ padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", backgroundColor: "rgba(255,255,255,0.01)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "0.95rem" }}>Solana Validation (SOL)</strong>
              <span className="bg-up-pill" style={{ fontSize: "0.75rem", backgroundColor: "rgba(16,185,129,0.12)" }}>6.5% APY</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
              High-speed layer 1 network. Delegation staking is extremely fast and generates yield at 6.5% compound APY. Watch out for validator uptime slashing rules.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
export default PassiveIncome;
