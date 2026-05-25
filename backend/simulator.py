import asyncio
import random
import logging
from datetime import datetime
from typing import Dict, List, Any
import database

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Simulator")

# Static configuration of supported assets
ASSETS = {
    # US STOCKS (Traded in USD)
    "AAPL": {"name": "Apple Inc.", "category": "US_STOCK", "price": 180.0, "volatility": 0.008, "div_yield": 0.005, "lot_size": 1, "currency": "USD"},
    "TSLA": {"name": "Tesla Inc.", "category": "US_STOCK", "price": 200.0, "volatility": 0.015, "div_yield": 0.0, "lot_size": 1, "currency": "USD"},
    "NVDA": {"name": "NVIDIA Corp.", "category": "US_STOCK", "price": 800.0, "volatility": 0.018, "div_yield": 0.001, "lot_size": 1, "currency": "USD"},
    
    # HK STOCKS (Traded in HKD, board lots enforced)
    "0700.HK": {"name": "Tencent Holdings", "category": "HK_STOCK", "price": 400.0, "volatility": 0.006, "div_yield": 0.012, "lot_size": 100, "currency": "HKD"},
    "9988.HK": {"name": "Alibaba Group", "category": "HK_STOCK", "price": 75.0, "volatility": 0.01, "div_yield": 0.0, "lot_size": 100, "currency": "HKD"},
    "0005.HK": {"name": "HSBC Holdings", "category": "HK_STOCK", "price": 65.0, "volatility": 0.004, "div_yield": 0.065, "lot_size": 400, "currency": "HKD"},
    
    # CRYPTOCURRENCIES (Traded in USD, high volatility, 24/7)
    "BTC": {"name": "Bitcoin", "category": "CRYPTO", "price": 65000.0, "volatility": 0.02, "div_yield": 0.0, "lot_size": 0.0001, "currency": "USD"},
    "ETH": {"name": "Ethereum", "category": "CRYPTO", "price": 3200.0, "volatility": 0.025, "div_yield": 0.042, "lot_size": 0.001, "currency": "USD", "staking_apy": 0.042}, # 4.2% APY staking
    "SOL": {"name": "Solana", "category": "CRYPTO", "price": 140.0, "volatility": 0.035, "div_yield": 0.065, "lot_size": 0.01, "currency": "USD", "staking_apy": 0.065}   # 6.5% APY staking
}

# Fixed exchange rate (simulated)
USD_HKD_RATE = 7.8

# In-memory store for live market price, historical OHLC bars, and order books
MARKET_DATA: Dict[str, Dict[str, Any]] = {}

def init_market_data():
    """Seed initial prices and 50 historical 1-minute ticks for charts."""
    for symbol, config in ASSETS.items():
        price = config["price"]
        history = []
        # Generate some mock historical data (past 50 intervals) to populate charts immediately
        current_time = datetime.now().timestamp()
        for i in range(50):
            interval_time = current_time - (50 - i) * 60
            change = random.normalvariate(0, config["volatility"] * 1.5)
            open_p = price * (1 + change)
            close_p = open_p * (1 + random.normalvariate(0, config["volatility"]))
            high_p = max(open_p, close_p) * (1 + abs(random.normalvariate(0, config["volatility"] * 0.5)))
            low_p = min(open_p, close_p) * (1 - abs(random.normalvariate(0, config["volatility"] * 0.5)))
            history.append({
                "time": int(interval_time),
                "open": round(open_p, 4),
                "high": round(high_p, 4),
                "low": round(low_p, 4),
                "close": round(close_p, 4)
            })
            price = close_p
            
        MARKET_DATA[symbol] = {
            "symbol": symbol,
            "name": config["name"],
            "category": config["category"],
            "currency": config["currency"],
            "price": round(price, 4),
            "prev_price": round(price, 4),
            "high_24h": round(price * 1.05, 4),
            "low_24h": round(price * 0.95, 4),
            "change_pct": 0.0,
            "history": history,
            "order_book": {"bids": [], "asks": []}
        }
        update_order_book(symbol)

def update_order_book(symbol: str):
    """Generates a realistic live simulated limit order book centered around current price."""
    price = MARKET_DATA[symbol]["price"]
    vol = ASSETS[symbol]["volatility"]
    
    bids = []
    asks = []
    
    # 5 levels of bid depth (buy orders below market)
    for i in range(1, 6):
        level_price = price * (1 - i * vol * 0.15)
        # HK Stocks trade in increments of 0.05 or 0.1, cryptos/US stocks in 0.01 or smaller
        if ASSETS[symbol]["category"] == "HK_STOCK":
            level_price = round(level_price * 10) / 10 # round to nearest 0.1
        else:
            level_price = round(level_price, 2)
            
        qty = random.randint(10, 1000) if ASSETS[symbol]["category"] != "CRYPTO" else round(random.uniform(0.1, 15.0), 3)
        bids.append({"price": level_price, "quantity": qty})
        
    # 5 levels of ask depth (sell orders above market)
    for i in range(1, 6):
        level_price = price * (1 + i * vol * 0.15)
        if ASSETS[symbol]["category"] == "HK_STOCK":
            level_price = round(level_price * 10) / 10
        else:
            level_price = round(level_price, 2)
            
        qty = random.randint(10, 1000) if ASSETS[symbol]["category"] != "CRYPTO" else round(random.uniform(0.1, 15.0), 3)
        asks.append({"price": level_price, "quantity": qty})
        
    # Sort order book levels
    MARKET_DATA[symbol]["order_book"] = {
        "bids": sorted(bids, key=lambda x: x["price"], reverse=True),
        "asks": sorted(asks, key=lambda x: x["price"])
    }

