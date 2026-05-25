#!/usr/bin/env python3
import sys
import json
import time
import urllib.request
import urllib.error

API_BASE = "http://127.0.0.1:8000"

def make_request(endpoint: str, method: str = "GET", data: dict = None):
    """Utility function to hit the local FastAPI server using pure Python urllib."""
    url = f"{API_BASE}{endpoint}"
    req_data = None
    headers = {"Content-Type": "application/json"}
    
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"API Error communicating with {url}: {e}")
        return None

def run_grid_bot(symbol: str, grid_percentage: float, grid_size: float):
    """
    Runs a simple automated grid trading bot cycle.
    Fetches price, checks holdings, cancels old pending orders for the asset,
    and places new buy/sell limit walls to trap volatility profits.
    """
    print("=" * 70)
    print(f"        APEXINVEST BOT CORE - GRID TRADER FOR {symbol}")
    print("=" * 70)
    print(f"Target Symbol:       {symbol}")
    print(f"Grid Interval:       {grid_percentage * 100:.2f}%")
    print(f"Grid Unit Size:      {grid_size} shares/units")
    print("-" * 70)
    
    # 1. Fetch current price
    prices = make_request("/market/prices")
    if not prices:
        print("[-] Aborting: Could not fetch active market price feed.")
        return
        
    asset_data = next((item for item in prices if item["symbol"] == symbol), None)
    if not asset_data:
        print(f"[-] Aborting: Symbol {symbol} not recognized in simulation.")
        return
        
    current_price = asset_data["price"]
    currency = asset_data["currency"]
    print(f"[+] Current Ticker:  {symbol} = {current_price} {currency}")
    
    # 2. Cancel existing orders for this asset to reset the grid
    orders = make_request("/portfolio/orders")
    if orders is not None:
        for order in orders:
            if order["symbol"] == symbol:
                print(f"[*] Clearing old grid block: Cancelling order {order['id'][:8]}...")
                make_request(f"/portfolio/orders/cancel?order_id={order['id']}", method="POST")
                
    # 3. Calculate grids
    buy_limit_price = round(current_price * (1 - grid_percentage), 4)
    sell_limit_price = round(current_price * (1 + grid_percentage), 4)
    
    print("-" * 70)
    print(f"[*] Placing grid orders centered around {current_price}...")
    
    # 4. Submit Limit Buy
    buy_payload = {
        "symbol": symbol,
        "side": "BUY",
        "order_type": "LIMIT",
        "quantity": grid_size,
        "limit_price": buy_limit_price
    }
    buy_resp = make_request("/portfolio/trade", method="POST", data=buy_payload)
    if buy_resp and "order_id" in buy_resp:
        print(f"[+] GRID BUY PLACED:  Limit Buy {grid_size} {symbol} at {buy_limit_price} {currency} (Order {buy_resp['order_id'][:8]})")
    else:
        print(f"[-] Failed to place Grid Buy order. Check cash balance.")
        
    # 5. Submit Limit Sell
    sell_payload = {
        "symbol": symbol,
        "side": "SELL",
        "order_type": "LIMIT",
        "quantity": grid_size,
        "limit_price": sell_limit_price
    }
    sell_resp = make_request("/portfolio/trade", method="POST", data=sell_payload)
    if sell_resp and "order_id" in sell_resp:
        print(f"[+] GRID SELL PLACED: Limit Sell {grid_size} {symbol} at {sell_limit_price} {currency} (Order {sell_resp['order_id'][:8]})")
    else:
        print(f"[-] Failed to place Grid Sell order. Check asset holdings.")
        
    print("-" * 70)
    print("[✓] Grid bot cycle completed successfully.")
    print("[!] How it works: If the price fluctuates up or down, one of these limits will match.")
    print("    Quant traders run these script processes in infinite loops to pocket sideways spreads!")
    print("=" * 70)

if __name__ == "__main__":
    # Pull params or default
    symbol = sys.argv[1] if len(sys.argv) > 1 else "TSLA"
    percentage = float(sys.argv[2]) if len(sys.argv) > 2 else 0.015 # 1.5% grid
    size = float(sys.argv[3]) if len(sys.argv) > 3 else 5.0 # 5 shares
    
    run_grid_bot(symbol, percentage, size)
