import React, { createContext, useContext, useState, useEffect } from "react";
import { getMandatoryLocation } from "@/components/getLocation";
import { networkManager, addNetworkListener } from "@/utils/networkUtils";
// API IMPORTS
import { authService } from "@/services";

// Create context with a safer approach
const GlobalContext = createContext();

const { Provider } = GlobalContext;

// Export the context for use in components
export { GlobalContext };

export const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestRole, setGuestRole] = useState(null); // 'farmer' or 'consumer'
  const [mainUser, setMainUser] = useState({});
  const [currentLocation, setCurrentLocation] = useState(null); // Initialize as null to avoid iterator issues
  const [jwt, setJwt] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [locationRequested, setLocationRequested] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState("unknown");

  // Authentication state monitoring
  useEffect(() => { 
    // API AUTH STATE MONITORING
    const unsubscribe = authService.addAuthStateListener((user) => {
      if (user) { 
        setIsLogged(true);
        setIsGuest(false); // Ensure guest mode is disabled
        setGuestRole(null);
        setMainUser(user);
        setJwt(user.id); // Use user ID as token for now
      } else { 
        setIsLogged(false);
        setIsGuest(false);
        setGuestRole(null);
        setMainUser({});
        setJwt("");
      }
    });

    // Initialize auth state from stored token
    const initializeAuth = async () => {
      try {
        const user = await authService.initializeAuth();
        if (user) {
          setIsLogged(true);
          setMainUser(user);
          setJwt(user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();

    return unsubscribe;
  }, []);

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
        
          setCurrentLocation(location);
          setLocationRequested(true);
          setIsLoading(false);
        },
        (error) => {
         
          setIsLoading(false);
         
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
    // Loading and location states
    isLoading,
    setIsLoading,
    currentLocation: currentLocation || null,
    setCurrentLocation,
    locationRequested,
    setLocationRequested,

    // Network states
    isOnline,
    setIsOnline,
    networkType,
    setNetworkType,

    // Authentication states
    isLogged,
    setIsLogged,
    isGuest,
    setIsGuest,
    guestRole,
    setGuestRole,
    mainUser: mainUser || {},
    setMainUser,
    jwt,
    setJwt,
    isAuthenticated: isLogged, // Only logged users are authenticated
    userRole: mainUser?.job === 'farmer' ? 'farmer' : 'consumer',
    canAddData: isLogged, // Only logged users can add data
  };

  return (
    <Provider value={contextValue}>
      {children}
    </Provider>
  );
};
