import { auth, db } from '../firebase';
import { addDoc, collection, getDocs } from 'firebase/firestore';

export const addCrop = async (crop, job = "farmers", userID, imageUri = "") => {
  try {
    const path = job === 'consumer' ? 'consumers' : 'farmers'

    // Add additional fields to Firestore
    await addDoc(collection(db, path), {
      createdAt: new Date(),
      userID: userID,
      name: crop.name,
      pricePerUnit: crop.pricePerUnit,
      quantity: crop.quantity,
      image: imageUri,
      location: crop.location,
    });

    console.log('crop and image added to database');

  } catch (error) {
    console.error('Error adding crop:', error);
  }
};

export const getAllCrops = async (job) => {
  try {
    const querySnapshot = await getDocs(collection(db, job));
    const crops = querySnapshot.docs.map(doc => doc.data());
    // console.log('All crops:', crops);
    return crops;
  } catch (error) {

    console.error('Error getting crops:', error);
  }
};



export const getCropById = async (userId) => {

};