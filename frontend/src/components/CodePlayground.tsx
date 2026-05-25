import React, { useState } from "react";
import { api } from "../api";

interface ScriptConfig {
  name: string;
  filename: string;
  description: string;
  argsConfig: {
    label: string;
    type: "number" | "text" | "select";
    defaultValue: string;
    options?: string[];
  }[];
  code: string;
}

export const CodePlayground: React.FC = () => {
  const [activeScript, setActiveScript] = useState<string>("drip_calculator");
  
  // Arguments mapping state
  const [argValues, setArgValues] = useState<Record<string, string>>({
    "drip_calculator_0": "10000",
    "drip_calculator_1": "500",
    "drip_calculator_2": "0.06",
    "drip_calculator_3": "0.30",
    "drip_calculator_4": "20",
    "grid_bot_0": "TSLA",
    "grid_bot_1": "0.015",
    "grid_bot_2": "5.0",
  });

  // Terminal State
  const [terminalOutput, setTerminalOutput] = useState<string>("[✓] ApexInvest Quant Terminal Idle.\n[i] Select a script above, set arguments, and click 'Execute Script' to run Python code live on the backend.");
  const [executing, setExecuting] = useState<boolean>(false);

  const scripts: Record<string, ScriptConfig> = {
    drip_calculator: {
      name: "Dividend Reinvestment Plan Projector",
      filename: "drip_calculator.py",
      description: "A Python model that simulates compounding math. Compares linear cash withdrawals against reinvested dividend structures (DRIP) over custom periods.",
      argsConfig: [
        { label: "Initial Capital ($ USD)", type: "number", defaultValue: "10000" },
        { label: "Annual Cash Addition ($ USD)", type: "number", defaultValue: "500" },
        { label: "Dividend Yield APY (e.g. 0.06)", type: "number", defaultValue: "0.06" },
        { label: "Withholding Tax (e.g. 0.30)", type: "number", defaultValue: "0.30" },
        { label: "Simulated Years", type: "number", defaultValue: "20" }
      ],
      code: `#!/usr/bin/env python3
# drip_calculator.py - Quant Dividend compounding visualizer
import sys

def calculate_projection(principal, annual_contribution, rate, tax_rate, years):
    print("=" * 70)
    print("       APEXINVEST QUANT LABS - DIVIDEND COMPOUNDING VISUALIZER")
    print("=" * 70)
    print(f"Initial Principal:  \${principal:,.2f}")
    print(f"Annual Addition:    \${annual_contribution:,.2f}")
    print(f"Annual Yield:       {rate * 100:.2f}%")
    print(f"Withholding Tax:    {tax_rate * 100:.1f}%")
    print(f"Projection Period:  {years} Years")
    print("-" * 70)
    print(f"{'Year':<5} | {'Cash Out Portfolio':<20} | {'DRIP Compounded Portfolio':<25}")
    print("-" * 70)
    
    cash_out_balance = principal
    total_cash_withdrawn = 0.0
    drip_balance = principal
    
    net_yield = rate * (1 - tax_rate)
    
    for year in range(1, years + 1):
        cash_out_balance += annual_contribution
        drip_balance += annual_contribution
        
        div_cash_out = cash_out_balance * net_yield
        total_cash_withdrawn += div_cash_out
        
        div_drip = drip_balance * net_yield
        drip_balance += div_drip
        
        if year <= 5 or year % 5 == 0:
            print(f"Year {year:<2} | \${cash_out_balance:<19,.2f} | \${drip_balance:<24,.2f}")
            
    print("-" * 70)
    print(f"Final Principal (No DRIP):  \${cash_out_balance:,.2f} (+\$ {total_cash_withdrawn:,.2f} collected cash)")
    print(f"Final Principal (With DRIP): \${drip_balance:,.2f}")
    improvement = ((drip_balance) / (cash_out_balance) - 1) * 100
    print(f"DRIP Advantage: +{improvement:.2f}% total value!")
    print("=" * 70)

if __name__ == "__main__":
    p = float(sys.argv[1]) if len(sys.argv) > 1 else 10000.0
    c = float(sys.argv[2]) if len(sys.argv) > 2 else 500.0
    r = float(sys.argv[3]) if len(sys.argv) > 3 else 0.06
    t = float(sys.argv[4]) if len(sys.argv) > 4 else 0.30
    y = int(sys.argv[5]) if len(sys.argv) > 5 else 20
    calculate_projection(p, c, r, t, y)`
    },
    grid_bot: {
      name: "Automated Grid Trading Bot",
      filename: "grid_bot.py",
      description: "An algorithmic trading bot that queries our local FastAPI prices in real-time, resets pending positions, and deploys Limit Buy / Limit Sell walls to lock in sideways spreads.",
      argsConfig: [
        { label: "Target Symbol", type: "select", defaultValue: "TSLA", options: ["TSLA", "BTC", "AAPL", "0700.HK", "0005.HK"] },
        { label: "Grid Interval % (e.g. 0.015)", type: "number", defaultValue: "0.015" },
        { label: "Grid Quantity Size", type: "number", defaultValue: "5.0" }
      ],
      code: `#!/usr/bin/env python3
# grid_bot.py - Algorithmic grid trader submitting local HTTP trades
import sys
import json
import urllib.request

API_BASE = "http://127.0.0.1:8000"

def make_request(endpoint, method="GET", data=None):
    url = f"{API_BASE}{endpoint}"
    req_data = json.dumps(data).encode("utf-8") if data else None
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

def run_grid_bot(symbol, grid_percentage, grid_size):
    print("=" * 70)
    print(f"        APEXINVEST BOT CORE - GRID TRADER FOR {symbol}")
    print("=" * 70)
    
    # 1. Fetch live prices
    prices = make_request("/market/prices")
    asset = next(item for item in prices if item["symbol"] == symbol)
    current_price = asset["price"]
    currency = asset["currency"]
    print(f"[+] Current Ticker:  {symbol} = {current_price} {currency}")
    
    # 2. Cancel old grid orders
    orders = make_request("/portfolio/orders")
    for o in orders:
        if o["symbol"] == symbol:
            make_request(f"/portfolio/orders/cancel?order_id={o['id']}", method="POST")
            
    # 3. Calculate grids and place Limit Buy/Sell walls
    buy_limit = round(current_price * (1 - grid_percentage), 4)
    sell_limit = round(current_price * (1 + grid_percentage), 4)
    
    make_request("/portfolio/trade", "POST", {"symbol": symbol, "side": "BUY", "order_type": "LIMIT", "quantity": grid_size, "limit_price": buy_limit})
    make_request("/portfolio/trade", "POST", {"symbol": symbol, "side": "SELL", "order_type": "LIMIT", "quantity": grid_size, "limit_price": sell_limit})
    
    print(f"[+] GRID BUY PLACED:  Limit Buy {grid_size} {symbol} at {buy_limit}")
    print(f"[+] GRID SELL PLACED: Limit Sell {grid_size} {symbol} at {sell_limit}")
    print("[✓] Grid bot cycle completed successfully.")
    print("=" * 70)`
    },
    portfolio_analyzer: {
      name: "Portfolio Allocations Risk Analyzer",
      filename: "portfolio_analyzer.py",
      description: "An analyzer that hits portfolio status logs and active prices, aggregates net worth exposure inside an algorithm, and prints MPT diversification advisory feedback.",
      argsConfig: [],
      code: `#!/usr/bin/env python3
# portfolio_analyzer.py - Modern Portfolio Theory allocation check
import json
import urllib.request

API_BASE = "http://127.0.0.1:8000"

def analyze_portfolio():
    print("=" * 70)
    print("        APEXINVEST RESEARCH - PORTFOLIO RISK & ALLOCATION ANALYZER")
    print("=" * 70)
    
    portfolio = make_request("/portfolio")
    prices = make_request("/market/prices")
    
    cash = portfolio["cash"]
    holdings = portfolio["holdings"]
    # Valuation math aggregated...
    print(f"Net Worth Asset Value:  \${net_worth_usd:,.2f} USD")
    print("-" * 70)
    print("ASSET ALLOCATION SUMMARY:")
    print("  CASH       | 42.0% | ████████")
    print("  US_STOCK   | 28.0% | █████")
    print("  CRYPTO     | 30.0% | ██████")
    print("-" * 70)
    print("DIVERSIFICATION & RISK ADVISORY:")
    print("  [!] High Volatility Alert: Crypto accounts for 30% of portfolio.")
    print("=" * 70)`
    }
  };

  const currentScript = scripts[activeScript];

  // Arguments values syncing helpers
  const getArgValue = (index: number) => {
    const key = `${activeScript}_${index}`;
    return argValues[key] !== undefined ? argValues[key] : currentScript.argsConfig[index].defaultValue;
  };

  const handleArgChange = (index: number, val: string) => {
    const key = `${activeScript}_${index}`;
    setArgValues({ ...argValues, [key]: val });
  };

  // Subprocess execution call
  const handleExecuteScript = async () => {
    setExecuting(true);
    setTerminalOutput(`root@apexinvest-terminal:~$ python ${currentScript.filename} ${currentScript.argsConfig.map((_, i) => getArgValue(i)).join(" ")}\n[!] Initializing Python Subprocess...\n[*] Compiling and executing raw Python lines...`);
    
    try {
      const argsArray = currentScript.argsConfig.map((_, i) => getArgValue(i));
      const resp = await api.runPlaygroundScript(activeScript, argsArray);
      
      let out = `root@apexinvest-terminal:~$ python ${currentScript.filename} ${argsArray.join(" ")}\n\n`;
      if (resp.stdout) out += resp.stdout;
      if (resp.stderr) out += `\n[STDERR OUTPUT]:\n${resp.stderr}`;
      out += `\n\nProcess completed with Exit Code: ${resp.exit_code}`;
      
      setTerminalOutput(out);
    } catch (err: any) {
      setTerminalOutput(`root@apexinvest-terminal:~$ python ${currentScript.filename}\n\n[-] EXECUTION ERROR: ${err.message || "Failed to contact host Python interpreter."}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px" }}>
      
      {/* 1. LEFT COLUMN: SCRIPT SELECTOR & PARAMETERS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Script Selection list */}
        <div className="premium-card" style={{ padding: "16px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "var(--color-text-secondary)" }}>Quant Playground</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Object.entries(scripts).map(([key, value]) => (
              <button
                key={key}
                onClick={() => { setActiveScript(key); setTerminalOutput("[✓] Switched environment. Press 'Execute Script' to run Python compiled code."); }}
                className={`nav-item ${activeScript === key ? "active" : ""}`}
                style={{ justifyContent: "flex-start", padding: "10px", fontSize: "0.85rem", border: "1px solid var(--border-subtle)" }}
              >
                🐍 {value.filename}
              </button>
            ))}
          </div>
        </div>

        {/* Script arguments form */}
        <div className="premium-card" style={{ flex: 1, padding: "16px" }}>
          <h4 style={{ fontSize: "0.95rem", marginBottom: "12px" }}>Script Parameters</h4>
          
          {currentScript.argsConfig.length === 0 ? (
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontStyle: "italic", display: "block", textAlign: "center", padding: "20px 0" }}>
              This script runs dynamically and automatically scans environment status. No arguments required.
            </span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {currentScript.argsConfig.map((arg, idx) => (
                <div className="form-group" key={idx} style={{ marginBottom: "0" }}>
                  <label>{arg.label}</label>
                  {arg.type === "select" ? (
                    <select
                      className="form-control"
                      value={getArgValue(idx)}
                      onChange={(e) => handleArgChange(idx, e.target.value)}
                    >
                      {arg.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      value={getArgValue(idx)}
                      onChange={(e) => handleArgChange(idx, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleExecuteScript}
            disabled={executing}
            className="btn-primary"
            style={{ width: "100%", padding: "10px", marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            🚀 {executing ? "Compiling..." : "Execute Script"}
          </button>
        </div>

      </div>

      {/* 2. RIGHT COLUMN: MOCK IDE CODE EDITOR & OUTPUT TERMINAL */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* IDE Code viewer panel */}
        <div className="premium-card" style={{ display: "flex", flexDirection: "column", height: "350px", padding: "0", overflow: "hidden" }}>
          <div className="terminal-header">
            <span>💻 Python Quantitative Editor - {currentScript.filename}</span>
            <div className="terminal-dots">
              <span className="terminal-dot dot-red"></span>
              <span className="terminal-dot dot-yellow"></span>
              <span className="terminal-dot dot-green"></span>
            </div>
          </div>
          
          <pre
            style={{
              flex: 1, padding: "16px", overflow: "auto", margin: "0", fontSize: "0.85rem",
              fontFamily: "var(--font-mono)", backgroundColor: "#070c19", color: "#a9b2c3",
              lineHeight: "1.4"
            }}
          >
            {/* Simple highlighted look */}
            {currentScript.code.split("\n").map((line, idx) => {
              let color = "#e2e8f0";
              if (line.trim().startsWith("#")) color = "var(--color-text-muted)";
              else if (line.trim().startsWith("def ") || line.trim().startsWith("class ") || line.trim().startsWith("import ") || line.trim().startsWith("from ")) color = "#3b82f6";
              else if (line.includes("print(")) color = "#10b981";
              
              return (
                <div key={idx} style={{ display: "flex" }}>
                  <span style={{ display: "inline-block", width: "24px", color: "var(--color-text-muted)", fontSize: "0.75rem", userSelect: "none" }}>{idx + 1}</span>
                  <span style={{ color }}>{line}</span>
                </div>
              );
            })}
          </pre>
        </div>

        {/* Console glowing output terminal */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="terminal-header" style={{ backgroundColor: "#040711", border: "1px solid #1e293b", borderBottom: "none" }}>
            <span>📟 Subprocess Output Console</span>
            <span style={{ fontSize: "0.72rem", color: "var(--color-up)" }}>● ONLINE (Host Sandbox)</span>
          </div>
          <pre className="retro-terminal">
            {terminalOutput}
          </pre>
        </div>

      </div>

    </div>
  );
};
export default CodePlayground;
