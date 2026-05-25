#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

API_BASE = "http://127.0.0.1:8000"
USD_HKD_RATE = 7.8

def make_request(endpoint: str):
    url = f"{API_BASE}{endpoint}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"API Connection Error: {e}")
        return None

def analyze_portfolio():
    print("=" * 70)
    print("        APEXINVEST RESEARCH - PORTFOLIO RISK & ALLOCATION ANALYZER")
    print("=" * 70)
    
    # 1. Fetch data
    portfolio = make_request("/portfolio")
    prices = make_request("/market/prices")
    
    if not portfolio or not prices:
        print("[-] Aborting: Could not connect to API to fetch live portfolio state.")
        print("=" * 70)
        return
        
    cash = portfolio["cash"]
    holdings = portfolio["holdings"]
    
    # Calculate Total Portfolio Value in USD
    usd_cash = cash["usd_cash"]
    hkd_cash_usd = cash["hkd_cash"] / USD_HKD_RATE
    total_cash_usd = usd_cash + hkd_cash_usd
    
    price_map = {item["symbol"]: item for item in prices}
    
    holdings_value_usd = 0.0
    asset_breakdown = {
        "CASH": total_cash_usd,
        "US_STOCK": 0.0,
        "HK_STOCK": 0.0,
        "CRYPTO": 0.0
    }
    
    individual_allocations = []
    
    for h in holdings:
        symbol = h["symbol"]
        qty = h["quantity"] + h["staked_quantity"]
        category = h["category"]
        
        # Get live price
        current_price = price_map[symbol]["price"]
        currency = price_map[symbol]["currency"]
        
        # Convert value to USD
        val_native = qty * current_price
        val_usd = val_native if currency == "USD" else val_native / USD_HKD_RATE
        
        holdings_value_usd += val_usd
        asset_breakdown[category] = asset_breakdown.get(category, 0.0) + val_usd
        
        individual_allocations.append({
            "symbol": symbol,
            "category": category,
            "value_usd": val_usd
        })
        
    net_worth_usd = total_cash_usd + holdings_value_usd
    
    print(f"Net Worth Asset Value:  ${net_worth_usd:,.2f} USD")
    print(f"Total Invested Capital: ${holdings_value_usd:,.2f} USD ({holdings_value_usd / net_worth_usd * 100:.1f}%)")
    print(f"Total Idle Cash:        ${total_cash_usd:,.2f} USD ({total_cash_usd / net_worth_usd * 100:.1f}%)")
    print("-" * 70)
    print("ASSET ALLOCATION SUMMARY:")
    
    for asset_type, val in asset_breakdown.items():
        pct = (val / net_worth_usd) * 100
        bar = "█" * int(pct / 5)
        print(f"  {asset_type:<10} | {pct:>5.1f}% | {bar}")
        
    print("-" * 70)
    print("DIVERSIFICATION & RISK ADVISORY:")
    
    warnings = []
    
    # Check 1: Cash concentration
    cash_pct = (total_cash_usd / net_worth_usd) * 100
    if cash_pct > 80:
        warnings.append("[i] Under-Allocated: You hold more than 80% of your net worth in cash. Inflation will erode purchasing power. Consider allocating some capital to index funds or blue-chip stocks.")
    elif cash_pct < 10:
        warnings.append("[!] High Liquidity Risk: You have less than 10% cash left. Ensure you have an emergency fund and do not get forced to liquidate long-term positions in a market downturn.")
        
    # Check 2: Crypto exposure
    crypto_val = asset_breakdown.get("CRYPTO", 0.0)
    crypto_pct = (crypto_val / net_worth_usd) * 100
    if crypto_pct > 30:
        warnings.append(f"[!] High Volatility Alert: Cryptocurrency accounts for {crypto_pct:.1f}% of your portfolio. Modern theory suggests limiting hyper-volatile assets to 5-15% of total wealth.")
        
    # Check 3: Position Concentration (Single stock risk)
    for asset in individual_allocations:
        pct = (asset["value_usd"] / net_worth_usd) * 100
        if pct > 20:
            warnings.append(f"[!] High Concentration Warning: {asset['symbol']} accounts for {pct:.1f}% of your net worth. You are exposed to single-point-of-failure risk if this company faces financial distress.")
            
    if not warnings:
        print("  [✓] Diversification Optimal: Your portfolio is well balanced across cash, equities, and alternative assets.")
    else:
        for w in warnings:
            print(f"  {w}")
            
    print("-" * 70)
    print("[!] Disclaimer: This is an algorithmic evaluation based on Modern Portfolio Theory.")
    print("    Diversification decreases idiosyncratic risk (unsystematic risk) to maximize returns per unit of volatility.")
    print("=" * 70)

if __name__ == "__main__":
    analyze_portfolio()
