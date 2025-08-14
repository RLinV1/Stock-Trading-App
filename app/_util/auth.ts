import axios from "axios";
import { UserData, AuthError } from "../_types/types";
import { useRouter } from "next/navigation";

export const checkAuth = async (): Promise<UserData | AuthError | null> => {
  try {
    // First attempt to get current user info
    let res = await axios.get("http://localhost:8080/api/auth/check", {
      withCredentials: true,
    });

    return res.data as UserData; // success, return user data
  } catch (err: any) {
    // If 401 Unauthorized, try refresh token
    if (err.response?.status === 401 || err.response?.status === 500) {
      try {
        const refreshRes = await axios.post(
          "http://localhost:8080/api/auth/refresh",
          null,
          {
            withCredentials: true, // <- This is key to send cookies!
          }
        );

        if (refreshRes.status !== 200) {
          return { message: "Unauthorized" };
        }

        const retryRes = await axios.get(
          "http://localhost:8080/api/auth/check",
          {
            withCredentials: true,
          }
        );

        return retryRes.data as UserData;
      } catch (refreshErr: any) {
        return { message: "Unauthorized" };
      }
    }

    // Other errors
    return { message: err.message || "Unknown error" };
  }
};

export const signOut = async () => {
  try {
    const res = await axios.post(
      "http://localhost:8080/api/auth/signout",
      null,
      {
        withCredentials: true,
      }
    );
    console.log(res);
  } catch (err) {
    console.error(err);
  }
};
