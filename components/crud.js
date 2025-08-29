import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, onSnapshot, getDocs } from 'firebase/firestore';

export const registerUser = async (email, password, user) => {
  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    // Add additional fields to Firestore
    await setDoc(doc(db, 'users', newUser.uid), {
      email: user.email,
      createdAt: new Date(),
      name: user.name,
      username: user.username,
      job: user.job,
      phoneNumber: user.phoneNumber, // Spread operator to include additional data
    });

    console.log('User registered and additional data saved to Firestore');

  } catch (error) {
    console.error('Error registering user:', error);
  }
};

export const updateUser = async (userId, updatedData) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, updatedData);
    console.log('User data updated');
  } catch (error) {
    console.error('Error updating user data:', error);
  }
};

export const getUserData = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      console.log('User data:', userDoc.data());
      const userData = userDoc.data();
      return userData;
    } else {
      console.log('No such user!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    if (error.code === 'failed-precondition' || error.code === 'unavailable') {
      console.log('App is offline, trying to get cached data...');
      return null;
    }
    throw error;
  }
};

// Function to fetch all crops
export const fetchCrops = async (path) => {
  console.log('Fetching crops from collection:', path);
  try {
    const cropsQuery = query(collection(db, path));
    const snapshot = await getDocs(cropsQuery);
    const crops = [];
    snapshot.forEach((doc) => {
      crops.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Received ${crops.length} crops from ${path}`);
    console.log(crops);
    return crops;
  } catch (error) {
    console.error('Error fetching crops:', error);
    throw error;
  }
};
