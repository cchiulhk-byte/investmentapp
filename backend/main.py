import os
import sys
import asyncio
import subprocess
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import database
import simulator
import academy

app = FastAPI(
    title="ApexInvest Simulator & Academy Backend",
    description="Python FastAPI REST endpoints for simulated trading and academic operations.",
    version="1.0.0"
)

# Enable CORS for the frontend dev server (Vite defaults to localhost:5173 or other ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Lifecycle
@app.on_event("startup")
async def startup_event():
    # Start the real-time background market simulator loop
    asyncio.create_task(simulator.run_simulation_loop())
    print("[✓] FastAPI server started. Live market simulation loop is running...")

# Request/Response Pydantic schemas
class TradeRequest(BaseModel):
    symbol: str
    side: str # 'BUY' or 'SELL'
    order_type: str # 'MARKET', 'LIMIT', 'STOP'
    quantity: float
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None

class DripRequest(BaseModel):
    symbol: str
    enabled: bool

class StakeRequest(BaseModel):
    symbol: str
    action: str # 'STAKE' or 'UNSTAKE'
    quantity: float

class QuizSubmitRequest(BaseModel):
    score: int
    completed: bool

class PlaygroundRunRequest(BaseModel):
    script_name: str # 'drip_calculator', 'grid_bot', 'portfolio_analyzer'
    args: List[str] = []

# REST Endpoints

@app.get("/market/prices")
def get_market_prices():
    """Returns real-time simulated prices, 24h highs/lows, changes, and active order books."""
    return list(simulator.MARKET_DATA.values())

@app.get("/market/history/{symbol}")
def get_market_history(symbol: str):
    """Returns historical OHLC bars for canvas or SVG charts."""
    symbol = symbol.upper()
    if symbol not in simulator.MARKET_DATA:
        raise HTTPException(status_code=404, detail="Symbol not found")
    return simulator.MARKET_DATA[symbol]["history"]

@app.get("/portfolio")
def get_portfolio_status():
    """Returns cash balances, detailed active positions (holdings), and realized metrics."""
    cash = database.get_portfolio()
    holdings = database.get_holdings()
    
    # Calculate live valuation of the portfolio
    holdings_valuation_usd = 0.0
    holdings_valuation_hkd = 0.0
    
    detailed_holdings = []
    for h in holdings:
        symbol = h["symbol"]
        qty = h["quantity"]
        staked = h["staked_quantity"]
        avg_price = h["avg_buy_price"]
        
        # Get live ticker price
        live_data = simulator.MARKET_DATA.get(symbol)
        if not live_data:
            continue
            
        current_price = live_data["price"]
        currency = live_data["currency"]
        
        # Value calculations
        total_qty = qty + staked
        current_value = total_qty * current_price
        total_cost = total_qty * avg_price
        unrealized_pnl = current_value - total_cost
        unrealized_pnl_pct = (unrealized_pnl / total_cost * 100) if total_cost > 0 else 0.0
        
        # Convert valuations to dual base currencies
        if currency == "USD":
            val_usd = current_value
            val_hkd = current_value * simulator.USD_HKD_RATE
        else: # HKD
            val_usd = current_value / simulator.USD_HKD_RATE
            val_hkd = current_value
            
        holdings_valuation_usd += val_usd
        holdings_valuation_hkd += val_hkd
        
        detailed_holdings.append({
            **h,
            "current_price": current_price,
            "market_value": round(current_value, 2),
            "currency": currency,
            "unrealized_pnl": round(unrealized_pnl, 2),
            "unrealized_pnl_pct": round(unrealized_pnl_pct, 2)
        })
        
    net_worth_usd = cash["usd_cash"] + (cash["hkd_cash"] / simulator.USD_HKD_RATE) + holdings_valuation_usd
    net_worth_hkd = (cash["usd_cash"] * simulator.USD_HKD_RATE) + cash["hkd_cash"] + holdings_valuation_hkd
    
    return {
        "cash": cash,
        "holdings": detailed_holdings,
        "valuation": {
            "holdings_value_usd": round(holdings_valuation_usd, 2),
            "holdings_value_hkd": round(holdings_valuation_hkd, 2),
            "net_worth_usd": round(net_worth_usd, 2),
            "net_worth_hkd": round(net_worth_hkd, 2)
        }
    }

@app.post("/portfolio/trade")
def place_trade(trade: TradeRequest):
    """Executes market trades immediately or saves limit/stop orders into the matching book."""
    symbol = trade.symbol.upper()
    side = trade.side.upper()
    order_type = trade.order_type.upper()
    
    if symbol not in simulator.ASSETS:
        raise HTTPException(status_code=400, detail="Unsupported symbol")
    if side not in ["BUY", "SELL"]:
        raise HTTPException(status_code=400, detail="Invalid trade side")
    if order_type not in ["MARKET", "LIMIT", "STOP"]:
        raise HTTPException(status_code=400, detail="Invalid order type")
    if trade.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
        
    config = simulator.ASSETS[symbol]
    
    # Enforce Lot Sizing rules for HK stocks
    if config["category"] == "HK_STOCK":
        lot_size = config["lot_size"]
        # Allow partial board lot sales (in case they got fractional shares via DRIP reinvestment)
        if side == "BUY" and (trade.quantity % lot_size != 0):
            raise HTTPException(
                status_code=400,
                detail=f"HK Board Lot Rule: Orders for {symbol} must be placed in multiples of its board lot size ({lot_size} shares)."
            )
            
    # Process Order Execution
    if order_type == "MARKET":
        current_price = simulator.MARKET_DATA[symbol]["price"]
        try:
            simulator.execute_trade(
                order_id=None,
                symbol=symbol,
                side=side,
                quantity=trade.quantity,
                price=current_price,
                currency=config["currency"],
                name=config["name"],
                category=config["category"]
            )
            return {"status": "success", "message": f"Market trade executed for {trade.quantity} {symbol}."}
        except ValueError as ex:
            raise HTTPException(status_code=400, detail=str(ex))
            
    else: # LIMIT or STOP order
        if order_type == "LIMIT" and trade.limit_price is None:
            raise HTTPException(status_code=400, detail="Limit price is required for Limit orders")
        if order_type == "STOP" and trade.stop_price is None:
            raise HTTPException(status_code=400, detail="Stop price is required for Stop orders")
            
        order_id = database.place_db_order(
            symbol=symbol,
            side=side,
            order_type=order_type,
            quantity=trade.quantity,
            limit_price=trade.limit_price,
            stop_price=trade.stop_price
        )
        return {"status": "pending", "order_id": order_id, "message": f"{order_type} order saved in matching book."}

