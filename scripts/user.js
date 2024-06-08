import {
  auth,
  db,
  setDoc,
  getDoc,
  doc,
  ref,
  storage,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  onAuthStateChanged,
  signOut,
} from './firebase.js';

// Check if elements exist before accessing them
const displayName = document.querySelectorAll('.displayName');
const displayEmail = document.getElementById('displayEmail');
const displayJoinDate = document.getElementById('displayJoinDate');
const displayAvatar = document.querySelectorAll('.avatar');
const logOutButton = document.getElementById('logOut');

const showAlert = (message, type) => {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show rnd fw-bold`;
  alert.role = 'alert';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertContainer.appendChild(alert);
  setTimeout(() => {
    alert.classList.remove('show');
    alert.classList.add('hide');
    setTimeout(() => alert.remove(), 500);
  }, 5000);
};

const displayUserInfo = async (user) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (displayName)
        displayName.forEach((nameElement) => {
          nameElement.innerHTML = userData.username;
        });
      if (displayEmail) displayEmail.innerText = userData.email;

      if (displayJoinDate) {
        const joinDate = userData.joinDate.toDate();
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        const formattedJoinDate = joinDate.toLocaleDateString('en-US', options);
        displayJoinDate.innerText = formattedJoinDate;
      }
       if (displayAvatar) {
        displayAvatar.forEach((avatarElement) => {
          avatarElement.src = userData.avatarURL;
          avatarElement.onerror = () => {
            avatarElement.src = '../assets/noImg.jpg';
          }
        })
      }
    
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    showAlert('Error fetching user data', 'danger');
  }
};

const avatarInput = document.getElementById('avatarInput');
if (avatarInput) {

  avatarInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const user = auth.currentUser;
    if (user) {
      await uploadUserAvatar(user.uid, file);
    } else {
      console.log('No user is signed in.');
    }
  });
}

const uploadUserAvatar = async (userId, file) => {
  try {
    // Create a reference to the location where the file should be stored in Storage
    const storageRef = ref(storage, `avatars/${userId}/avatar.jpg`); // Assuming avatar.jpg as the filename

    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL for the file
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update user document with the download URL
    await setDoc(doc(db, 'users', userId), {
      avatarURL: downloadURL
    }, { merge: true });

    // Show alert for successful upload
    showAlert('User avatar uploaded successfully, reload page to see changes', 'success');

    // reload page to display the uploaded avatar
    // location.reload()
  } catch (error) {
    console.error('Error uploading user avatar:', error);
    showAlert('Error uploading user avatar', 'danger');
  }
};


const checkAuthState = async () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      displayUserInfo(user);
      displayUserLists(user.uid);
    } else {
      console.log('User is not signed in.');
      window.location.href = 'auth.html';
    }
  });
};

const userSignOut = async () => {
  try {
    await signOut(auth);
    window.location.href = 'auth.html';
  } catch (error) {
    console.error('Error signing out:', error);
    showAlert('Error signing out', 'danger');
  }
};

const displayUserLists = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData.wishlist) userData.wishlist = [];
    if (!userData.completed) userData.completed = [];
    if (!userData.playing) userData.playing = [];

    const noGames = userData.wishlist.length === 0 && userData.completed.length === 0 && userData.playing.length === 0;
    if (noGames) {
      // Display a message prompting the user to add games
      const dashboardContainer = document.getElementById('dashboard');
      if (dashboardContainer) {
        dashboardContainer.innerHTML = 
        `<div class="py-3">
        <h3 class="text-center">You have not added any games yet. Add some games to see them here!</h3> 
        <button class="btn btn-light w-100 mt-2 fw-bold" data-bs-toggle="modal"
        data-bs-target="#searchModal">ADD GAMES</button>
        </div>
        `;
      }
      return;
    }

    displayList(userData.wishlist, 'wishlist', userId);
    displayList(userData.completed, 'completed', userId);
    displayList(userData.playing, 'playing', userId);

    // Sort the lists by dateAdded (most recent first)
    const sortedWishlist = [...userData.wishlist].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    const sortedCompleted = [...userData.completed].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    const sortedPlaying = [...userData.playing].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    // Extract the most recent games from each list
    const wishlistGames = sortedWishlist.slice(0, 3);
    const completedGames = sortedCompleted.slice(0, 3);
    const playingGames = sortedPlaying.slice(0, 3);

    // Clear the dashboard container before displaying new games
    const dashboardContainer = document.getElementById('dashboard');
    if (dashboardContainer) {
      dashboardContainer.innerHTML = '';
    }

    // Display the dashboard games for each list
    displayDashboardGames(wishlistGames, 'Games to Play', userId);
    displayDashboardGames(completedGames, 'Recently Completed', userId);
    displayDashboardGames(playingGames, 'Currently Playing', userId);

    const allGames = [
      ...userData.wishlist.map((game) => ({ ...game, list: 'wishlist' })),
      ...userData.completed.map((game) => ({ ...game, list: 'completed' })),
      ...userData.playing.map((game) => ({ ...game, list: 'playing' })),
    ];

    displayAllGames(allGames, userId);

    // Calculate and update the allGamesCount
    const totalGames = allGames.length;
    document.querySelectorAll(`.totalGames`).forEach((countElement) => {
      countElement.innerHTML = totalGames;
    });

  } catch (error) {
    console.error('Error fetching lists:', error);
    showAlert('Error fetching lists', 'danger');
  }
};

const displayDashboardGames = (games, listName, userId) => {
  const dashboardContainer = document.getElementById('dashboard');
  if (!dashboardContainer) return;

  // Only display the list if there are games in it
  if (games.length === 0) return;

  // Create a title for the list
  const title = document.createElement('h2');
  title.innerText = `${listName}`;
  dashboardContainer.appendChild(title);

  // Create a row to contain the cards
  const row = document.createElement('div');
  row.classList.add('row', 'justify-content-start');
  dashboardContainer.appendChild(row);

  games.forEach((game) => {
    // Create a column to contain each card
    const col = document.createElement('div');
    col.classList.add('col-md-4', 'my-3'); // Use col-md-6 for two cards per row on larger screens

    // Calculate time difference
    const dateAdded = new Date(game.dateAdded);
    const now = new Date();
    const timeDifference = now.getTime() - dateAdded.getTime();
    const minutes = Math.floor(timeDifference / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);

    // Format time difference
    let timeAgo;
    if (months > 0) {
      timeAgo = `${months} month${months > 1 ? 's' : ''} ago`;
    } else if (days > 0) {
      timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    const formattedDateAdded = dateAdded.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Create the card
    const card = document.createElement('div');
    card.classList.add('card', 'dash-card', 'rnd', 'dark-bg');
    const cardImage = document.createElement('img');
    cardImage.src = game.backgroundImage;
    cardImage.classList.add('card-img-top', 'dash-card-img-top',  'rnd', 'bg-dark');
    card.appendChild(cardImage);
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body', 'dash-card-body');
    const cardTitle = document.createElement('h5');
    cardTitle.classList.add('card-title', 'text-light', 'p-0');
    cardTitle.innerText = game.gameName;
    const cardText = document.createElement('p');
    cardText.classList.add('card-text', 'text-light', 'p-0');
    cardText.innerText = `Added ${timeAgo}`;
    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);
    card.appendChild(cardBody);
    col.appendChild(card);
    row.appendChild(col);


    // Add click event listener to open modal
    col.addEventListener('click', () => {
      // Fill modal content with game details
      const modalTitle = document.getElementById('gameModalLabel');
      const modalImg = document.querySelector('.modal-img');
      const modalDate = document.querySelector('.modal-date');
      const modalStatus = document.querySelector('.modal-status');
      const gamePage = document.querySelector('.game-page');

      modalTitle.innerText = game.gameName;
      modalImg.src = game.backgroundImage;
      modalDate.innerText = formattedDateAdded;
      modalStatus.innerText = listName;
      gamePage.href = `game.html?id=${game.gameId}`;

      // Show modal
      const gameModal = new bootstrap.Modal(document.getElementById('gameModal'));
      gameModal.show();
    });
    
  });
};

const displayList = (list, containerId, userId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  list.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.classList = `list-group-item text-light rnd list-card ${list}-text`;
    listItem.innerHTML = `
      <div class="d-flex ${containerId}-text fw-semibold">${item.gameName}</div>
      <div class="d-flex">
        ${
          containerId !== 'completed' && !isInList(list, 'completed')
            ? `
        
        <span class="move-btn" data-id="${item.gameId}" data-from="${containerId}" data-to="completed" data-bs-toggle="tooltip" data-bs-placement="top" title="Move to Completed">
        <i class="bi bi-check-circle mx-1 list-icon" style="color: springgreen;" 
        onmouseover="this.className = 'bi bi-check-circle-fill mx-1 list-icon'" onmouseleave="this.className = 'bi bi-check-circle mx-1 list-icon'">
        </i></span>`
            : ''
        }

        ${
          containerId !== 'playing' && !isInList(list, 'playing')
            ? `
        <span class="move-btn" data-id="${item.gameId}" data-from="${containerId}" data-to="playing" data-bs-toggle="tooltip" data-bs-placement="top" title="Move to Playing">
        <i class="bi bi-play-circle mx-1 list-icon" style="color: dodgerblue;" 
        onmouseover="this.className = 'bi bi-play-circle-fill mx-1 list-icon'" 
        onmouseleave="this.className = 'bi bi-play-circle mx-1 list-icon'">
        </i></span>`
            : ''
        }

        ${
          containerId !== 'wishlist' && !isInList(list, 'wishlist')
            ? `
        <span class="move-btn" data-id="${item.gameId}" data-from="${containerId}" data-to="wishlist" data-bs-toggle="tooltip" data-bs-placement="top" title="Move to Wishlist">
        <i class="bi bi-bookmark mx-1 list-icon" style="color: #f32c5e;" 
        onmouseover="this.className = 'bi bi-bookmark-fill mx-1 list-icon'" 
        onmouseleave="this.className = 'bi bi-bookmark mx-1 list-icon'">
        </i></span>`
            : ''
        }
        <!-- Delete button -->
        <span class="delete-btn" data-id="${
          item.gameId
        }" data-list="${containerId}" data-bs-toggle="tooltip" data-bs-placement="top" title="Delete Game">
        <i class="bi bi-x-circle mx-1 list-icon" style="color: red;" 
        onmouseover="this.className = 'bi bi-x-circle-fill mx-1 list-icon'" 
        onmouseleave="this.className = 'bi bi-x-circle mx-1 list-icon'"></i>
        </span>
      </div>`;
    container.appendChild(listItem);

    document
      .querySelectorAll(`.${containerId}-count`)
      .forEach((countElement) => {
        countElement.innerHTML = list.length;
      });
  });

  // Add event listeners for move buttons
  const moveButtons = container.querySelectorAll('.move-btn');
  // Modify the event listener for move buttons
  moveButtons.forEach((button) => {
    new bootstrap.Tooltip(button); // Initialize tooltip for each button
    button.addEventListener('click', async (event) => {
      const gameId = button.getAttribute('data-id'); // Accessing data from button dataset
      const fromList = button.getAttribute('data-from');
      const toList = button.getAttribute('data-to');
      const game = list.find((item) => item.gameId === gameId);

      // Hide the tooltip when the button is clicked
      const tooltipInstance = bootstrap.Tooltip.getInstance(button);
      if (tooltipInstance) {
        tooltipInstance.hide();
      }

      await moveGameBetweenLists(userId, game, fromList, toList);
    });
  });

  // Add event listeners for delete buttons
  const deleteButtons = container.querySelectorAll('.delete-btn');
  deleteButtons.forEach((button) => {
    new bootstrap.Tooltip(button); // Initialize tooltip for each button
    button.addEventListener('click', async (event) => {
      const gameId = button.getAttribute('data-id'); // Accessing data from button dataset
      const listName = button.getAttribute('data-list');
      const confirmDelete = confirm(
        'Are you sure you want to delete this game?'
      );
      if (confirmDelete) {
        await deleteGame(userId, gameId, listName);
      }
    });
  });
};

const deleteGame = async (userId, gameId, containerId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData[containerId]) return;

    // Remove game from the list
    const updatedList = userData[containerId].filter(
      (item) => item.gameId !== gameId
    );

    // Update Firestore
    await setDoc(userDocRef, {
      ...userData,
      [containerId]: updatedList,
    });

    showAlert('Game deleted successfully', 'success');
    displayUserLists(userId); // Refresh the lists displayed on the page
  } catch (error) {
    console.error('Error deleting game:', error);
    showAlert('Error deleting game', 'danger');
  }
};

const displayAllGames = (allGames, userId) => {
  const container = document.getElementById('allGames');
  if (!container) return;

  container.innerHTML = '';
  allGames.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.classList = `list-group-item d-flex mb-1 justify-content-between align-items-center rnd list-card ${item.list}`;
    listItem.innerHTML = `
        <div class="d-flex fw-semibold ${item.list}-text">${item.gameName}</div>
        <div class="d-flex">
          ${
            item.list !== 'completed'
              ? `<span class="move-btn" data-id="${item.gameId}" data-from="${item.list}" data-to="completed" data-bs-toggle="tooltip" data-bs-placement="top" title="Move to Completed">
              <i class="bi bi-check-circle mx-1 list-icon" style="color: springgreen;" 
              onmouseover="this.className = 'bi bi-check-circle-fill mx-1 list-icon'" onmouseleave="this.className = 'bi bi-check-circle mx-1 list-icon'">
              </i>
              </span>`
              : ''
          }
          ${
            item.list !== 'playing'
              ? `<span class="move-btn" data-id="${item.gameId}" data-from="${item.list}" data-to="playing" data-bs-toggle="tooltip" data-bs-placement="top" title="Move to Playing">
              <i class="bi bi-play-circle mx-1 list-icon" style="color: dodgerblue;" 
              onmouseover="this.className = 'bi bi-play-circle-fill mx-1 list-icon'" 
              onmouseleave="this.className = 'bi bi-play-circle mx-1 list-icon'">
              </i>
              </span>`
              : ''
          }
          ${
            item.list !== 'wishlist'
              ? `<span class="move-btn" data-id="${item.gameId}" data-from="${item.list}" data-to="wishlist" data-bs-toggle="tooltip" data-bs-placement="top" title="Move to Wishlist">
              <i class="bi bi-bookmark mx-1 list-icon" style="color: #f32c5e;" onmouseover="this.className = 'bi bi-bookmark-fill mx-1 list-icon'" 
              onmouseleave="this.className = 'bi bi-bookmark mx-1 list-icon'"></i>
              </span>`
              : ''
          }
          <!-- Delete button -->
          <span class="delete-btn" data-id="${item.gameId}" data-list="${
      item.list
    }" data-bs-toggle="tooltip" data-bs-placement="top" title="Delete Game">
          <i class="bi bi-x-circle mx-1 list-icon" style="color: red;" 
          onmouseover="this.className = 'bi bi-x-circle-fill mx-1 list-icon'" 
          onmouseleave="this.className = 'bi bi-x-circle mx-1 list-icon'"></i>
          </span>
        </div>`;
    container.appendChild(listItem);
  });

  // Add event listeners for move buttons
  const moveButtons = container.querySelectorAll('.move-btn');
  moveButtons.forEach((button) => {
    new bootstrap.Tooltip(button); // Initialize tooltip for each button
    button.addEventListener('click', async (event) => {
      const gameId = button.getAttribute('data-id'); // Accessing data from button dataset
      const fromList = button.getAttribute('data-from');
      const toList = button.getAttribute('data-to');
      const game = allGames.find((item) => item.gameId === gameId);

      // Hide the tooltip when the button is clicked
      const tooltipInstance = bootstrap.Tooltip.getInstance(button);
      if (tooltipInstance) {
        tooltipInstance.hide();
      }

      await moveGameBetweenLists(userId, game, fromList, toList);
    });
  });
  const deleteButtons = container.querySelectorAll('.delete-btn');
  deleteButtons.forEach((button) => {
    new bootstrap.Tooltip(button); // Initialize tooltip for each button
    button.addEventListener('click', async (event) => {
      const gameId = button.getAttribute('data-id'); // Accessing data from button dataset
      const listName = button.getAttribute('data-list');
      const confirmDelete = confirm(
        'Are you sure you want to delete this game?'
      );
      if (confirmDelete) {
        await deleteGame(userId, gameId, listName);
      }
    });
  });
};

// Function to check if a game is in a specific list
const isInList = (list, targetList) => {
  return list.some((item) => item.gameList === targetList);
};

const moveGameBetweenLists = async (userId, game, fromList, toList) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData[toList]) userData[toList] = [];
    if (!userData[fromList]) return;

    // Check if the game already exists in the target list
    const gameExistsInTargetList = userData[toList].some(
      (item) => item.gameId === game.gameId
    );
    if (gameExistsInTargetList) {
      showAlert('This game already exists in the target list', 'warning');
      return;
    }

    // Remove game from the original list
    const updatedFromList = userData[fromList].filter(
      (item) => item.gameId !== game.gameId
    );

    // Add game to the new list
    const updatedToList = [
      ...userData[toList],
      { ...game, dateAdded: new Date().toISOString() }
    ];

    // Update Firestore
    await setDoc(userDocRef, {
      ...userData,
      [fromList]: updatedFromList,
      [toList]: updatedToList,
    });

    showAlert(`Game moved from ${fromList} to ${toList}`, 'success');
    displayUserLists(userId); // Refresh the lists displayed on the page
  } catch (error) {
    console.error('Error moving game:', error);
    showAlert('Error moving game', 'danger');
  }
};

// EXPORTING LISTS ////////////////////////////////////////////////////////////////////////
////function to export lists as JSON
const exportListsAsJSON = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    const exportData = {
      user: `${userData.username}`,
      // comment: `Exported from :${userId}`,
      wishlist: userData.wishlist || [],
      playing: userData.playing || [],
      completed: userData.completed || [],
    };

    const jsonString = JSON.stringify(exportData, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${userData.username}-exported-lists.json`;
    // a.download = `${userId}-exported-lists`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting lists as JSON', error);
    showAlert('Error exporting lists as JSON', 'danger');
  }
};

