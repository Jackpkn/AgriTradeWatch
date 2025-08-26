import React, { createContext, useContext, useState } from "react";

export const GlobalContext = createContext();

const { Provider } = GlobalContext;

export const GlobalProvider = ({ children }) => {

  const [isLogged, setIsLogged] = useState(false);
  const [mainUser, setMainUser] = useState({});
  const [currentLocation, setCurrentLocation] = useState({});
  const [jwt, setJwt] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  return <Provider value={{ isLoading, setIsLoading, mainUser, setMainUser, isLogged, setIsLogged, jwt, setJwt, currentLocation, setCurrentLocation }} >{children}</Provider>;
};
