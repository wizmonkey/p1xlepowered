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
const displayName = document.getElementById('displayName');
const displayEmail = document.getElementById('displayEmail');
const logOutButton = document.getElementById('logOut');

const showAlert = (message, type) => {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
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
  }, 3000);
};

const displayUserInfo = async (user) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (displayName) displayName.innerText = userData.username;
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
      ...userData.wishlist.map(game => ({ ...game, list: 'wishlist' })),
      ...userData.completed.map(game => ({ ...game, list: 'completed' })),
      ...userData.playing.map(game => ({ ...game, list: 'playing' }))
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
    listItem.classList =
      'list-group-item d-flex mb-1 justify-content-between align-items-center rnd list-card';
    listItem.innerHTML = `
      <div class="d-flex fw-semibold ${containerId}-text">${item.gameName}</div>
      <div class="d-flex">
        ${containerId !== 'completed' ? `<button class="btn btn-sm btn-success move-btn" data-id="${item.gameId}" data-from="${containerId}" data-to="completed" data-bs-toggle="tooltip" title="Move to Completed"><i class="bi bi-check-circle"></i></button>` : ''}
        ${containerId !== 'playing' ? `<button class="btn btn-sm btn-primary move-btn" data-id="${item.gameId}" data-from="${containerId}" data-to="playing" data-bs-toggle="tooltip" title="Move to Playing"><i class="bi bi-play-circle"></i></button>` : ''}
        ${containerId !== 'wishlist' ? `<button class="btn btn-sm btn-warning move-btn" data-id="${item.gameId}" data-from="${containerId}" data-to="wishlist" data-bs-toggle="tooltip" title="Move to Wishlist"><i class="bi bi-heart"></i></button>` : ''}
      </div>`;
    container.appendChild(listItem);
  });

  // Add event listeners for move buttons
  const moveButtons = container.querySelectorAll('.move-btn');
  moveButtons.forEach(button => {
    new bootstrap.Tooltip(button); // Initialize tooltip for each button
    button.addEventListener('click', async (event) => {
      const gameId = button.getAttribute('data-id'); // Accessing data from button dataset
      const fromList = button.getAttribute('data-from');
      const toList = button.getAttribute('data-to');
      const game = list.find(item => item.gameId === gameId);

      // Hide the tooltip when the button is clicked
      const tooltipInstance = bootstrap.Tooltip.getInstance(button);
      if (tooltipInstance) {
        tooltipInstance.hide();
      }

      await moveGameBetweenLists(userId, game, fromList, toList);
    });
  });
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
        ${item.list !== 'completed' ? `<button class="btn btn-sm btn-success move-btn" data-id="${item.gameId}" data-from="${item.list}" data-to="completed" data-bs-toggle="tooltip" title="Move to Completed"><i class="bi bi-check-circle"></i></button>` : ''}
        ${item.list !== 'playing' ? `<button class="btn btn-sm btn-primary move-btn" data-id="${item.gameId}" data-from="${item.list}" data-to="playing" data-bs-toggle="tooltip" title="Move to Playing"><i class="bi bi-play-circle"></i></button>` : ''}
        ${item.list !== 'wishlist' ? `<button class="btn btn-sm btn-warning move-btn" data-id="${item.gameId}" data-from="${item.list}" data-to="wishlist" data-bs-toggle="tooltip" title="Move to Wishlist"><i class="bi bi-heart"></i></button>` : ''}
      </div>`;
    container.appendChild(listItem);
  });

  // Add event listeners for move buttons
  const moveButtons = container.querySelectorAll('.move-btn');
  moveButtons.forEach(button => {
    new bootstrap.Tooltip(button); // Initialize tooltip for each button
    button.addEventListener('click', async (event) => {
      const gameId = button.getAttribute('data-id'); // Accessing data from button dataset
      const fromList = button.getAttribute('data-from');
      const toList = button.getAttribute('data-to');
      const game = allGames.find(item => item.gameId === gameId);

      // Hide the tooltip when the button is clicked
      const tooltipInstance = bootstrap.Tooltip.getInstance(button);
      if (tooltipInstance) {
        tooltipInstance.hide();
      }

      await moveGameBetweenLists(userId, game, fromList, toList);
    });
  });
};

const moveGameBetweenLists = async (userId, game, fromList, toList) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData[toList]) userData[toList] = [];
    if (!userData[fromList]) return;

    // Check if the game already exists in the target list
    const gameExistsInTargetList = userData[toList].some(item => item.gameId === game.gameId);
    if (gameExistsInTargetList) {
      showAlert('This game already exists in the target list', 'warning');
      return;
    }

    // Remove game from the original list
    const updatedFromList = userData[fromList].filter(item => item.gameId !== game.gameId);

    // Add game to the new list
    const updatedToList = [...userData[toList], game];

    // Update Firestore
    await setDoc(userDocRef, {
      ...userData,
      [fromList]: updatedFromList,
      [toList]: updatedToList
    });

    showAlert(`Game moved from ${fromList} to ${toList}`, 'success');
    displayUserLists(userId); // Refresh the lists displayed on the page
  } catch (error) {
    console.error('Error moving game:', error);
    showAlert('Error moving game', 'danger');
  }
};

if (logOutButton) {
  logOutButton.addEventListener('click', userSignOut);
}

checkAuthState();
