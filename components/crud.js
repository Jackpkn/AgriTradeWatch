// API IMPORTS
import { authService, userService, cropsService, farmersService, consumersService } from '@/services';

export const registerUser = async (email, password, user) => {
  try {
    // API REGISTRATION
    const userData = {
      ...user,
      email,
      password,
    };
    
    const result = await authService.register(userData);
    console.log('User registered successfully via API');
    return result.user;

  } catch (error) {
    console.error('Error registering user:', error);
    throw error; // Re-throw to handle in calling component
  }
};

export const updateUser = async (userId, updatedData) => {
  try {
    // API UPDATE
    const updatedUser = await userService.updateUser(userId, updatedData);
    console.log('User data updated via API');
    return updatedUser;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error; // Re-throw to handle in calling component
  }
};

export const getUserData = async (userId) => {
  try {
    // API GET USER
    const userData = await userService.getUserById(userId);
    console.log('User data retrieved via API:', userData);
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Handle offline/network errors gracefully
    if (error.status === 0 || error.message?.includes('Network')) {
      console.log('App is offline, returning null for graceful degradation');
      return null; // Return null instead of throwing error
    }
    throw error;
  }
};

// Function to fetch all crops
export const fetchCrops = async (path) => {
  console.log('Fetching crops from collection:', path);
  try {
    // API FETCH CROPS
    // Map Firebase collection paths to API endpoints
    let crops = [];
    
    if (path === 'consumers') {
      crops = await consumersService.getAllConsumers();
    } else if (path === 'farmers') {
      crops = await farmersService.getAllFarmers();
    } else {
      // For other paths, try to get both farmers and consumers data
      try {
        const [farmersData, consumersData] = await Promise.all([
          farmersService.getAllFarmers(),
          consumersService.getAllConsumers()
        ]);
        crops = [...farmersData, ...consumersData];
      } catch (error) {
        console.log('Error fetching combined data, returning empty array');
        crops = [];
      }
    }
    
    // Log raw price data for debugging
    crops.forEach(crop => {
      if (crop.pricePerUnit) {
        console.log(`Raw ${path} crop: ${crop.name} - Price: ${crop.pricePerUnit} (${typeof crop.pricePerUnit})`);
      }
    });
    
    console.log(`Received ${crops.length} crops from ${path}`);
    console.log(crops);
    return crops;
  } catch (error) {
    console.error('Error fetching crops:', error);

    // Handle offline/network errors gracefully
    if (error.status === 0 || error.message?.includes('Network')) {
      console.log('App is offline, returning empty array for graceful degradation');
      return []; // Return empty array instead of throwing error
    }

    // For other errors, still throw them
    throw error;
  }
};
