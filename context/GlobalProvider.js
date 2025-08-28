import React, { createContext, useContext, useState, useEffect } from "react";
import { getMandatoryLocation } from "../components/getLocation";

export const GlobalContext = createContext();

const { Provider } = GlobalContext;

export const GlobalProvider = ({ children }) => {

  const [isLogged, setIsLogged] = useState(false);
  const [mainUser, setMainUser] = useState({});
  const [currentLocation, setCurrentLocation] = useState({});
  const [jwt, setJwt] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [locationRequested, setLocationRequested] = useState(false);

  // Request location permission on app start
  useEffect(() => {
    const requestLocationOnAppStart = async () => {
      console.log('GlobalProvider: Requesting location permission on app start...');
      setIsLoading(true);

      await getMandatoryLocation(
        (location) => {
          console.log('GlobalProvider: Location permission granted and location obtained');
          setCurrentLocation(location);
          setLocationRequested(true);
          setIsLoading(false);
        },
        (error) => {
          console.error('GlobalProvider: Location permission denied or error:', error);
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

  return <Provider value={{
    isLoading,
    setIsLoading,
    mainUser,
    setMainUser,
    isLogged,
    setIsLogged,
    jwt,
    setJwt,
    currentLocation,
    setCurrentLocation,
    locationRequested,
    setLocationRequested
  }} >{children}</Provider>;
};
