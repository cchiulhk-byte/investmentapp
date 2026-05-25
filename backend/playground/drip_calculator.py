#!/usr/bin/env python3
import sys

def calculate_projection(principal: float, annual_contribution: float, rate: float, tax_rate: float, years: int):
    """
    Simulates a portfolio projection comparing linear cash withdrawals vs. DRIP compounding.
    
    Args:
        principal: Initial cash investment.
        annual_contribution: Cash added to stock purchase every year.
        rate: Dividend Yield (annual).
        tax_rate: Taxes paid on dividends (e.g. 30% for US dividend withholding tax).
        years: Simulation duration.
    """
    print("=" * 70)
    print("       APEXINVEST QUANT LABS - DIVIDEND COMPOUNDING VISUALIZER")
    print("=" * 70)
    print(f"Initial Principal:  ${principal:,.2f}")
    print(f"Annual Addition:    ${annual_contribution:,.2f}")
    print(f"Annual Yield:       {rate * 100:.2f}%")
    print(f"Withholding Tax:    {tax_rate * 100:.1f}%")
    print(f"Projection Period:  {years} Years")
    print("-" * 70)
    print(f"{'Year':<5} | {'Cash Out Portfolio':<20} | {'DRIP Compounded Portfolio':<25}")
    print("-" * 70)
    
    # 1. Cash Out Portfolio (Linear - Dividends are spent/cashed out, principal stays flat + additions)
    cash_out_balance = principal
    total_cash_withdrawn = 0.0
    
    # 2. DRIP Portfolio (Exponential - Dividends are taxed, then immediately buy more shares)
    drip_balance = principal
    
    net_yield = rate * (1 - tax_rate)
    
    for year in range(1, years + 1):
        # Apply annual additions
        cash_out_balance += annual_contribution
        drip_balance += annual_contribution
        
        # Calculate dividends
        div_cash_out = cash_out_balance * net_yield
        total_cash_withdrawn += div_cash_out
        
        div_drip = drip_balance * net_yield
        drip_balance += div_drip # Reinvested back into principal!
        
        # Print snapshots at milestones
        if year <= 5 or year % 5 == 0:
            print(f"Year {year:<2} | ${cash_out_balance:<19,.2f} | ${drip_balance:<24,.2f}")
            
    print("-" * 70)
    print(f"Final Principal (No DRIP):  ${cash_out_balance:,.2f}  (+$ {total_cash_withdrawn:,.2f} collected cash)")
    print(f"Final Principal (With DRIP): ${drip_balance:,.2f}")
    improvement = ((drip_balance) / (cash_out_balance) - 1) * 100
    print(f"DRIP Reinvestment Multiplier Advantage: +{improvement:.2f}% total value!")
    print("=" * 70)

if __name__ == "__main__":
    # Check if arguments are supplied from playground executor
    principal = float(sys.argv[1]) if len(sys.argv) > 1 else 10000.0
    annual_contribution = float(sys.argv[2]) if len(sys.argv) > 2 else 1200.0
    rate = float(sys.argv[3]) if len(sys.argv) > 3 else 0.06 # 6% Dividend yield
    tax_rate = float(sys.argv[4]) if len(sys.argv) > 4 else 0.30 # 30% dividend tax (standard for US stocks for international investors)
    years = int(sys.argv[5]) if len(sys.argv) > 5 else 20
    
    calculate_projection(principal, annual_contribution, rate, tax_rate, years)
