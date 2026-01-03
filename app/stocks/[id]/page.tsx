"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Stock, UserStock, UserData } from "../../_types/types";
import { buyStock, sellStock, getUserStocks } from "../../_util/stock";
import { checkAuth } from "../../_util/auth";
import { ArrowLeft, BarChart3 } from "lucide-react";

export default function StockDetailPage() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  const [stock, setStock] = useState<Stock | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStock, setUserStock] = useState<UserStock | null>(null);
  const [shares, setShares] = useState<string>(""); // Use string instead of number
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const refreshData = async () => {
      try {
        const user = await checkAuth();
        if (!user || "message" in user) {
          router.push("/login");
          return;
        }
        setUserData(user);

        const res = await axios.get<Stock>(
          `http://localhost:8080/api/stock/${id}`,
          { withCredentials: true }
        );
        setStock(res.data);

        const userStocks = await getUserStocks(user, [res.data]);
        setUserStock(userStocks?.[0] || null);
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  // Fetch stock and user info intially
   useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };

    fetchData();
  }, [id, router]);

  useEffect(() => {
    const run = async () => {
      await refreshData();
      setLoading(false);
    };

    run();
    const intervalId = setInterval(refreshData, 30000); // every 30s
    return () => clearInterval(intervalId);
  }, [router]);
  

  const handleBuy = async () => {
    if (!userStock || !userData) return;

    try {
      const buyShares = parseInt(shares);
      if (isNaN(buyShares) || buyShares < 1) {
        alert("Please enter a valid number of shares");
        return;
      }

      await buyStock(userStock, buyShares);
      // Refresh user cash and stock
      const updatedUser = await checkAuth();

      if (!updatedUser || "message" in updatedUser) {
        // user is an AuthError
        router.push("/login");
        return;
      }

      setUserData(updatedUser);
    } catch (err) {
      setError("Failed to buy stock");
      console.error(err);
    }
  };

  const handleSell = async () => {
    if (!userStock || !userData) return;

    try {
      const sellShares = parseInt(shares);
      if (isNaN(sellShares) || sellShares < 1) {
        alert("Please enter a valid number of shares");
        return;
      }
      await sellStock(userStock, sellShares);
      const updatedUser = await checkAuth();
      if (!updatedUser || "message" in updatedUser) {
        // user is an AuthError
        router.push("/login");
        return;
      }
      setUserData(updatedUser);
    } catch (err) {
      setError("Failed to sell stock");
      console.error(err);
    }
  };

  const goBack = () => {
    router.push("/"); // Navigate back to the main page
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-3xl min-h-screen bg-background text-foreground overflow-y-auto">
        Loading...
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center text-3xl min-h-screen bg-background text-foreground overflow-y-auto">
        Stock not Found...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="bg-light-custom p-12 rounded-lg shadow-md w-full max-w-2xl text-center">
        <div className="text-left cursor-pointer h-fit w-fit"><ArrowLeft className="h-9 w-9" onClick={goBack}/></div>
        <h1 className="text-4xl font-bold mb-2">{stock.symbol}</h1>
        <p className="text-lg mb-2">{stock.name}</p>
        <p className="text-2xl font-semibold mb-4">
          ${stock.currentPrice.toFixed(2)}
        </p>

        <div className="mb-4">
          <label className="block mb-1 text-left">Shares:</label>
          <input
            type="number"
            placeholder="Enter number of shares"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="w-full border p-2 rounded text-center"
          />
        </div>

        <div className="flex justify-center gap-4">
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
            onClick={handleBuy}
          >
            Buy
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
            onClick={handleSell}
          >
            Sell
          </button>
        </div>

        {userData && userStock && (
          <div className="mt-6 p-4 bg-light-custom border border-blue-300 rounded-lg text-base text-white font-medium shadow-sm">
            <p>Shares owned: {userStock.shares}</p>
            <p>
              Average cost: $
              {userStock.avgCost.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p>
              Cash balance: $
              {userData.cashBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        )}
        {error && <div className="mt-4 text-red-500 font-bold text-xl">{error}</div>}
      </div>
    </div>
  );
}
