import axios from "axios"
import { PortfolioSnapshot } from "../_types/types"

export const getPortfolioSnapshots = async (userId: string):  Promise<PortfolioSnapshot[]> => {
    const res = await axios.get("https://stock-trading-app-backend-production.up.railway.app/api/portfolio/" + userId , 
        {withCredentials: true}
    )

    return res.data
}