//function to export lists as CSV
const exportListsAsCSV = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    const wishlist = userData.wishlist || [];
    const playing = userData.playing || [];
    const completed = userData.completed || [];

    let csvContent = `Exported from user: ${userData.username}\n\n`;
    csvContent += 'Wishlist, Playing, Completed \n';

    const maxLength = Math.max(
      wishlist.length,
      completed.length,
      playing.length
    );

    for (let i = 0; i < maxLength; i++) {
      const wishlistGame = wishlist[i] ? wishlist[i].gameName : '';
      const playingGame = playing[i] ? playing[i].gameName : '';
      const completedGame = completed[i] ? completed[i].gameName : '';
      csvContent += `${wishlistGame},${playingGame}, ${completedGame}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `exported-lists-${userData.username}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting lists as CSV:', error);
    showAlert(
      'Something went wrong while deleting lists, please try again ',
      'danger'
    );
  }
};

//get the buttons for exporting
const exportAsJSONBtn = document.getElementById('exportJSON');
if (exportAsJSONBtn) {
  exportAsJSONBtn.addEventListener('click', () => {
    const userId = auth.currentUser.uid;
    exportListsAsJSON(userId);
  });
}
const exportAsCSVBtn = document.getElementById('exportCSV');
if (exportAsCSVBtn) {
  exportAsCSVBtn.addEventListener('click', () => {
    const userId = auth.currentUser.uid;
    exportListsAsCSV(userId);
  });
}

