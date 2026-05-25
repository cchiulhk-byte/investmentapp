from typing import List, Dict, Any

LESSONS = [
    {
        "id": "lesson_1",
        "title": "US vs. Hong Kong Stock Markets",
        "category": "Stocks",
        "reading_time": "4 min",
        "summary": "Learn the structural differences between US and Hong Kong stock markets, including trading currencies, lot sizes, and transactional stamp duties.",
        "content": """
### 1. The Sizing Difference: Fractional vs. Board Lots
One of the most critical differences for beginners is how stocks are packaged for purchase:
*   **United States (US):** Supports **Fractional Shares**. You can buy exactly $1, $5, or 1.25 shares of expensive stocks like NVIDIA (NVDA) or Apple (AAPL).
*   **Hong Kong (HK):** Employs **Board Lots**. Shares are sold in mandatory block sizes determined by the company (e.g., 100, 400, or 1,000 shares). If Tencent (0700.HK) trades at HKD 400 per share and the lot size is 100, your *minimum entry barrier* is **HKD 40,000**! You cannot purchase 1 or 5 shares.

### 2. Trading Currencies & Exchange Rate Risk
*   **US Market:** Traded in US Dollars (USD).
*   **HK Market:** Traded in Hong Kong Dollars (HKD).
*   *Note:* If your primary currency is HKD, purchasing US stocks exposes you to foreign exchange fluctuations (USD/HKD pegs sometimes shift, or broker conversions eat into returns).

### 3. Transaction Costs & Stamp Duties
Trading costs vary significantly:
*   **US Market:** Most retail brokers offer **$0 commission** trading. There are no state transactional taxes on buying.
*   **HK Market:** Enforces a government **Stamp Duty** (currently 0.1% or 0.13% of the trade value). While this sounds small, buying and selling a HKD 100,000 lot will instantly cost HKD 130 in taxes alone, on top of exchange levies and broker clearing fees.

### Summary Strategy
US markets are highly accessible with tiny capital (due to fractional shares and zero commission). HK markets require larger starting capital due to board lot sizes and have slightly higher tax structures, but hold prestigious dividend-paying blue chips (like HSBC and HK utility stocks) crucial for passive income.
""",
        "interactive_exercise": {
            "type": "lot_calculator",
            "instruction": "Calculate the minimum HKD capital required to buy HSBC Holdings (0005.HK) if the share price is HKD 65.00 and the board lot size is 400 shares.",
            "placeholder": "Enter capital in HKD",
            "answer": "26000",
            "explanation": "Correct! Minimum Capital = Share Price * Board Lot Size = 65.00 * 400 = HKD 26,000. Under HK rules, you cannot buy HSBC with less capital!"
        },
        "quiz": [
            {
                "question": "If Apple (AAPL) is trading at $180 USD, what is the minimum amount of capital you need to buy into it on the US market?",
                "options": [
                    "$180 USD because you must buy at least 1 whole share.",
                    "$1,800 USD due to standard 10-share board lot requirements.",
                    "As little as $1 USD because the US market supports fractional shares.",
                    "Free, because US brokers charge zero commissions."
                ],
                "correct_index": 2,
                "explanation": "Correct! US brokers and exchanges widely support fractional share trading, meaning you can buy dollar amounts (e.g. $1 or $10) instead of being forced to buy whole shares."
            },
            {
                "question": "What is 'Board Lot Size' in the Hong Kong stock market?",
                "options": [
                    "The maximum number of shares a board member can trade.",
                    "The minimum standardized bundle of shares required for a transaction.",
                    "The total quantity of shares currently listed on the exchange board.",
                    "A flat-rate tax paid to the HK Exchange."
                ],
                "correct_index": 1,
                "explanation": "Correct! A board lot is the minimum size of a trading unit. You can only place orders in multiples of the board lot size (e.g., packages of 100, 500, or 1000 shares)."
            },
            {
                "question": "Which transactional fee is unique to trading in the Hong Kong Stock Market compared to the US?",
                "options": [
                    "Broker Commission.",
                    "Securities Exchange Clearing Fees.",
                    "Government Stamp Duty (0.13%).",
                    "Currency Conversion Spread."
                ],
                "correct_index": 2,
                "explanation": "Correct! The Hong Kong government levies a Stamp Duty on all stock trades (levied on both purchase and sale), which represents a direct transaction fee absent from standard US equity trades."
            }
        ]
    },
    {
        "id": "lesson_2",
        "title": "Mastering Order Types: Limit vs. Market vs. Stop-Loss",
        "category": "Risk Management",
        "reading_time": "5 min",
        "summary": "Master the controls of a trading terminal. Understand how to place orders that protect your capital and execute trades at the price you want.",
        "content": """
### 1. Market Order: Speed over Price Control
A **Market Order** executes immediately at the *best available current price*.
*   **Pros:** Guaranteed execution. Fast.
*   **Cons:** No price control. In volatile markets or for low-volume assets, you might experience **slippage** (buying at a much higher price or selling at a lower price than expected).
*   *Best Use:* Highly liquid stocks (e.g. AAPL) during normal market hours when you just want to buy or sell immediately.

### 2. Limit Order: Price Control over Speed
A **Limit Order** executes *only* at your specified target price or better.
*   **Limit Buy:** Placed *below* current market price. Executes only if the price drops to or below your limit.
*   **Limit Sell:** Placed *above* current market price. Executes only if the price rises to or above your limit.
*   **Pros:** Complete price certainty. You never pay more or sell for less than your target.
*   **Cons:** No guarantee of execution. If the price never hits your limit, your order stays pending forever.
*   *Best Use:* Accumulating shares when you think the market will dip, or selling when targeting a specific profit boundary.

### 3. Stop-Loss Order: The Ultimate Safety Net
A **Stop Order** remains dormant until the asset hits a trigger price (the **Stop Price**), at which point it automatically converts into a **Market Order** to sell.
*   **Pros:** Prevents catastrophic losses. Automates risk management so you do not have to watch charts 24/7.
*   **Cons:** Once triggered, it becomes a market order. If the price drops extremely fast, you might sell slightly below your stop price.
*   *Best Use:* Setting a 'safety floor' at 5% to 10% below your buy-in price to protect your capital.

### Summary Strategy
Never buy volatile assets using Market Orders. Use **Limit Orders** to buy at fair prices, and immediately set a **Stop-Loss Order** to manage your downside risk.
""",
        "interactive_exercise": {
            "type": "order_matcher",
            "instruction": "Tesla is trading at $200. You want to buy it, but only if it dips to $195. What order type should you place?",
            "placeholder": "Type: LIMIT BUY or MARKET BUY",
            "answer": "LIMIT BUY",
            "explanation": "Correct! A Limit Buy order should be placed at $195. It will wait in the order book and execute only if Tesla's price drops to $195 or lower."
        },
        "quiz": [
            {
                "question": "What is the primary risk of using a Market Order in a highly volatile market?",
                "options": [
                    "The order will be rejected by the exchange.",
                    "Slippage, meaning you execute at a price far worse than anticipated.",
                    "You will be charged double commissions.",
                    "Your order will stay pending and never fill."
                ],
                "correct_index": 1,
                "explanation": "Correct! Market orders prioritize speed of execution over price. In fast-moving markets, the price can jump in milliseconds, causing your fill price to be much worse than what you saw on your screen (slippage)."
            },
            {
                "question": "You own Bitcoin at $65,000. You want to ensure you sell it immediately if it crashes below $60,000 to avoid losing more money. What order should you set?",
                "options": [
                    "A Limit Buy order at $60,000.",
                    "A Limit Sell order at $60,000.",
                    "A Stop-Loss Sell order with a stop price of $60,000.",
                    "A Market Buy order."
                ],
                "correct_index": 2,
                "explanation": "Correct! A Stop-Loss Sell order acts as a safety floor. Once the price crosses below $60,000, it triggers an automatic market sell to lock in your position and prevent further losses."
            },
            {
                "question": "If you place a Limit Sell order at $150 USD when Solana is trading at $140 USD, what happens?",
                "options": [
                    "It sells immediately at $140.",
                    "It is placed in the order book as an ask, and will execute only if Solana rises to $150 or higher.",
                    "It executes immediately at $150 by borrowing shares.",
                    "It is rejected because limit prices must be below current prices."
                ],
                "correct_index": 1,
                "explanation": "Correct! A Limit Sell order above the current price is placed on the Ask side of the order book. It will wait until buy demand drives the market price up to $150 or above to execute."
            }
        ]
    },
    {
        "id": "lesson_3",
        "title": "Understanding Cryptocurrencies & Staking Yield Pools",
        "category": "Cryptocurrency",
        "reading_time": "5 min",
        "summary": "Demystify blockchain, wallets, high volatility, and how to safely put your digital assets to work through Proof-of-Stake staking pools.",
        "content": """
### 1. Crypto Volatility & 24/7 Markets
Cryptocurrencies (like Bitcoin, Ethereum, and Solana) operate on decentralized blockchains.
*   **No Trading Breaks:** Unlike stock markets (which close on weekends and evenings), crypto markets are active **24/7/365**.
*   **High Volatility:** Prices move rapidly due to speculative sentiment, lack of central backstops, and leverage. Shifts of 10% to 20% in a single day are common.

### 2. How Staking Generates Passive Income
Staking is the crypto equivalent of earning high-yield interest on your savings, but with unique mechanics:
*   **Proof of Stake (PoS):** Modern blockchains (Ethereum, Solana) secure their networks by having participants pledge (stake) their coins as collateral to validator nodes.
*   **Staking APY:** By locking up your assets to support validators, the network rewards you with newly minted coins and transaction fees. Staking APY (Annual Percentage Yield) typically ranges from **3% to 8%**.

### 3. The Major Risks of Crypto Staking
Staking is not risk-free money. You must watch out for:
*   **Price Volatility Risk:** If you earn 5% APY in ETH, but the price of ETH crashes by 50%, you have still lost substantial value in fiat (dollar) terms.
*   **Lock-up / Unstaking Periods:** Unstaking coordinates can take days or weeks (e.g., unstaking Ethereum can take hours to days). You cannot sell your coins during this lock-up window even if the market starts crashing!
*   **Slashing Risk:** If the validator node you stake with acts maliciously or experiences severe offline downtime, the blockchain network can penalize them by **slashing** (destroying) a portion of your staked tokens!

### Summary Strategy
Crypto staking offers excellent yield compared to traditional banks, but you should only stake crypto assets you plan to hold long-term, and diversify across multiple reputable validators to mitigate slashing risk.
""",
        "interactive_exercise": {
            "type": "staking_yield_calculator",
            "instruction": "If you stake 10 Ethereum (ETH) at a 5% Staking APY, how much ETH will you earn in rewards over one full year (ignoring gas fees)?",
            "placeholder": "Enter ETH amount earned",
            "answer": "0.5",
            "explanation": "Correct! 10 ETH * 5% APY = 0.5 ETH earned over a year. Your total holding would grow to 10.5 ETH."
        },
        "quiz": [
            {
                "question": "What is the network mechanism that allows crypto holders to earn passive yield by locking their assets to secure the blockchain?",
                "options": [
                    "Proof of Work mining.",
                    "Proof of Stake staking.",
                    "Centralized bank arbitrage.",
                    "Automated market makers (AMMs)."
                ],
                "correct_index": 1,
                "explanation": "Correct! Proof of Stake (PoS) blockchains reward holders who stake their tokens to validators to secure transactions and write new blocks."
            },
            {
                "question": "What is 'Slashing Risk' in the context of cryptocurrency staking?",
                "options": [
                    "A transaction fee charged when you unstake your tokens.",
                    "A drop in token price due to rapid sell-offs.",
                    "A network penalty that confiscates/destroys staked tokens if the validator acts maliciously or goes offline.",
                    "A hacking event that drains staking wallets."
                ],
                "correct_index": 2,
                "explanation": "Correct! Slashing is a built-in security protocol of PoS blockchains. If a validator acts dishonestly or violates consensus rules, both the validator and its stakers lose a percentage of their staked collateral."
            },
            {
                "question": "Why is lock-up/unstaking delay a significant risk during a market downturn?",
                "options": [
                    "Because gas fees double during unstaking.",
                    "Because you cannot trade or sell your staked assets immediately while they are pending unstaking.",
                    "Because validators automatically keep all rewards if you unstake during a drop.",
                    "Because the coins disappear into the blockchain pool."
                ],
                "correct_index": 1,
                "explanation": "Correct! Staked crypto assets usually require an 'unbonding' or unstaking cooling-off period (ranging from 3 to 21 days depending on the network). During this time, you cannot sell, making you helpless if the price is dropping rapidly."
            }
        ]
    },
    {
        "id": "lesson_4",
        "title": "The Power of Passive Income & DRIP Compounding",
        "category": "Passive Income",
        "reading_time": "5 min",
        "summary": "Discover the mathematics of dividends, compound interest, and how a Dividend Reinvestment Plan (DRIP) can compound wealth exponentially.",
        "content": """
### 1. Dividends: Cashflows from Equities
When companies earn profits, they can reinvest them in growth, or distribute them back to shareholders as cash payments called **Dividends**.
*   **Dividend Yield:** Expressed as a percentage of the share price. (e.g. If HSBC trades at HKD 60 and pays HKD 3.6 in annual dividends, its Dividend Yield is **6%**).
*   **Dividend Payout Ratio:** The percentage of earnings a company pays as dividends. A ratio over 80% might mean the company is underinvesting in growth or has an unsustainable payout.

### 2. DRIP: The Compounding Accelerator
A **Dividend Reinvestment Plan (DRIP)** is a feature where dividends are *automatically reinvested* to buy additional shares (or fractional shares) of the company, instead of paying out as raw cash.

Let's look at the math over time:
*   **Without DRIP:** You own 100 shares of Dividend Corp. They pay dividends. Your share count *stays* at 100, and you collect cash.
*   **With DRIP:** You reinvest. Next quarter, you own **101.5** shares. The next dividend is calculated on 101.5 shares, paying you *more* cash, which buys *even more* shares.

### 3. The Exponential Compounding Curve
Compound interest is when you earn interest on your interest.
*   **Linear Growth:** Collecting cash and keeping it in a non-interest account.
*   **Exponential Growth:** Reinvesting through DRIP. Over 5 to 10 years, the difference is noticeable. Over 20 to 30 years, **DRIP portfolios can grow to 3x or 4x the value** of non-reinvested portfolios, because your share quantity increases automatically without you contributing another penny!

### Summary Strategy
For long-term passive income, select high-quality companies with sustainable dividend yields (4% to 6%) and keep **DRIP turned ON** during your wealth-building years. Turn it off to collect raw cash when you retire!
""",
        "interactive_exercise": {
            "type": "drip_projector",
            "instruction": "Suppose you start with $10,000 USD of a stock yielding 6% annually. If you use DRIP, about how much dividend cash will you receive in Year 2 compared to Year 1 ($600)?",
            "placeholder": "Estimate Year 2 Dividend",
            "answer": "636",
            "explanation": "Correct! In Year 1 you earn $600 and reinvest it. In Year 2, your principal is $10,600. 6% of $10,600 is $636! You made an extra $36 in dividend cash purely from compounding!"
        },
        "quiz": [
            {
                "question": "What is the primary function of a Dividend Reinvestment Plan (DRIP)?",
                "options": [
                    "To withdraw all dividends to a bank savings account.",
                    "To automatically buy more shares of the dividend-paying stock using the payout cash.",
                    "To secure a guaranteed tax refund on stock investments.",
                    "To reinvest cash into higher-risk crypto staking."
                ],
                "correct_index": 1,
                "explanation": "Correct! DRIP takes your cash dividend payouts and immediately puts them to work by purchasing more shares of the issuing company, compounding your share count."
            },
            {
                "question": "Why does DRIP accelerate wealth building over long time horizons?",
                "options": [
                    "It increases the stock price of the company.",
                    "It waives all broker maintenance fees.",
                    "It creates a snowball effect where you earn future dividends on previously reinvested dividends.",
                    "It guarantees that the company will never go bankrupt."
                ],
                "correct_index": 2,
                "explanation": "Correct! Each time DRIP buys shares, your base quantity increases. The subsequent dividend is paid on this larger base, generating a larger payout, which buys even more shares. This is the core of exponential compound interest."
            },
            {
                "question": "If a stock has a Dividend Yield of 12% but a Dividend Payout Ratio of 110%, what is the most likely risk?",
                "options": [
                    "The stock price will instantly double.",
                    "The dividend payout is highly sustainable.",
                    "The company is paying out more than it earns in profits, making a dividend cut highly likely.",
                    "The company is hiding cash in offshore vaults."
                ],
                "correct_index": 2,
                "explanation": "Correct! A payout ratio over 100% means the company is borrowing money or depleting cash reserves to pay dividends. This is highly unsustainable, and a dividend cut (reduction) is usually imminent, which often crashes the stock price."
            }
        ]
    },
    {
        "id": "lesson_5",
        "title": "ETFs & Index Funds: The Lazy Investor's Edge",
        "category": "Funds & ETFs",
        "reading_time": "5 min",
        "summary": "Understand how Exchange Traded Funds (ETFs) and index funds let you own hundreds of stocks in a single trade, reducing risk through instant diversification.",
        "content": """
### 1. What Are ETFs and Index Funds?
An **Exchange Traded Fund (ETF)** is a basket of securities (stocks, bonds, or commodities) bundled together and traded on a stock exchange just like a single share.

*   **ETF Example:** Buying 1 share of the S&P 500 ETF (SPY) gives you fractional exposure to all 500 largest US companies simultaneously — Apple, Microsoft, Amazon, NVIDIA, and 496 others.
*   **Index Fund:** A mutual fund that passively tracks a market index (like the Hang Seng Index or S&P 500). Unlike ETFs, they are bought/sold once per day at closing price.

### 2. Why ETFs Beat Stock Picking for Most Investors
*   **Instant Diversification:** One purchase gives you exposure to hundreds of companies. If any single company crashes, the impact on your portfolio is minimal.
*   **Lower Fees:** ETFs have expense ratios typically between 0.03% and 0.20% annually — far cheaper than actively managed funds (1% to 2%).
*   **Outperformance:** Over 15-year periods, more than **90% of active fund managers fail to beat** a simple S&P 500 index fund (after fees).

### 3. Types of ETFs Available
*   **Broad Market ETFs:** Track entire markets (S&P 500, MSCI World, Hang Seng Index).
*   **Sector ETFs:** Focus on specific industries (technology, healthcare, energy).
*   **Bond ETFs:** Provide fixed-income exposure without buying individual bonds.
*   **Thematic ETFs:** Target trends like AI, clean energy, or blockchain.

### 4. Dollar Cost Averaging (DCA) with ETFs
The optimal strategy for most ETF investors is **Dollar Cost Averaging**: investing a fixed dollar amount at regular intervals (e.g., $500/month), regardless of market conditions. This eliminates the need to time the market and smooths out your average purchase price over time.

### Summary Strategy
For the majority of investors, buying a low-cost broad market ETF monthly (DCA) will outperform most stock-picking strategies over 10+ years while requiring almost zero active management.
""",
        "interactive_exercise": {
            "type": "etf_calculator",
            "instruction": "If the S&P 500 ETF (SPY) has an expense ratio of 0.09% and you invest $50,000, how much in fees do you pay annually?",
            "placeholder": "Enter annual fee in USD",
            "answer": "45",
            "explanation": "Correct! $50,000 * 0.09% = $50,000 * 0.0009 = $45 per year. Compare that to a 1.5% actively managed fund which would charge $750!"
        },
        "quiz": [
            {
                "question": "What is the primary advantage of investing in a broad market ETF instead of individual stocks?",
                "options": [
                    "ETFs guarantee profits every year.",
                    "ETFs provide instant diversification across hundreds of companies, reducing single-stock risk.",
                    "ETFs are completely free of any fees.",
                    "ETFs allow you to short individual companies within the basket."
                ],
                "correct_index": 1,
                "explanation": "Correct! ETFs bundle hundreds or thousands of securities together. If one company in the basket crashes, its impact is diluted across all the other holdings."
            },
            {
                "question": "What does 'Dollar Cost Averaging (DCA)' mean in the context of ETF investing?",
                "options": [
                    "Buying ETFs only when the market drops more than 10%.",
                    "Investing a fixed dollar amount at regular intervals regardless of price.",
                    "Converting all your cash to dollars before buying.",
                    "Averaging your portfolio returns across multiple broker accounts."
                ],
                "correct_index": 1,
                "explanation": "Correct! DCA means investing consistently (e.g., $500 every month) without trying to time the market. Sometimes you buy at highs, sometimes at lows, but over time your average cost is smoothed."
            },
            {
                "question": "Over a 15-year period, what percentage of actively managed funds typically underperform a simple S&P 500 index fund?",
                "options": [
                    "About 25% underperform.",
                    "About 50% underperform.",
                    "About 75% underperform.",
                    "Over 90% underperform."
                ],
                "correct_index": 3,
                "explanation": "Correct! Academic research consistently shows that over 90% of active fund managers fail to beat their benchmark index over 15+ year periods, primarily due to higher fees and trading costs eroding returns."
            }
        ]
    },
    {
        "id": "lesson_6",
        "title": "Portfolio Diversification & Modern Portfolio Theory",
        "category": "Risk Management",
        "reading_time": "6 min",
        "summary": "Learn how Harry Markowitz's Nobel Prize-winning theory helps you construct an 'efficient' portfolio that maximizes returns for a given level of risk.",
        "content": """
### 1. The Core Problem: Risk vs. Return
Every investor faces a fundamental trade-off:
*   **Higher returns** demand accepting **higher risk** (volatility).
*   **Lower risk** means settling for **lower expected returns**.

The genius question is: *Can you get more return without adding more risk?* The answer is **yes** — through diversification.

### 2. Why Diversification Works (Correlation)
Diversification works because different assets don't move in the same direction at the same time.
*   **Positive Correlation (+1.0):** Two assets that always move together (e.g., two tech stocks). No diversification benefit.
*   **Zero Correlation (0.0):** Two assets with no relationship (e.g., US stocks vs. gold). Good diversification.
*   **Negative Correlation (-1.0):** Two assets that move opposite (e.g., stocks vs. government bonds during crashes). Maximum diversification benefit.

### 3. The Efficient Frontier
Harry Markowitz proved that for any collection of assets, there exists an **Efficient Frontier** — a curve showing the best possible return for each level of risk.
*   **Portfolios ON the frontier** are optimal: you cannot get more return without adding risk.
*   **Portfolios BELOW the frontier** are sub-optimal: you're taking unnecessary risk for your level of return.

### 4. Asset Allocation Rules of Thumb
*   **The 60/40 Rule:** Traditional allocation of 60% stocks / 40% bonds for moderate risk.
*   **Age-Based Rule:** Hold (110 minus your age)% in stocks. A 25-year-old holds 85% stocks, a 60-year-old holds 50%.
*   **The Three-Fund Portfolio:** A US total stock market ETF + an international ETF + a bond ETF covers almost all global assets.

### 5. Rebalancing: Maintaining Your Target
Markets move daily. If stocks surge 30%, your 60/40 portfolio might drift to 72/28. **Rebalancing** means selling the over-weighted asset and buying the under-weighted one to restore your target allocation. Most investors rebalance quarterly or annually.

### Summary Strategy
Don't put all eggs in one basket. Combine assets with low correlation (stocks + bonds + international + alternatives) and periodically rebalance. This mathematically proven approach reduces risk without sacrificing expected returns.
""",
        "interactive_exercise": {
            "type": "allocation_calculator",
            "instruction": "Using the age-based rule (110 - age = stock %), what percentage of their portfolio should a 30-year-old allocate to stocks?",
            "placeholder": "Enter stock allocation %",
            "answer": "80",
            "explanation": "Correct! 110 - 30 = 80%. A 30-year-old has decades before retirement, so they can tolerate higher stock allocation and ride out volatility."
        },
        "quiz": [
            {
                "question": "What does 'correlation' measure in the context of portfolio diversification?",
                "options": [
                    "How much profit two assets generate together.",
                    "How similarly or differently two assets move relative to each other.",
                    "The total number of assets in a portfolio.",
                    "The average return of the entire stock market."
                ],
                "correct_index": 1,
                "explanation": "Correct! Correlation measures the statistical relationship between two assets' price movements. Low or negative correlation between assets in a portfolio means better diversification and lower overall risk."
            },
            {
                "question": "What is the 'Efficient Frontier' in Modern Portfolio Theory?",
                "options": [
                    "The maximum amount of money you can invest tax-free.",
                    "A geographical boundary where certain stocks can be traded.",
                    "The curve showing the optimal portfolios that offer the highest return for each level of risk.",
                    "The point at which a stock becomes too expensive to buy."
                ],
                "correct_index": 2,
                "explanation": "Correct! The Efficient Frontier is a set of optimal portfolios that provide the maximum expected return for a defined level of risk. Any portfolio below this curve is sub-optimal."
            },
            {
                "question": "Why is periodic 'rebalancing' important for a diversified portfolio?",
                "options": [
                    "It guarantees higher returns every quarter.",
                    "It ensures your portfolio maintains its target risk allocation as asset prices change.",
                    "It eliminates all investment taxes.",
                    "It allows you to add new stocks to your broker account."
                ],
                "correct_index": 1,
                "explanation": "Correct! As markets move, your actual allocation drifts away from your target. Rebalancing restores your intended risk profile by selling winners and buying laggards, which also enforces a 'buy low, sell high' discipline."
            }
        ]
    },
    {
        "id": "lesson_7",
        "title": "Technical Analysis: Reading Charts & Price Patterns",
        "category": "Trading Strategy",
        "reading_time": "6 min",
        "summary": "Decode the language of candlestick charts, support/resistance levels, and moving averages to identify potential trading opportunities and trends.",
        "content": """
### 1. What Is Technical Analysis?
**Technical Analysis (TA)** is the study of past price action and volume data to forecast future price movements. Unlike fundamental analysis (which examines company financials), TA focuses purely on **chart patterns** and **statistical indicators**.

Core belief: All known information is already reflected in the price. Patterns in price movement tend to repeat because human psychology (fear, greed) is consistent.

### 2. Candlestick Charts: The Language of Price
Each candlestick bar represents one time period (1 minute, 1 hour, 1 day):
*   **Green/Bullish Candle:** Close price > Open price. Buyers dominated.
*   **Red/Bearish Candle:** Close price < Open price. Sellers dominated.
*   **Body:** The thick part shows the range between Open and Close.
*   **Wicks/Shadows:** The thin lines show the High and Low extremes.
*   **Long lower wick (Hammer):** Price dropped but buyers pushed it back up — potential reversal signal.

### 3. Support & Resistance Levels
*   **Support:** A price floor where buying pressure historically prevents further decline. Think of it as a 'safety net' the price keeps bouncing off.
*   **Resistance:** A price ceiling where selling pressure historically prevents further rise. A 'glass ceiling' the price keeps hitting.
*   **Breakout:** When price decisively crosses above resistance (bullish) or below support (bearish), it often signals a strong new trend.

### 4. Moving Averages (MA)
A **Moving Average** smooths price data to reveal the underlying trend:
*   **Simple Moving Average (SMA):** Average closing price over N periods (e.g., 50-day SMA, 200-day SMA).
*   **Golden Cross:** When the 50-day MA crosses ABOVE the 200-day MA. Historically bullish signal.
*   **Death Cross:** When the 50-day MA crosses BELOW the 200-day MA. Historically bearish signal.

### 5. Volume: The Confirmation Tool
*   **High volume on a breakout** = strong conviction, likely sustained move.
*   **Low volume on a breakout** = weak conviction, potential false breakout / bull trap.
*   Always confirm price signals with volume data.

### Summary Strategy
Technical analysis is a probabilistic tool, not a crystal ball. Use support/resistance levels for entry/exit planning, moving averages for trend identification, and volume for confirmation. Never rely on a single indicator — combine multiple signals for higher-confidence trades.
""",
        "interactive_exercise": {
            "type": "pattern_identifier",
            "instruction": "A stock has bounced off the $50 price level three times in the past month, each time recovering upwards. What is this $50 level called in technical analysis?",
            "placeholder": "Enter the term",
            "answer": "support",
            "explanation": "Correct! A price level that repeatedly prevents further decline (acting as a floor) is called a Support Level. Traders watch these closely because a break below support often signals further downside."
        },
        "quiz": [
            {
                "question": "What does a 'Golden Cross' signal in technical analysis?",
                "options": [
                    "A stock has reached its all-time high price.",
                    "The 50-day moving average crosses above the 200-day moving average, signaling a potential bullish trend.",
                    "Two stocks from the same sector reach the same price.",
                    "A company announces a stock split."
                ],
                "correct_index": 1,
                "explanation": "Correct! A Golden Cross occurs when the shorter-term 50-day MA rises above the longer-term 200-day MA, indicating that recent momentum is outpacing the long-term trend — historically a bullish signal."
            },
            {
                "question": "If a stock breaks above a resistance level on very high trading volume, what does this typically suggest?",
                "options": [
                    "The breakout is likely false and the price will reverse.",
                    "The stock is about to be delisted from the exchange.",
                    "Strong buyer conviction — the breakout is likely genuine and may lead to further upside.",
                    "The resistance level was incorrectly identified."
                ],
                "correct_index": 2,
                "explanation": "Correct! High volume confirms that many market participants are backing the breakout with real capital. This conviction makes it more likely the move will sustain rather than quickly reverse."
            },
            {
                "question": "What information does the 'wick' (shadow) of a candlestick convey?",
                "options": [
                    "The total number of shares traded during that period.",
                    "The extreme high and low prices reached during the period, beyond the open/close range.",
                    "The dividend amount paid during that candle.",
                    "The broker's commission fee for that trade."
                ],
                "correct_index": 1,
                "explanation": "Correct! The upper wick shows how high the price went before sellers pushed it back down, and the lower wick shows how low it went before buyers pushed it back up. Long wicks indicate rejection of extreme prices."
            }
        ]
    }
]

def get_lessons_list() -> List[Dict[str, Any]]:
    """Returns lessons metadata without content or quiz details to optimize loading lists."""
    return [
        {
            "id": l["id"],
            "title": l["title"],
            "category": l["category"],
            "reading_time": l["reading_time"],
            "summary": l["summary"]
        } for l in LESSONS
    ]

def get_lesson_by_id(lesson_id: str) -> Dict[str, Any]:
    """Returns the full lesson details including quizzes."""
    for l in LESSONS:
        if l["id"] == lesson_id:
            return l
    return None
