import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  