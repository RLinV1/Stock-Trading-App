import axios from "axios"
import { PortfolioSnapshot } from "../_types/types"

export const getPortfolioSnapshots = async (userId: string):  Promise<PortfolioSnapshot[]> => {
    const res = await axios.get("http://localhost:8080/api/portfolio/" + userId , 
        {withCredentials: true}
    )

    return res.data
}