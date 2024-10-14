import React, { createContext, useContext } from "react";

const GlobalContext = createContext();
const { Provider } = GlobalContext;

export const useGlobalContext = () => {
  useContext(GlobalContext);
};

export const GlobalProvider = ({ children }) => {

    const [isLogged, setIsLogged] = useState(false);
    const [user, setUser] = useState({});
    const [isLoading, setIsLoading] = useState(false);


  return <Provider value={ {isLoading, setIsLoading, user, setUser, isLogged, setIsLogged} } >{children}</Provider>;
};
