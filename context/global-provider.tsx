
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { Alert, AppState } from "react-native";
import { getMandatoryLocation } from "@/components/getLocation";
import { networkManager, addNetworkListener, refreshNetworkStatus } from "@/utils/networkUtils";
import authService, { User } from "@/services/auth-service";
import { JSX } from "react/jsx-runtime";

// ========================================================================
// Type Definitions
// ========================================================================

/**
 * Defines the structure for location data.
 */
interface Location {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
}

/**
 * The contract for the context value. This is the single source of truth
 * for the data and actions provided to the entire application.
 */
interface GlobalContextType {
    // Core State
    isLoading: boolean;
    isLogged: boolean;
    isOnline: boolean;
    mainUser: User | null;
    currentLocation: Location | null;

    // Derived State (Strictly typed, no 'guest')
    userRole: 'consumer' | 'farmer' | null;

    // Actions / Methods
    logout: () => Promise<void>;
    requireAuthentication: <T>(callback: () => T) => T | null;

    // Exposed Setters (use with caution)
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// ========================================================================
// Context Creation & Custom Hook
// ========================================================================

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

/**
 * Custom hook to consume the GlobalContext.
 * This is the recommended way for components to access global state.
 * It ensures the hook is used within a component wrapped by GlobalProvider.
 */
export const useGlobal = (): GlobalContextType => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error("useGlobal must be used within a GlobalProvider");
    }
    return context;
};

// ========================================================================
// Provider Component
// ========================================================================

interface GlobalProviderProps {
    children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLogged, setIsLogged] = useState<boolean>(false);
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [mainUser, setMainUser] = useState<User | null>(null);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

    // --- Effects ---

    // Effect 1: Initialize session and listen for all authentication changes.
    useEffect(() => {
        // The listener is the single source of truth for auth-related state changes.
        const unsubscribe = authService.onAuthStateChanged((user) => {
            console.log('🔄 Auth state changed:', { user, isLogged: !!user });
            setMainUser(user);
            setIsLogged(!!user);
        });

        const initialize = async () => {
            setIsLoading(true);
            try {
                // This will trigger the listener above if a valid session is found.
                await authService.initializeAuth();
            } catch (error) {
                console.error("Critical error during session initialization:", error);
                // Ensure user is logged out if initialization fails for any reason.
                await authService.logout();
            } finally {
                setIsLoading(false);
            }
        };

        initialize();

        // Cleanup the listener when the provider unmounts.
        return () => unsubscribe();
    }, []);

    // Effect 2: Monitor network status.
    useEffect(() => {
        const setInitialStatus = async () => {
            const status = await networkManager.getNetworkStatus();
            setIsOnline(status.isConnected);
        };

        setInitialStatus();

        const unsubscribe = addNetworkListener((status: { isConnected: boolean | ((prevState: boolean) => boolean); }) => {
            setIsOnline(status.isConnected);
        });

        // Listen for app state changes to refresh network status
        const handleAppStateChange = async (nextAppState: string) => {
            if (nextAppState === 'active') {
                // Refresh network status when app becomes active
                console.log('App became active, refreshing network status...');
                await refreshNetworkStatus();
            }
        };

        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            unsubscribe();
            appStateSubscription?.remove();
        };
    }, []);

    // Effect 3: Request mandatory location permission once on app start.
    useEffect(() => {
        let hasRequestedLocation = false;

        const requestLocation = async () => {
            if (hasRequestedLocation) return; // Prevent multiple requests
            hasRequestedLocation = true;

            try {
                // Assumes getMandatoryLocation is promise-based for cleaner async/await
                console.log('GlobalProvider: Requesting location...');
                const location = await getMandatoryLocation();
                console.log('GlobalProvider: Raw location received:', location);

                if (location && location.coords) {
                    // Convert to the format expected by global context
                    const contextLocation = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy,
                        timestamp: location.timestamp || Date.now()
                    };
                    console.log('GlobalProvider: Setting location in context:', contextLocation);
                    setCurrentLocation(contextLocation);
                } else {
                    console.warn('GlobalProvider: Invalid location structure received');
                }
            } catch (error) {
                console.warn("Location permission was denied or failed to retrieve.", error);
                hasRequestedLocation = false; // Allow retry on error
                // You could show a custom alert here guiding the user to settings.
            }
        };

        requestLocation();
    }, []);

    // --- Memoized Callbacks & Derived State ---

    const logout = useCallback(async () => {
        try {
            await authService.logout();
            // State updates (isLogged, mainUser) are handled automatically
            // by the onAuthStateChanged listener, keeping logic centralized.
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }, []);

    const requireAuthentication = useCallback(<T,>(callback: () => T): T | null => {
        if (!isLogged) {
            Alert.alert('Authentication Required', 'Please login to access this feature.');
            return null;
        }
        return callback();
    }, [isLogged]);

    // Derived state for user role. It's null if no user is logged in.
    const userRole = mainUser ? mainUser.job : null;

    // --- Context Value ---

    const contextValue: GlobalContextType = {
        isLoading,
        isLogged,
        isOnline,
        mainUser,
        currentLocation,
        userRole,
        logout,
        requireAuthentication,
        setIsLoading,
    };

    return (
        <GlobalContext.Provider value={contextValue}>
            {children}
        </GlobalContext.Provider>
    );
};