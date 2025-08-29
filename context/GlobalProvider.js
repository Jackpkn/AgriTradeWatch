import React, { createContext, useContext, useState, useEffect } from "react";
import { getMandatoryLocation } from "../components/getLocation";
import { networkManager, addNetworkListener } from "../utils/networkUtils";

// Create context with a safer approach
const GlobalContext = createContext();

const { Provider } = GlobalContext;

// Export the context for use in components
export { GlobalContext };

export const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [mainUser, setMainUser] = useState({});
  const [currentLocation, setCurrentLocation] = useState(null); // Initialize as null to avoid iterator issues
  const [jwt, setJwt] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [locationRequested, setLocationRequested] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState("unknown");

  // Network status monitoring
  useEffect(() => {
    const initializeNetworkStatus = async () => {
      const status = await networkManager.getNetworkStatus();
      setIsOnline(status.isConnected);
      setNetworkType(status.type);
    };

    initializeNetworkStatus();

    // Listen for network changes
    const unsubscribe = addNetworkListener((isConnected) => {
      setIsOnline(isConnected);
      console.log(
        "GlobalProvider: Network status changed:",
        isConnected ? "Online" : "Offline"
      );
    });

    return unsubscribe;
  }, []);

  // Request location permission on app start
  useEffect(() => {
    const requestLocationOnAppStart = async () => {
      console.log(
        "GlobalProvider: Requesting location permission on app start..."
      );
      setIsLoading(true);

      await getMandatoryLocation(
        (location) => {
          console.log(
            "GlobalProvider: Location permission granted and location obtained"
          );
          setCurrentLocation(location);
          setLocationRequested(true);
          setIsLoading(false);
        },
        (error) => {
          console.error(
            "GlobalProvider: Location permission denied or error:",
            error
          );
          setIsLoading(false);
          // The getMandatoryLocation function will handle showing alerts and exiting the app
        },
        setCurrentLocation
      );
    };

    // Only request location once per app session
    if (!locationRequested) {
      requestLocationOnAppStart();
    }
  }, [locationRequested]);

  // Create context value with safe defaults
  const contextValue = {
    isLoading,
    setIsLoading,
    mainUser: mainUser || {},
    setMainUser,
    isLogged,
    setIsLogged,
    jwt,
    setJwt,
    currentLocation: currentLocation || null, // Ensure it's never undefined
    setCurrentLocation,
    locationRequested,
    setLocationRequested,
    isOnline,
    setIsOnline,
    networkType,
    setNetworkType,
  };

  return (
    <Provider value={contextValue}>
      {children}
    </Provider>
  );
};
