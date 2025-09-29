// API IMPORTS
import { authService, userService, cropsService, farmersService, consumersService } from '@/services';


// Function to fetch all crops
export const fetchCrops = async (path) => {
    console.log('Fetching crops from collection:', path);
    try {
        // API FETCH CROPS
        // Map Firebase collection paths to API endpoints
        let crops = [];

        if (path === 'consumers') {
            console.log('CRUD: Calling consumersService.getAllConsumers()');
            crops = await consumersService.getAllConsumers();
            console.log('CRUD: consumersService returned:', crops?.length || 0, 'items');
        } else if (path === 'farmers') {
            console.log('CRUD: Calling farmersService.getAllFarmers()');
            crops = await farmersService.getAllFarmers();
            console.log('CRUD: farmersService returned:', crops?.length || 0, 'items');
        } else {
            // For other paths, try to get both farmers and consumers data
            try {
                const [farmersData, consumersData] = await Promise.all([
                    farmersService.getAllFarmers(),
                    consumersService.getAllConsumers()
                ]);

                // Remove duplicates based on unique identifier (id, name, or combination)
                const combinedCrops = [...farmersData, ...consumersData];
                const uniqueCrops = combinedCrops.filter((crop, index, self) => {
                    // Create a unique key for each crop
                    const cropKey = `${crop.name || crop.commodity}-${crop.pricePerUnit}-${crop.location?.coords?.latitude}-${crop.location?.coords?.longitude}`;
                    return index === self.findIndex(c => {
                        const cKey = `${c.name || c.commodity}-${c.pricePerUnit}-${c.location?.coords?.latitude}-${c.location?.coords?.longitude}`;
                        return cKey === cropKey;
                    });
                });

                crops = uniqueCrops;
                console.log(`CRUD: Removed ${combinedCrops.length - uniqueCrops.length} duplicate crops`);
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
        console.error('CRUD: Error fetching crops from', path, ':', error);
        console.error('CRUD: Error details:', {
            message: error.message,
            status: error.status,
            data: error.data
        });

        // Handle offline/network errors gracefully
        if (error.status === 0 || error.message?.includes('Network')) {
            console.log('CRUD: App is offline, returning empty array for graceful degradation');
            return []; // Return empty array instead of throwing error
        }

        // For other errors, still throw them
        throw error;
    }
};