async def run_simulation_loop():
    """Background simulator thread that updates asset prices, matching limits, and processing yields."""
    init_market_data()
    dividend_timer = 0
    
    while True:
        try:
            await asyncio.sleep(1.0) # Tick rate: 1 second
            
            dividend_timer += 1
            trigger_dividends = (dividend_timer >= 60) # Payout dividends every 60 seconds (rapid simulation)
            if trigger_dividends:
                dividend_timer = 0
                
            for symbol, data in MARKET_DATA.items():
                config = ASSETS[symbol]
                prev_price = data["price"]
                
                # Random walk tick
                change = random.normalvariate(0, config["volatility"])
                new_price = prev_price * (1 + change)
                
                # Boundary safety checks
                if new_price <= 0.0001:
                    new_price = 0.0001
                    
                data["prev_price"] = prev_price
                data["price"] = round(new_price, 4)
                data["change_pct"] = round(((new_price - data["history"][0]["close"]) / data["history"][0]["close"]) * 100, 2)
                
                # Keep high/low simple
                if new_price > data["high_24h"]: data["high_24h"] = round(new_price, 4)
                if new_price < data["low_24h"]: data["low_24h"] = round(new_price, 4)
                
                # Update live order book
                update_order_book(symbol)
                
                # Update OHLC data every 10 ticks for the dashboard chart
                if random.random() < 0.15:
                    new_bar = {
                        "time": int(datetime.now().timestamp()),
                        "open": prev_price,
                        "high": max(prev_price, new_price) * 1.002,
                        "low": min(prev_price, new_price) * 0.998,
                        "close": data["price"]
                    }
                    data["history"].append(new_bar)
                    if len(data["history"]) > 100:
                        data["history"].pop(0)
            
            # Execute matching engine for pending orders
            process_orders_matching()
            
            # Distribute staking yields (every 5 seconds)
            if dividend_timer % 5 == 0:
                distribute_staking_yields()
                
            # Distribute stock dividends (every 60 seconds)
            if trigger_dividends:
                distribute_stock_dividends()
                
        except Exception as e:
            logger.error(f"Error in simulator loop: {e}", exc_info=True)

def process_orders_matching():
    """Scans pending Limit and Stop-Loss orders in SQLite and matching them against current prices."""
    orders = database.get_orders()
    portfolio = database.get_portfolio()
    
    for order in orders:
        symbol = order["symbol"]
        side = order["side"]
        order_type = order["order_type"]
        qty = order["quantity"]
        
        current_price = MARKET_DATA[symbol]["price"]
        config = ASSETS[symbol]
        currency = config["currency"]
        
        executed = False
        execution_price = current_price
        
        if order_type == "LIMIT":
            limit_price = order["limit_price"]
            if side == "BUY" and current_price <= limit_price:
                # Target price hit! BUY limit executed
                executed = True
                execution_price = limit_price # Matches at exact limit or better
            elif side == "SELL" and current_price >= limit_price:
                # Target price hit! SELL limit executed
                executed = True
                execution_price = limit_price
        elif order_type == "STOP":
            stop_price = order["stop_price"]
            if side == "SELL" and current_price <= stop_price:
                # Stop-loss triggered! Sell immediately at market
                executed = True
                execution_price = current_price
                
        if executed:
            # Complete execution
            try:
                execute_trade(order["id"], symbol, side, qty, execution_price, currency, config["name"], config["category"])
                logger.info(f"Order Executed: {side} {qty} {symbol} at {execution_price} {currency}")
            except Exception as ex:
                logger.error(f"Failed to match pending order {order['id']}: {ex}")