@app.get("/portfolio/orders")
def get_active_orders():
    """Lists all active pending limit/stop orders."""
    return database.get_orders()

@app.post("/portfolio/orders/cancel")
def cancel_order(order_id: str = Query(...)):
    """Cancels a pending order."""
    database.cancel_db_order(order_id)
    return {"status": "success", "message": "Order cancelled successfully."}

@app.post("/portfolio/drip")
def toggle_drip(req: DripRequest):
    """Enables or disables automatic Dividend Reinvestment Plan (DRIP) for stock holdings."""
    symbol = req.symbol.upper()
    database.update_drip(symbol, req.enabled)
    state = "enabled" if req.enabled else "disabled"
    return {"status": "success", "message": f"DRIP {state} for {symbol}."}

@app.post("/portfolio/stake")
def manage_staking(req: StakeRequest):
    """Stakes or unstakes cryptocurrencies into proof-of-stake yield pools."""
    symbol = req.symbol.upper()
    action = req.action.upper()
    
    if symbol not in simulator.ASSETS or "staking_apy" not in simulator.ASSETS[symbol]:
        raise HTTPException(status_code=400, detail=f"Staking not supported for symbol {symbol}")
    if action not in ["STAKE", "UNSTAKE"]:
        raise HTTPException(status_code=400, detail="Action must be 'STAKE' or 'UNSTAKE'")
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
        
    try:
        delta = req.quantity if action == "STAKE" else -req.quantity
        database.update_staking(symbol, delta)
        database.log_transaction(
            symbol=symbol,
            side=action,
            quantity=req.quantity,
            price=simulator.MARKET_DATA[symbol]["price"],
            currency="USD",
            description=f"{action.capitalize()}d {req.quantity} {symbol} into network staking pools."
        )
        return {"status": "success", "message": f"Successfully {action.lower()}d {req.quantity} {symbol}."}
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@app.get("/portfolio/transactions")
def get_ledger():
    """Returns transaction list logs (buys, sells, staking rewards, dividend cash & reinvestments)."""
    return database.get_transactions()

@app.get("/academy/lessons")
def get_academy_lessons():
    """Lists available courses and user completion scores."""
    lessons = academy.get_lessons_list()
    progress = database.get_academy_progress()
    
    # Merge progress state
    for l in lessons:
        prog = progress.get(l["id"])
        l["completed"] = prog["completed"] == 1 if prog else False
        l["quiz_score"] = prog["quiz_score"] if prog else -1
        
    return lessons

@app.get("/academy/lessons/{lesson_id}")
def get_lesson_detail(lesson_id: str):
    """Returns single lesson content with quiz parameters."""
    lesson = academy.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    progress = database.get_academy_progress()
    prog = progress.get(lesson_id)
    lesson_detail = dict(lesson)
    lesson_detail["completed"] = prog["completed"] == 1 if prog else False
    lesson_detail["quiz_score"] = prog["quiz_score"] if prog else -1
    return lesson_detail

@app.post("/academy/lessons/{lesson_id}/submit")
def submit_lesson_quiz(lesson_id: str, req: QuizSubmitRequest):
    """Saves quiz score and flags course completion."""
    lesson = academy.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    database.save_academy_progress(lesson_id, lesson["title"], req.completed, req.score)
    return {"status": "success", "message": "Academy progress recorded successfully."}

@app.post("/playground/run")
def run_playground_script(req: PlaygroundRunRequest):
    """
    Subprocess Launcher: Safe execution of predefined python scripts on the backend.
    Captures stdout in real-time and streams it back to the web console terminal.
    """
    script_name = req.script_name
    valid_scripts = {
        "drip_calculator": "drip_calculator.py",
        "grid_bot": "grid_bot.py",
        "portfolio_analyzer": "portfolio_analyzer.py"
    }
    
    if script_name not in valid_scripts:
        raise HTTPException(status_code=400, detail="Invalid playground script name")
        
    script_file = valid_scripts[script_name]
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "playground", script_file)
    
    if not os.path.exists(script_path):
        raise HTTPException(status_code=500, detail=f"Playground script {script_file} not found on server")
        
    # Execute the script via subprocess using current Python executable
    try:
        cmd = [sys.executable, script_path] + req.args
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10) # 10-second timeout safety cap
        
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.returncode
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Execution timed out (10s limit exceeded)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subprocess execution error: {str(e)}")
