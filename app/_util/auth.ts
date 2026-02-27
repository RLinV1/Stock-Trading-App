import axios from "axios";
import { UserData, AuthError } from "../_types/types";

export const checkAuth = async (): Promise<UserData | AuthError | null> => {
  try {
    const res = await axios.get("http://localhost:8080/api/auth/check", {
      withCredentials: true,
    });

    return res.data as UserData;
  } catch (err) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 500)) {
      try {
        const refreshRes = await axios.post(
          "http://localhost:8080/api/auth/refresh",
          null,
          { withCredentials: true }
        );

        if (refreshRes.status !== 200) {
          return { message: "Unauthorized" };
        }

        const retryRes = await axios.get(
          "http://localhost:8080/api/auth/check",
          { withCredentials: true }
        );

        return retryRes.data as UserData;
      } catch {
        return { message: "Unauthorized" };
      }
    }

    return { message: axios.isAxiosError(err) ? err.message : "Unknown error" };
  }
};

export const signOut = async () => {
  try {
    const res = await axios.post(
      "http://localhost:8080/api/auth/signout",
      null,
      { withCredentials: true }
    );
    console.log(res);
  } catch (err) {
    console.error(err);
  }
};