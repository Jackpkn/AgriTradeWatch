import React, { createContext, useContext, useState, useEffect } from "react";
import { getMandatoryLocation } from "@/components/getLocation";
import { networkManager, addNetworkListener } from "@/utils/networkUtils";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

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

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) { 
        setIsLogged(true);
        setIsGuest(false); // Ensure guest mode is disabled
        setGuestRole(null);
        // You can fetch additional user data here if needed
      } else { 
        setIsLogged(false);
        setIsGuest(false);
        setGuestRole(null);
        setMainUser({});
        setJwt("");
      }
    });

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

  // Guest mode utilities - DISABLED: Login is now mandatory
  /*
  const loginAsGuest = (role) => {
    try {
      if (!role || !['farmer', 'consumer'].includes(role)) {
        throw new Error('Invalid guest role. Must be "farmer" or "consumer"');
      }
      setIsGuest(true);
      setGuestRole(role);
      setIsLogged(false);
      setMainUser({ role, isGuest: true });
      console.log('User logged in as guest with role:', role);
    } catch (error) {
      console.error('Error setting guest mode:', error);
      throw error;
    }
  };

  const logoutGuest = () => {
    try {
      setIsGuest(false);
      setGuestRole(null);
      setIsLogged(false);
      setMainUser({});
      setJwt("");
      console.log('Guest mode ended');
    } catch (error) {
      console.error('Error ending guest mode:', error);
      throw error;
    }
  };

  const requireAuthentication = () => {
    if (!isLogged && !isGuest) {
      throw new Error('Authentication required. Please login or continue as guest.');
    }
    if (isGuest) {
      throw new Error('This feature requires login. Please login to continue.');
    }
  };
  */

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

    // Utility functions - Guest functions disabled, login mandatory
    // loginAsGuest,     // Disabled - guest features not available
    // logoutGuest,      // Disabled - guest features not available
    // requireAuthentication, // Disabled - not needed with mandatory login

    // Computed states - Login is now mandatory
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
