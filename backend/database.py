import sqlite3
import os
import uuid
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "simulator.db")

def get_db_connection():
    """Returns a connection to the SQLite database with dict factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes database tables if they do not exist and sets up initial cash balances."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Create Portfolio Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolio (
        id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one portfolio row exists
        usd_cash REAL NOT NULL DEFAULT 100000.0,
        hkd_cash REAL NOT NULL DEFAULT 800000.0
    )
    """)

    # 2. Create Holdings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS holdings (
        symbol TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL, -- 'US_STOCK', 'HK_STOCK', 'CRYPTO'
        quantity REAL NOT NULL DEFAULT 0.0,
        avg_buy_price REAL NOT NULL DEFAULT 0.0,
        drip_enabled INTEGER NOT NULL DEFAULT 0, -- 0 = False, 1 = True
        staked_quantity REAL NOT NULL DEFAULT 0.0 -- Used for Crypto Staking
    )
    """)

    # 3. Create Pending Orders Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL, -- 'BUY' or 'SELL'
        order_type TEXT NOT NULL, -- 'LIMIT' or 'STOP'
        quantity REAL NOT NULL,
        limit_price REAL, -- Used for Limit orders
        stop_price REAL, -- Used for Stop-loss orders
        created_at TEXT NOT NULL
    )
    """)

    # 4. Create Transaction History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL, -- 'BUY', 'SELL', 'DIVIDEND', 'STAKING_REWARD'
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        total_amount REAL NOT NULL,
        currency TEXT NOT NULL, -- 'USD' or 'HKD'
        description TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)

    # 5. Create Academy Progress Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS academy (
        lesson_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0, -- 0 = No, 1 = Yes
        quiz_score INTEGER DEFAULT -1, -- -1 means quiz not taken
        completed_at TEXT
    )
    """)

    # Seed Initial Portfolio Cash if empty
    cursor.execute("SELECT COUNT(*) FROM portfolio")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO portfolio (id, usd_cash, hkd_cash) VALUES (1, 100000.0, 800000.0)")

    conn.commit()
    conn.close()

# Helper Functions for CRUD Operations

def get_portfolio():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT usd_cash, hkd_cash FROM portfolio WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"usd_cash": row["usd_cash"], "hkd_cash": row["hkd_cash"]}
    return {"usd_cash": 100000.0, "hkd_cash": 800000.0}

def update_cash(currency: str, amount: float):
    """Adds to cash balance (amount can be negative to subtract)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    col = "usd_cash" if currency.upper() == "USD" else "hkd_cash"
    cursor.execute(f"UPDATE portfolio SET {col} = {col} + ? WHERE id = 1", (amount,))
    conn.commit()
    conn.close()

def get_holdings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT symbol, name, category, quantity, avg_buy_price, drip_enabled, staked_quantity FROM holdings WHERE quantity > 0 OR staked_quantity > 0")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_holding(symbol: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT symbol, name, category, quantity, avg_buy_price, drip_enabled, staked_quantity FROM holdings WHERE symbol = ?", (symbol,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_holding(symbol: str, name: str, category: str, delta_qty: float, price: float):
    """Updates position size and average cost basis when a trade executes."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT quantity, avg_buy_price FROM holdings WHERE symbol = ?", (symbol,))
    row = cursor.fetchone()

    if row:
        current_qty = row["quantity"]
        current_avg = row["avg_buy_price"]
        new_qty = current_qty + delta_qty

        if new_qty <= 0:
            # Position closed
            cursor.execute("DELETE FROM holdings WHERE symbol = ?", (symbol,))
        else:
            # Update average price if buying, otherwise keep cost basis the same (standard FIFO/weighted-avg logic)
            if delta_qty > 0:
                new_avg = ((current_qty * current_avg) + (delta_qty * price)) / new_qty
            else:
                new_avg = current_avg
            cursor.execute("UPDATE holdings SET quantity = ?, avg_buy_price = ? WHERE symbol = ?", (new_qty, new_avg, symbol))
    else:
        if delta_qty > 0:
            cursor.execute("INSERT INTO holdings (symbol, name, category, quantity, avg_buy_price) VALUES (?, ?, ?, ?, ?)",
                           (symbol, name, category, delta_qty, price))
            
    conn.commit()
    conn.close()

def update_drip(symbol: str, enabled: bool):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE holdings SET drip_enabled = ? WHERE symbol = ?", (1 if enabled else 0, symbol))
    conn.commit()
    conn.close()

def update_staking(symbol: str, delta_stake: float):
    """Stakes or unstakes crypto assets."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT quantity, staked_quantity FROM holdings WHERE symbol = ?", (symbol,))
    row = cursor.fetchone()
    if row:
        qty = row["quantity"]
        staked = row["staked_quantity"]
        
        # Ensure they have enough unstaked quantity to stake, or enough staked to unstake
        if delta_stake > 0 and qty < delta_stake:
            conn.close()
            raise ValueError("Insufficient unstaked holding to stake")
        if delta_stake < 0 and staked < abs(delta_stake):
            conn.close()
            raise ValueError("Insufficient staked holding to unstake")
            
        cursor.execute("UPDATE holdings SET quantity = quantity - ?, staked_quantity = staked_quantity + ? WHERE symbol = ?",
                       (delta_stake, delta_stake, symbol))
    conn.commit()
    conn.close()

def place_db_order(symbol: str, side: str, order_type: str, quantity: float, limit_price: float = None, stop_price: float = None):
    order_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO orders (id, symbol, side, order_type, quantity, limit_price, stop_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                   (order_id, symbol, side.upper(), order_type.upper(), quantity, limit_price, stop_price, created_at))
    conn.commit()
    conn.close()
    return order_id

def get_orders():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, symbol, side, order_type, quantity, limit_price, stop_price, created_at FROM orders ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def cancel_db_order(order_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    conn.commit()
    conn.close()

def log_transaction(symbol: str, side: str, quantity: float, price: float, currency: str, description: str):
    timestamp = datetime.utcnow().isoformat()
    total_amount = quantity * price
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO transactions (symbol, side, quantity, price, total_amount, currency, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                   (symbol, side.upper(), quantity, price, total_amount, currency, description, timestamp))
    conn.commit()
    conn.close()

def get_transactions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, symbol, side, quantity, price, total_amount, currency, description, timestamp FROM transactions ORDER BY timestamp DESC LIMIT 100")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_academy_progress():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lesson_id, title, completed, quiz_score, completed_at FROM academy")
    rows = cursor.fetchall()
    conn.close()
    return {row["lesson_id"]: dict(row) for row in rows}

def save_academy_progress(lesson_id: str, title: str, completed: bool, score: int):
    completed_at = datetime.utcnow().isoformat() if completed else None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO academy (lesson_id, title, completed, quiz_score, completed_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(lesson_id) DO UPDATE SET
        completed = EXCLUDED.completed,
        quiz_score = MAX(quiz_score, EXCLUDED.quiz_score),
        completed_at = COALESCE(completed_at, EXCLUDED.completed_at)
    """, (lesson_id, title, 1 if completed else 0, score, completed_at))
    conn.commit()
    conn.close()

# Run database setup immediately
init_db()
