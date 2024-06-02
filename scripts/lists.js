import {
    auth,
    db,
    setDoc,
    getDoc,
    doc,
    onAuthStateChanged,
  } from './fireAuth.js';

// Function to add a game to a user's list
const addGameToList = async (userId, listType, gameData) => {
  try {
    // Reference to the user's list collection for the specified type
    const listRef = db.collection('users').doc(userId).collection(listType);

    // Add the game data to the list collection
    await listRef.add(gameData);

    // Show success message or update UI
    console.log('Game added to list successfully');
  } catch (error) {
    console.error('Error adding game to list:', error);
    // Show error message or handle error
  }
};

// Example usage: Adding a game to the user's wishlist
const userId = 'user123'; // Replace with actual user ID
const listType = 'wishlist';
const gameData = {
  title: 'Game Title',
  platform: 'Platform',
  // Add more game details as needed
};

addGameToList(userId, listType, gameData);
