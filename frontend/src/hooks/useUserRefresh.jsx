import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { fetchProfile } from "../api/profile.jsx";

export const useUserRefresh = () => {
  const { token, updateUser } = useContext(AuthContext);

  const refreshUserData = async () => {
    if (!token) return null;

    try {
      const userData = await fetchProfile(token);
      if (userData && userData.email) {
        updateUser(userData);
        return userData;
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
    return null;
  };

  return refreshUserData;
};
