// Front-end API Client service layer
const API_BASE = "http://localhost:8000";

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown server error" }));
    throw new Error(errorData.detail || "Server error occurred");
  }
  return response.json();
}

export const api = {
  // Market Tickers & Feeds
  async getMarketPrices() {
    const resp = await fetch(`${API_BASE}/market/prices`);
    return handleResponse(resp);
  },

  async getMarketHistory(symbol: string) {
    const resp = await fetch(`${API_BASE}/market/history/${symbol}`);
    return handleResponse(resp);
  },

  // Portfolio Operations
  async getPortfolio() {
    const resp = await fetch(`${API_BASE}/portfolio`);
    return handleResponse(resp);
  },

  async placeTrade(trade: {
    symbol: string;
    side: "BUY" | "SELL";
    order_type: "MARKET" | "LIMIT" | "STOP";
    quantity: number;
    limit_price?: number;
    stop_price?: number;
  }) {
    const resp = await fetch(`${API_BASE}/portfolio/trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trade),
    });
    return handleResponse(resp);
  },

  async getActiveOrders() {
    const resp = await fetch(`${API_BASE}/portfolio/orders`);
    return handleResponse(resp);
  },

  async cancelOrder(orderId: string) {
    const resp = await fetch(`${API_BASE}/portfolio/orders/cancel?order_id=${orderId}`, {
      method: "POST",
    });
    return handleResponse(resp);
  },

  async toggleDrip(symbol: string, enabled: boolean) {
    const resp = await fetch(`${API_BASE}/portfolio/drip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, enabled }),
    });
    return handleResponse(resp);
  },

  async manageStaking(symbol: string, action: "STAKE" | "UNSTAKE", quantity: number) {
    const resp = await fetch(`${API_BASE}/portfolio/stake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, action, quantity }),
    });
    return handleResponse(resp);
  },

  async getTransactions() {
    const resp = await fetch(`${API_BASE}/portfolio/transactions`);
    return handleResponse(resp);
  },

  // Academy Operations
  async getLessons() {
    const resp = await fetch(`${API_BASE}/academy/lessons`);
    return handleResponse(resp);
  },

  async getLessonDetail(lessonId: string) {
    const resp = await fetch(`${API_BASE}/academy/lessons/${lessonId}`);
    return handleResponse(resp);
  },

  async submitQuizScore(lessonId: string, score: number, completed: boolean) {
    const resp = await fetch(`${API_BASE}/academy/lessons/${lessonId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, completed }),
    });
    return handleResponse(resp);
  },

  // Quant Playground Subprocess Execution
  async runPlaygroundScript(scriptName: string, args: string[] = []) {
    const resp = await fetch(`${API_BASE}/playground/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script_name: scriptName, args }),
    });
    return handleResponse(resp);
  },
};
export default api;
