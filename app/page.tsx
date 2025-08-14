"use client";

import { BarChart3, PieChartIcon, TrendingUp } from "lucide-react";
import { PortfolioLineChart } from "./_components/PortfolioChart";
import { useEffect, useState } from "react";
import { AllocationChart } from "./_components/AllocationChart";
import { Stock, UserData, UserStock } from "./_types/types";
import { useRouter } from "next/navigation";
import { checkAuth, signOut } from "./_util/auth";
import {
  buyStock,
  getStocks,
  getTotalPortfolioValue,
  getTotalProfit,
  getTotalReturnPercentage,
  getUserStocks,
  sellStock,
} from "./_util/stock";
export default function Home() {
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
  const router = useRouter();

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const user = await checkAuth();
        if (user && "message" in user) {
          router.push("/login");
          console.error(user.message);
        } else if (user) {
          setTotalCash(user.cashBalance);
          setUserData(user);
        }
      } catch (err) {
        if (err instanceof Error) console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAuth();
  }, [router]);

  useEffect(() => {
    if (!userData) return;

    console.log(userData)
    const fetchAll = async () => await fetchData();
    fetchAll();

    const intervalId = setInterval(fetchAll, 20000);
    return () => clearInterval(intervalId);
  }, [userData]); // only run when userData is set

  const handleSignOut = async () => {
    try {
      const res = await signOut();
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    if (!userData?.userId) return; // wait until userData is available

    
    try {
      const stockData = await getStocks();
      setStocks(stockData);

      const userStocksData: UserStock[] | null = await getUserStocks(
        userData,
        stockData
      );

      if (userStocksData) {
        setUserStocks(userStocksData);

        const totalValue = getTotalPortfolioValue(userStocksData);

        setPortfolioValue(totalValue);

        const totalProfitData = getTotalProfit(userStocksData);
        setTotalProfit(totalProfitData);

        const totalReturnPercentageData =
          getTotalReturnPercentage(userStocksData);
        setTotalReturnPercentage(totalReturnPercentageData);

        console.log("hey");
        setLoading(false);
      } else {
        throw new Error("Error fetching data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  const handleBuy = async (userStock: UserStock, shares: number) => {
    try {
      const stockData = buyStock(userStock, 1);
      console.log(stockData);
      fetchData(); // Refresh data after buying
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  };

  const handleSell = async (userStock: UserStock, shares: number) => {
    try {
      const sellStockData = sellStock(userStock, 1);
      fetchData();
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  };

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
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">TradePro</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-md text-muted-foreground">
                    Portfolio Value
                  </div>
                  <div className="text-xl font-bold text-success">
                    ${portfolioValue.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-md text-muted-foreground">
                    Cash Value
                  </div>
                  <div className="text-xl font-bold text-success">
                    ${totalCash.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-md text-muted-foreground">User</div>
                  <div className="text-xl font-bold text-success">
                    {userData?.username}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-right">
                  <div
                    className="text-xl font-bold text-success cursor-pointer"
                    onClick={() => handleSignOut()}
                  >
                    Sign out
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col px-2 md:px-4 max-w-screen-xl mx-auto w-full py-10">
          <div className="flex items-start justify-between mb-8 w-full lg:gap-12 flex-col gap-4 lg:flex-row">
            {/* Left Side - Portfolio Analysis */}
            <div className="w-full h-full">
              <div className="flex items-center gap-8 justify-between">
                <h2 className="text-3xl my-4">Portfolio Analysis</h2>

                <div className="flex items-center text-xl gap-8">
                  <div
                    className="flex items-center space-x-2 cursor-pointer rounded-lg p-2
                      hover:bg-blue-500 hover:text-black"
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
                className={`w-full ${barType === "allocation" ? "hidden" : ""}`}
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
              <p className="text-sm text-muted-foreground mb-4">
                Real-time updates on stock prices and market trends
              </p>
              <div className="flex flex-col gap-6 w-full">
                {loading ? (
                  <div className="text-lg">Loading stock data...</div>
                ) : stocks.length > 0 ? (
                  stocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="bg-card p-4 rounded-lg shadow-md text-lg"
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
                  ${totalCash.toFixed(2)}
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
              <div className="flex flex-col gap-4">
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
        </main>
      </div>
    </div>
  );
}
