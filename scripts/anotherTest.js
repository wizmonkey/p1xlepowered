import {
  auth,
  db,
  setDoc,
  getDoc,
  doc,
  onAuthStateChanged,
  signOut,
} from './fireAuth.js';

// Check if elements exist before accessing them
const displayName = document.querySelectorAll('.displayName');
const displayEmail = document.getElementById('displayEmail');
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
      if (displayName) displayName.forEach((nameElement) => {
        nameElement.innerHTML = userData.username;
      });
      if (displayEmail) displayEmail.innerText = userData.email;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    showAlert('Error fetching user data', 'danger');
  }
};

const checkAuthState = async () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      displayUserInfo(user);
      displayUserLists(user.uid); // Call the function to display user's lists
    } else {
      console.log('No user is signed in.');
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

    displayList(userData.wishlist, 'wishlist', userId);
    displayList(userData.completed, 'completed', userId);
    displayList(userData.playing, 'playing', userId);

    const allGames = [
      ...userData.wishlist.map((game) => ({ ...game, list: 'wishlist' })),
      ...userData.completed.map((game) => ({ ...game, list: 'completed' })),
      ...userData.playing.map((game) => ({ ...game, list: 'playing' })),
    ];

    displayAllGames(allGames, userId);
  } catch (error) {
    console.error('Error fetching lists:', error);
    showAlert('Error fetching lists', 'danger');
  }
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
        <span class="delete-btn" data-id="${item.gameId}" data-list="${containerId}" data-bs-toggle="tooltip" data-bs-placement="top" title="Delete Game">
        <i class="bi bi-x-circle mx-1 list-icon" style="color: red;" 
        onmouseover="this.className = 'bi bi-x-circle-fill mx-1 list-icon'" 
        onmouseleave="this.className = 'bi bi-x-circle mx-1 list-icon'"></i>
        </span>
      </div>`;
    container.appendChild(listItem);

    document.querySelectorAll(`.${containerId}-count`).forEach((countElement) => {
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
        const confirmDelete = confirm('Are you sure you want to delete this game?');
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
    const updatedList = userData[containerId].filter(item => item.gameId !== gameId);

    // Update Firestore
    await setDoc(userDocRef, {
      ...userData,
      [containerId]: updatedList
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
          <span class="delete-btn" data-id="${item.gameId}" data-list="${item.list}" data-bs-toggle="tooltip" data-bs-placement="top" title="Delete Game">
          <i class="bi bi-x-circle mx-1 list-icon" style="color: red;" 
          onmouseover="this.className = 'bi bi-x-circle-fill mx-1 list-icon'" 
          onmouseleave="this.className = 'bi bi-x-circle mx-1 list-icon'"></i>
          </span>
        </div>`;
    container.appendChild(listItem);
    document.querySelectorAll(`.allGamesCount`).forEach((countElement) => {
      countElement.innerHTML = allGames.length;
    });  });

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
      const confirmDelete = confirm('Are you sure you want to delete this game?');
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
    const updatedToList = [...userData[toList], game];

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

const exportUserData = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData) {
      showAlert('No user data found', 'warning');
      return;
    }

    // Convert the user data to JSON
    const userDataJson = JSON.stringify(userData, null, 2);

    // Create a blob from the JSON data
    const blob = new Blob([userDataJson], { type: 'application/json' });

    // Create a link element to download the blob as a file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `user_data_${userId}.json`;

    // Programmatically click the link to trigger the download
    link.click();

    // Revoke the object URL to free up resources
    URL.revokeObjectURL(link.href);

    showAlert('User data exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting user data:', error);
    showAlert('Error exporting user data', 'danger');
  }
};
const exportDataButton = document.getElementById('exportDataButton');

if (exportDataButton) {
  exportDataButton.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (user) {
      await exportUserData(user.uid);
    } else {
      showAlert('No user is signed in.', 'warning');
    }
  });
}


if (logOutButton) {
  logOutButton.addEventListener('click', userSignOut);
}



checkAuthState();
