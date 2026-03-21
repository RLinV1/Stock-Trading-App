"use client";

import { BarChart3, PieChartIcon, Trophy, TrendingUp } from "lucide-react";
import { PortfolioLineChart } from "./_components/PortfolioChart";
import { useEffect, useState } from "react";
import { AllocationChart } from "./_components/AllocationChart";
import { LeaderboardEntry, Stock, UserData, UserStock } from "./_types/types";
import { useRouter } from "next/navigation";
import { checkAuth, signOut } from "./_util/auth";
import axios from "axios";
import {
  buyStock,
  getStocks,
  getTotalPortfolioValue,
  getTotalProfit,
  getTotalReturnPercentage,
  getUserStocks,
  searchStock,
  sellStock,
  useDebounce,
} from "./_util/stock";
export default function Home() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [userStocks, setUserStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [barType, setBarType] = useState<"performance" | "allocation">(
    "performance"
  );
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [totalCash, setTotalCash] = useState<number>(200); // Assuming a static cash value for simplicity

  const [userData, setUserData] = useState<UserData | null>(null); // Example dashboard data
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [totalReturnPercentage, setTotalReturnPercentage] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<"dashboard" | "leaderboard">("dashboard");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Stock[]>([]);
  const debouncedQuery = useDebounce(query, 300); // 300ms debounce

  const router = useRouter();

  const refreshAll = async () => {
    try {
      const user = await checkAuth();

      if (user && "message" in user) {
        alert("Your session has expired. Please log in again.");
        router.push("/login");
        return;
      }

      if (user) {
        setTotalCash(user.cashBalance);
        setUserData(user);

        const stockData = await getStocks();
        setStocks(stockData);

        const userStocksData = await getUserStocks(user, stockData);

        if (userStocksData) {
          setUserStocks(userStocksData);
          setPortfolioValue(getTotalPortfolioValue(userStocksData));
          setTotalProfit(getTotalProfit(userStocksData));
          setTotalReturnPercentage(getTotalReturnPercentage(userStocksData));
        }
      }
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [router]);

  // SSE: subscribe to real-time stock price updates
  useEffect(() => {
    if (!userData?.userId) return;

    const eventSource = new EventSource(
      `https://stock-trading-app-backend-production.up.railway.app/api/stock/stream`,
      { withCredentials: true }
    );

    eventSource.onmessage = (event) => {
      const updatedStocks: Stock[] = JSON.parse(event.data);
      setStocks(updatedStocks);

      // Recalculate portfolio values with new stock prices
      setUserStocks((prev) => {
        const updated = prev.map((us) => ({
          ...us,
          stock: updatedStocks.find((s) => s.id === us.stockId) || us.stock,
        }));
        setPortfolioValue(getTotalPortfolioValue(updated));
        setTotalProfit(getTotalProfit(updated));
        setTotalReturnPercentage(getTotalReturnPercentage(updated));
        return updated;
      });
    };

    eventSource.onerror = () => {
      console.error("SSE connection lost, reconnecting...");
      eventSource.close();
    };

    return () => eventSource.close();
  }, [userData?.userId]);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get<LeaderboardEntry[]>(
        "https://stock-trading-app-backend-production.up.railway.app/api/auth/users",
        { withCredentials: true }
      );
      setLeaderboard(res.data);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "leaderboard") {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const handleSignOut = async () => {
    try {
      const res = await signOut();
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuy = async (userStock: UserStock, shares: number) => {
    try {
      await buyStock(userStock, 1);
      await refreshAll();
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
    }
  };

  const handleSell = async (userStock: UserStock, shares: number) => {
    try {
      await sellStock(userStock, 1);
      await refreshAll();
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
    }
  };
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]); // immediately clear results if input is empty
      return;
    }

    const performSearch = async () => {
      try {
        const searchData = await searchStock(debouncedQuery);
        setResults(searchData);
      } catch (err) {
        console.error(err);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-3xl min-h-screen bg-background text-foreground overflow-y-auto">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground justify-around overflow-y-auto">
      <div className="flex flex-col flex-1 bg-dark-custom">
        {/* Header */}
        <header className="border-b border-border bg-light-custom backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">TradePro</h1>
            </div>

            {/* Search */}
            <div className="relative w-1/2 mx-8">
              <input
                type="text"
                placeholder="Search stock symbol or name"
                className="w-full border p-3 rounded-lg text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              {results.length > 0 && (
                <div className="absolute top-full left-0 w-full border rounded shadow-lg z-50 max-h-60 overflow-y-auto bg-background">
                  {results.map((stock) => (
                    <div
                      key={stock.id}
                      className="p-2 cursor-pointer hover:bg-light-custom font-bold"
                      onClick={() => router.push(`/stocks/${stock.id}`)}
                    >
                      {stock.symbol} - {stock.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-success font-bold text-lg focus:outline-none cursor-pointer"
              >
                {userData?.username}
                <svg
                  className={`w-4 h-4 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute -right-4 mt-1 bg-background w-40 border rounded shadow-lg z-50">
                  <div
                    className="px-4 py-2 cursor-pointer hover:bg-gray-800 font-bold"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="border-b border-border bg-light-custom">
          <div className="container mx-auto px-4 flex gap-6">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-3 px-4 font-semibold text-lg cursor-pointer border-b-2 transition-colors ${
                activeTab === "dashboard"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`py-3 px-4 font-semibold text-lg cursor-pointer border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "leaderboard"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="h-5 w-5" />
              Leaderboard
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex flex-col px-2 md:px-4 max-w-screen-xl mx-auto w-full py-10">
          {activeTab === "leaderboard" ? (
            <div className="w-full">
              <h2 className="text-3xl font-semibold mb-8">Top Portfolios</h2>
              <div className="flex flex-col gap-4">
                {leaderboard.map((entry, index) => {
                  const medal =
                    index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;

                  return (
                    <div
                      key={entry.username}
                      className={`flex items-center justify-between p-5 rounded-lg shadow-md ${
                        index < 3 ? "bg-light-custom" : "bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl w-12 text-center">
                          {medal ?? <span className="text-muted-foreground text-xl">#{index + 1}</span>}
                        </div>
                        <div className="font-bold text-xl">
                          {entry.username}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-success">
                          ${entry.cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-muted-foreground">Cash Balance</div>
                      </div>
                    </div>
                  );
                })}
                {leaderboard.length === 0 && (
                  <div className="text-lg text-muted-foreground">No leaderboard data available</div>
                )}
              </div>
            </div>
          ) : (
          <>
          <div className="flex items-start justify-between mb-8 w-full lg:gap-12 flex-col gap-4 lg:flex-row">
            {/* Left Side - Portfolio Analysis */}
            <div className="w-full h-full">
              <div className="flex items-center gap-8 justify-between">
                <h2 className="text-3xl my-4">Portfolio Analysis</h2>

                <div className="flex items-center text-xl gap-8">
                  <div
                    className="flex items-center space-x-2 cursor-pointer rounded-lg p-2
                      hover:bg-blue-500 hover:text-black h-full"
                    onClick={() => setBarType("performance")}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>Performance</span>
                  </div>

                  <div
                    className="flex items-center space-x-2 cursor-pointer hover:bg-blue-500 hover:text-black rounded-lg p-2"
                    onClick={() => setBarType("allocation")}
                  >
                    <PieChartIcon className="h-4 w-4 ml-2" />
                    <span className="ml-1">Allocation</span>
                  </div>
                </div>
              </div>
              <div
                className={`w-full h-full ${barType === "allocation" ? "hidden" : ""}`}
              >
                <PortfolioLineChart
                  portfolioValue={portfolioValue}
                  userId={userData?.userId || ""}
                />
              </div>
              <div
                className={`w-full ${
                  barType === "performance" ? "hidden" : ""
                }`}
              >
                <AllocationChart
                  data={userStocks}
                  portfolioValue={portfolioValue}
                />
              </div>
            </div>

            {/* Market data */}
            {/* Right Side - Live Market Data */}
            <div className="w-full sm:w-full  lg:w-1/2">
              <h2 className="text-3xl my-4">Live Market Data</h2>
              
              <div className="flex flex-col gap-6 w-full">
                {loading ? (
                  <div className="text-lg">Loading stock data...</div>
                ) : stocks.length > 0 ? (
                  stocks.slice(0,4).map((stock) => (
                    <div
                      key={stock.symbol}
                      className="bg-card p-4 rounded-lg shadow-md text-lg cursor-pointer"
                      onClick={() => {
                        router.push(`/stocks/${stock.id}`)
                      }}
                    >
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center font-bold text-foreground">
                          <div>{stock.symbol}</div>
                          <div>${stock.currentPrice.toFixed(2)}</div>
                        </div>
                        <div className="text-muted-foreground">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-lg">No stocks available</div>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Overview */}
          <h2 className="text-3xl font-semibold">Portfolio Overview</h2>
          <div className="my-4 w-full rounded-lg shadow-md bg-light-custom p-6">
            <div className="flex flex-col sm:flex-row justify-around gap-6">
              <div className="">
                <div className="text-lg font-semibold text-foreground mb-2">
                  Total Value
                </div>
                <div className="text-2xl font-bold text-success">
                  ${portfolioValue.toFixed(2)}
                </div>
              </div>
              <div className="">
                <div className="text-lg font-semibold text-foreground mb-2">
                  Total Cash
                </div>
                <div className="text-2xl font-bold text-success">
                  ${totalCash.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="">
                <div className="text-lg font-semibold text-foreground mb-2">
                  Total Return
                </div>

                <div
                  className={`${
                    totalProfit > 0 ? "text-success" : "text-danger"
                  } text-2xl font-bold`}
                >
                  ${totalProfit.toFixed(2)}
                </div>
              </div>
              <div className="">
                <div className="text-lg font-semibold text-foreground mb-2">
                  Return %
                </div>
                <div
                  className={`${
                    totalReturnPercentage > 0 ? "text-success" : "text-danger"
                  } text-2xl font-bold `}
                >
                  {totalReturnPercentage.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Holdings Section */}
          <div className="mt-8 w-full rounded-lg shadow-md text-3xl">
            <h2 className="text-3xl font-semibold mb-4">Holdings</h2>
            {userStocks.length > 0 ? (
              <div className="flex flex-col gap-4 max-h-500 overflow-auto">
                {userStocks.map((userStock) => {
                  if (!userStock.stock || !userStock.avgCost) return null;

                  const profit =
                    userStock.stock.currentPrice * userStock.shares -
                    userStock.avgCost * userStock.shares;

                  const profitFormatted = profit.toFixed(2);

                  const percentChange =
                    ((userStock.stock.currentPrice - userStock.avgCost) /
                      userStock.avgCost) *
                    100;
                  const percentFormatted = percentChange.toFixed(2) + "%";

                  return (
                    <div
                      key={userStock.id}
                      className="bg-card px-6 py-4 flex justify-between rounded-lg shadow-md"
                    >
                      <div className="flex flex-col items-start">
                        <div className="text-lg font-bold text-foreground">
                          {userStock.stock?.symbol}{" "}
                          <span className="text-muted-foreground">
                            ({userStock.shares} shares){" "}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg: ${userStock.avgCost.toFixed(2)} | Current: $
                          {userStock.stock?.currentPrice.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <div className="text-xl font-semibold text-foreground">
                            $
                            {userStock.stock
                              ? (
                                  userStock.shares *
                                  userStock.stock.currentPrice
                                ).toFixed(2)
                              : "N/A"}
                          </div>
                          <div
                            className={`text-sm font-semibold ${
                              profit < 0 ? "text-danger" : "text-success"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div>${profitFormatted}</div>
                              <div>({percentFormatted})</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-lg text-success font-medium">
                          <button
                            className="text-black bg-success cursor-pointer hover:bg-blue-600  px-3 py-1 rounded-lg"
                            onClick={() => handleBuy(userStock, 1)}
                          >
                            Buy
                          </button>
                          <button
                            className="bg-danger text-white px-3 py-1 cursor-pointer rounded-lg ml-2"
                            onClick={() => handleSell(userStock, 1)}
                          >
                            Sell
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-lg">No holdings available</div>
            )}
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
}