def execute_trade(order_id: str, symbol: str, side: str, quantity: float, price: float, currency: str, name: str, category: str):
    """Deducts/adds cash, updates positions, cancels database order, and logs transaction."""
    total_cost = quantity * price
    portfolio = database.get_portfolio()
    
    # Verify balances
    if side == "BUY":
        cash_val = portfolio["usd_cash"] if currency == "USD" else portfolio["hkd_cash"]
        if cash_val < total_cost:
            # Check if we can automatically convert other currency to complete trade
            other_curr = "HKD" if currency == "USD" else "USD"
            other_cash = portfolio["hkd_cash"] if currency == "USD" else portfolio["usd_cash"]
            
            # Conversion rate
            rate = 1.0 / USD_HKD_RATE if currency == "USD" else USD_HKD_RATE # HKD to USD or USD to HKD
            required_in_other = (total_cost - cash_val) * rate
            
            if other_cash >= required_in_other:
                # Auto convert!
                database.update_cash(other_curr, -required_in_other)
                database.update_cash(currency, total_cost - cash_val)
                database.log_transaction(
                    symbol="CURRENCY_CONV",
                    side="SELL" if currency == "USD" else "BUY",
                    quantity=required_in_other,
                    price=1/rate,
                    currency=other_curr,
                    description=f"Auto-converted {round(required_in_other, 2)} {other_curr} to {round(total_cost - cash_val, 2)} {currency} for {symbol} trade."
                )
            else:
                raise ValueError("Insufficient Cash to execute trade (even with auto-conversion)")
                
        # Perform trade
        database.update_cash(currency, -total_cost)
        database.update_holding(symbol, name, category, quantity, price)
        database.log_transaction(symbol, "BUY", quantity, price, currency, f"Purchased {quantity} shares/units of {symbol} at {price} {currency}")
        
    elif side == "SELL":
        holding = database.get_holding(symbol)
        if not holding or holding["quantity"] < quantity:
            raise ValueError(f"Insufficient holding of {symbol} to sell")
            
        database.update_cash(currency, total_cost)
        database.update_holding(symbol, name, category, -quantity, price)
        database.log_transaction(symbol, "SELL", quantity, price, currency, f"Sold {quantity} shares/units of {symbol} at {price} {currency}")
        
    # Cancel / Remove the order if it was a pending order
    if order_id:
        database.cancel_db_order(order_id)

def distribute_staking_yields():
    """Calculates APY divided by rapid time scale and credits cryptocurrency staking accounts."""
    holdings = database.get_holdings()
    for h in holdings:
        staked = h["staked_quantity"]
        if staked > 0.0:
            symbol = h["symbol"]
            apy = ASSETS[symbol].get("staking_apy", 0.0)
            
            # Since simulation timer cycles fast, let's treat every 5 seconds as a simulated "week" of rewards.
            # Staking Yield = Quantity * APY * (1 week / 52 weeks)
            earned_qty = staked * apy * (1 / 52)
            
            if earned_qty > 0:
                # Add staking rewards back into the asset holding quantity (Compounding Staking!)
                database.update_holding(symbol, h["name"], h["category"], earned_qty, MARKET_DATA[symbol]["price"])
                database.log_transaction(
                    symbol=symbol,
                    side="STAKING_REWARD",
                    quantity=earned_qty,
                    price=MARKET_DATA[symbol]["price"],
                    currency="USD",
                    description=f"Earned {round(earned_qty, 6)} {symbol} Staking Rewards (APY {round(apy*100, 2)}%)"
                )

def distribute_stock_dividends():
    """Processes stock dividends. Reinvests (DRIP) if enabled, otherwise pays cash."""
    holdings = database.get_holdings()
    for h in holdings:
        qty = h["quantity"]
        if qty > 0.0:
            symbol = h["symbol"]
            div_yield = ASSETS[symbol].get("div_yield", 0.0)
            if div_yield > 0.0:
                # Treat every 60 seconds as a "quarterly dividend distribution"
                # Dividend payout = current price * dividend yield * (1 quarter / 4 quarters)
                price = MARKET_DATA[symbol]["price"]
                div_payout_per_share = price * div_yield * 0.25
                total_dividend = qty * div_payout_per_share
                currency = ASSETS[symbol]["currency"]
                
                if total_dividend > 0:
                    drip = h["drip_enabled"] == 1
                    
                    if drip:
                        # Reinvest! Buy additional shares (fractional shares allowed for DRIP)
                        reinvest_qty = total_dividend / price
                        database.update_holding(symbol, h["name"], h["category"], reinvest_qty, price)
                        database.log_transaction(
                            symbol=symbol,
                            side="DIVIDEND_REINVEST",
                            quantity=reinvest_qty,
                            price=price,
                            currency=currency,
                            description=f"DRIP Reinvested: {round(total_dividend, 2)} {currency} dividend bought {round(reinvest_qty, 5)} additional shares of {symbol}."
                        )
                    else:
                        # Pay Cash!
                        database.update_cash(currency, total_dividend)
                        database.log_transaction(
                            symbol=symbol,
                            side="DIVIDEND_CASH",
                            quantity=qty,
                            price=div_payout_per_share,
                            currency=currency,
                            description=f"Paid cash dividend of {round(total_dividend, 2)} {currency} on {qty} shares."
                        )
