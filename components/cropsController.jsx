// API IMPORTS
import { farmersService, consumersService } from '@/services';

export const addCrop = async (crop, job = "farmers", userID, imageUri = "") => {
  try {
    // API ADD CROP
    const cropData = {
      commodity: crop.name,
      quantity: crop.quantity,
      image: imageUri,
      latitude: crop.location?.latitude || 0,
      longitude: crop.location?.longitude || 0,
      date: new Date().toISOString(),
    };

    if (job === 'consumer') {
      cropData.buyingPrice = crop.pricePerUnit;
      cropData.quantityBought = crop.quantity;
      cropData.userId = userID;
      await consumersService.createConsumerData(cropData);
    } else {
      cropData.sellingPrice = crop.pricePerUnit;
      cropData.quantitySold = crop.quantity;
      await farmersService.createFarmerData(cropData);
    }

    console.log('crop and image added to database via API');

  } catch (error) {
    console.error('Error adding crop:', error);
    throw error; // Re-throw to handle in calling component
  }
};

export const getAllCrops = async (job) => {
  try {
    // FIREBASE GET ALL CROPS - COMMENTED OUT FOR API MIGRATION
    // const querySnapshot = await getDocs(collection(db, job));
    // const crops = querySnapshot.docs.map(doc => doc.data());
    // return crops;

    // NEW API GET ALL CROPS
    let crops = [];
    if (job === 'consumer') {
      crops = await consumersService.getAllConsumers();
    } else if (job === 'farmers') {
      crops = await farmersService.getAllFarmers();
    } else {
      // If job is not specified, get both farmers and consumers data
      const [farmersData, consumersData] = await Promise.all([
        farmersService.getAllFarmers(),
        consumersService.getAllConsumers()
      ]);
      crops = [...farmersData, ...consumersData];
    }

    console.log('All crops retrieved via API:', crops.length);
    return crops;
  } catch (error) {
    console.error('Error getting crops:', error);
    throw error; // Re-throw to handle in calling component
  }
};



export const getCropById = async (userId, job = 'farmers') => {
  try {
    // FIREBASE GET CROP BY ID - COMMENTED OUT FOR API MIGRATION
    // Implementation was empty in Firebase version

    // NEW API GET CROP BY ID
    if (job === 'consumer') {
      return await consumersService.getConsumersDataByUserId(userId);
    } else {
      // For farmers, we might need to implement a different approach
      // since the API doesn't have a direct userId field for farmers
      // For now, return all farmers data
      return await farmersService.getAllFarmers();
    }
  } catch (error) {
    console.error('Error getting crop by ID:', error);
    throw error;
  }
};