//DELETING LISTS AND ACCOUNT ////////////////////////////////////////////////////////////////
//function to delete all lists
const deleteAllLists = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    //set the lists to an empty arrray
    await setDoc(userDocRef, {
      ...userData,
      wishlist: [],
      playing: [],
      completed: [],
    });

    showAlert('All lists have been deleted successfully', 'success');
    displayUserLists(userId);
  } catch (error) {
    console.error('Error deleting lists', error);
    showAlert(
      'Something went wrong while deleting lists, please try again',
      'danger'
    );
  }
};
//get the button for deleting lists
const deleteAllListsButton = document.getElementById('deleteAllLists');
if (deleteAllListsButton) {
  deleteAllListsButton.addEventListener('click', () => {
    const userId = auth.currentUser.uid;
    const confirmDelete = confirm(
      'Are you sure you want to delete all lists? This action cannot be undone.'
    );
    if (confirmDelete) {
      deleteAllLists(userId);
    }
  });
}

//funtion to delete the user account permanently
const deleteAccount = async (userId) => {
  try {
    const user = auth.currentUser;
    //delte user document from firestore
    await db.collection('users').doc(user.uid).delete();
    //delete user account from firebase auth
    await user.delete();
    //ridirect to auth page
    window.location.href = 'auth.html';
  } catch (error) {
    console.error('Error deleting user account', error);
    showAlert('Error deleting user account', 'danger');
  }
};
//get the delete user button and show alert when clicked
const deleteAcountBtn = document.getElementById('deleteAccount');
if (deleteAcountBtn) {
  deleteAcountBtn.addEventListener('click', () => {
    const confirmDelete = confirm(
      `Wait! Do you really want to delete your account? This action is permanent and cannot be undone.`
    );
    if (confirmDelete) {
      deleteAccount();
    }
  });
}

if (logOutButton) {
  logOutButton.addEventListener('click', userSignOut);
}

checkAuthState();
