import axios from "axios";
import { Stock, UserData, UserStock } from "../_types/types";
import { useEffect, useState } from "react";

export const getUserStocks = async (
  userData: UserData,
  stocks: Stock[]
): Promise<UserStock[] | null> => {
  const response = await axios.get(
    "https://stock-trading-app-backend-production.up.railway.app/api/user-stock?userId=" + userData?.userId, {
      withCredentials: true,
    }
  );

  // get all users holdings and make sure to add stock data to them
  const userStockList = response.data;

  const enriched = userStockList.map((us: UserStock) => ({
    ...us,
    stock: stocks.find((s) => s.id === us.stockId)!,
  }));
  const userStocksData = enriched.sort((a: UserStock, b: UserStock) => {
    if (!a.stock?.symbol) return 1;
    if (!b.stock?.symbol) return -1;
    return a.stock.symbol.localeCompare(b.stock.symbol);
  });
  return userStocksData;
};

export const getStocks = async (): Promise<Stock[]> => {
  const res = await axios.get<Stock[]>("https://stock-trading-app-backend-production.up.railway.app/api/stock", {
      withCredentials: true,
    });
  return res.data;
};

export const buyStock = async (
  userStock: UserStock,
  shares: number
): Promise<UserStock> => {
  const response = await axios.post<UserStock>(
    "https://stock-trading-app-backend-production.up.railway.app/api/user-stock/buy",
    {
      id: userStock.id,
      shares: shares, // Assuming buying 1 share for simplicity
      avgCost: userStock.stock?.currentPrice, // Assuming avgCost is already set
      stockId: userStock.stockId,
      userId: userStock.userId,
    }, 
    {withCredentials: true}
  );
  return response.data;
};

export const sellStock = async (
  userStock: UserStock,
  shares: number
): Promise<UserStock> => {
  const response = await axios.post<UserStock>(
    "https://stock-trading-app-backend-production.up.railway.app/api/user-stock/sell",
    {
      id: userStock.id,
      shares: shares,
      stockId: userStock.stockId,
      userId: userStock.userId,
    },
    {withCredentials: true}
  );
  return response.data;
};

export const searchStock = async (query: string) => {
  const res = await axios.get<Stock[]>(
        `https://stock-trading-app-backend-production.up.railway.app/api/stock/search?query=${query}`,
        { withCredentials: true }
      );
    return res.data

}
export const getTotalProfit = (userStocksData: UserStock[]) => {
  const totalProfit = userStocksData.reduce((acc: number, us: UserStock) => {
    if (!us.stock || !us.avgCost) return acc;
    if (us.shares === 0) return acc;
    const profit = us.stock.currentPrice * us.shares - us.avgCost * us.shares;
    return acc + profit;
  }, 0);
  return totalProfit;
};


export const getTotalPortfolioValue = (userStocksData: UserStock[]) => {
  const totalValue = userStocksData.reduce((acc: number, us: UserStock) => {
    return acc + (us.stock ? us.shares * us.stock.currentPrice : 0);
  }, 0);
  return totalValue;
};

export function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(handler); // cleanup if value changes
  }, [value, delay]);

  return debouncedValue;
}
