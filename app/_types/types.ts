// Stock.ts
export interface Stock {
  id: number;
  symbol: string;
  name: string;
  currentPrice: number;
}

export interface UserStock {
    id: number;
    userId: string;
    stockId: number;
    shares: number;
    avgCost: number;
    stock?: Stock;
}
export interface UserData {
  userId: string;
  username: string;
  roles: string[];
  cashBalance: number;
}
export interface PortfolioSnapshot {
  id: number,
  portfolioValue: number
  dateTime: Date
}


// error type
export interface AuthError {
  message: string;
}