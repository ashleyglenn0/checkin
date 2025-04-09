// utils/tokenHelpers.js
export const getTokenFromSession = () => {
    try {
      return sessionStorage.getItem("authToken");
    } catch {
      return null;
    }
  };