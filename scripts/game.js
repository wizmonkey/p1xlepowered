import { auth, db, setDoc, getDoc, doc } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const apiKey = '8a972d161c664d8696e1c01b930e9641';
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('id');
  const base = document.getElementById('base');
  const editionList = document.getElementById('editions');
  const seriesList = document.getElementById('series');
  const parentList = document.getElementById('parents');

  // fetch game data
  if (gameId) {
    fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`)
      .then((res) => res.json())
      .then((game) => {
        document.title = game.name;
        displayGameDetails(game);
        fetchEditions(gameId);
        fetchSeries(gameId);
        fetchStores(gameId);
        fetchScreenshots(gameId);

        if (game.parents_count > 0) {
          fetchParentGame(gameId);
        }

        if (game.additions_count > 0) {
          fetchEditions(gameId);
        }
      })
      .catch((error) => {
        base.innerHTML = `<h3>Oops! Something just went wrong. This wasn't supposed to happen. Please try refreshing the page =(. <br>What went wrong : ${error.message}</h3>`;
      });
  } else {
    base.innerHTML = '<p>No game ID provided in the URL.</p>';
  }

  // fetch dlcs and editions of the game
  async function fetchEditions(gameId) {
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games/${gameId}/additions?key=${apiKey}`
      );
      const data = await response.json();
      displayEditions(data.results);
    } catch (error) {
      console.error(error);
    }
  }
  async function fetchParentGame(gameId) {
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games/${gameId}/parent-games?key=${apiKey}`
      );
      const data = await response.json();
      displayParentGame(data.results);
    } catch (error) {
      console.error(error);
    }
  }

  // fetch games from the series
  async function fetchSeries(gameId) {
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games/${gameId}/game-series?key=${apiKey}`
      );
      const data = await response.json();
      displaySeries(data.results);
    } catch (error) {
      console.error(error);
    }
  }

  //fetch the stores where the gamme is available
  async function fetchStores(gameId) {
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games/${gameId}/stores?key=${apiKey}`
      );
      const data = await response.json();
      displayStores(data.results);
    } catch (error) {
      console.error(error);
    }
  }

  // fetch screenshots
  async function fetchScreenshots(gameId) {
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games/${gameId}/screenshots?key=${apiKey}`
      );
      const data = await response.json();
      displayScreenshots(data.results);
    } catch (error) {
      console.error(error);
    }
  }

  // set elements
  const title = document.getElementById('title');
  const release = document.getElementById('release');
  const releaseChip = document.getElementById('releaseChip');
  const metascore = document.getElementById('metascore');
  const rating = document.getElementById('rating');
  const platforms = document.getElementById('platforms');
  const description = document.getElementById('description');
  const website = document.getElementById('website');
  const developer = document.getElementById('developer');
  const publisher = document.getElementById('publisher');
  const gameImage = document.getElementById('gameImage');
  const genres = document.getElementById('genres');
  const tags = document.getElementById('tags');
  const esrb = document.getElementById('esrb');
  const platformIconStrip = document.getElementById('platformIcons');

  // map icons for game platforms
  const platformIcons = {
    pc: 'bi bi-windows',
    playstation: 'bi bi-playstation',
    xbox: 'bi bi-xbox',
    macos: 'bi bi-apple',
    android: 'bi bi-android',
    linux: 'bi bi-ubuntu',
    nintendo: 'bi bi-nintendo-switch',
    web: 'bi bi-globe',
    ios: 'bi bi-phone',
    psp: 'bi bi-controller',
  };

  //map esrb rating to endpoint response id
  const esrbRatingMap = {
    1: 'Everyone',
    2: 'Everyone 10+',
    3: 'Teen 13+',
    4: 'Mature 17+',
    5: 'Adults Only 18+',
  };
  // Define a function to display platform icons for games
  function displayGamePlatformIcons(game, platformIconStrip, platformIcons) {
    if (game?.parent_platforms) {
      game.parent_platforms.forEach((platform) => {
        const platformName = platform.platform.name.toLowerCase();
        const iconClass = platformIcons[platformName] || ''; // Get the corresponding icon class from the map
        if (iconClass) {
          const icon = document.createElement('i');
          icon.className = `${iconClass} mx-1`; // Add some styling classes if needed
          platformIconStrip.appendChild(icon);
        }
      });
    }
  }

  //function to display game details from gaem data fetch request
  function displayGameDetails(game) {
    const gameName = game.name;
    const backgroundImage = game.background_image;
    const addToWishlistButton = document.getElementById('addToWishlistButton');
    if (addToWishlistButton) {
      addToWishlistButton.addEventListener('click', () => {
        addToWishlist(gameId, gameName, backgroundImage);
      });
    }

    // //map platform list
    const platformList = game.platforms
      ? game.platforms.map((platform) => platform.platform.name).join(', ')
      : 'N/A';

    displayGamePlatformIcons(game, platformIconStrip, platformIcons);
    //map publisher list
    const publisherList = game.publishers
      ? game.publishers.map((publisher) => publisher.name).join(', ')
      : 'N/A';

    //map developer list
    const developerList = game.developers
      ? game.developers.map((developer) => developer.name).join(', ')
      : 'N/A';

    //map genres list
    let genreList = game.genres
      ? game.genres.map((genre) => genre.name).join(', ')
      : 'NA';

    //get tags
    let tagList = game.tags
      ? game.tags.map((tag) => tag.name).join(', ')
      : 'NA';

    //esrb rating
    const esrbRating = game.esrb_rating
      ? esrbRatingMap[game.esrb_rating.id]
      : 'Not Rated';

    //release date to release year
    const releaseYear = game.released?.split('-')[0] || '';

    //set data
    title.innerHTML = game.name;
    release.innerHTML = game.released
      ? game.released
      : '<span class="na">N/A</span>';
    releaseChip.innerHTML = releaseYear;
    metascore.innerHTML = game.metacritic
      ? game.metacritic
      : '<span class="na">N/A</span>';
    rating.innerHTML = game.rating
      ? game.rating
      : '<span class="na">N/A</span>';
    platforms.innerHTML = platformList;
    publisher.innerHTML = publisherList;
    developer.innerHTML = developerList;
    description.innerHTML = game.description
      ? game.description
      : '<span class="na">N/A</span>';
    genres.innerHTML = genreList;
    tags.innerHTML = tagList;
    esrb.innerHTML = esrbRating;
    website.innerHTML = game.website
      ? `<a class="text-light" href=${game.website} target="_blank">${game.website}</a>`
      : '<span class="na">N/A</span>';

    gameImage.innerHTML = `<img src="${game.background_image}" class="game-image img-fluid rnd" onerror="this.src='assets/noImg.jpg'">`;
  }

  //show editions and dlcs
  function displayEditions(editions) {
    editionList.innerHTML = '';
    if (editions.length > 0) {
      document.getElementById('editionContainer').style.display = 'block';
      editions.forEach((edition) => {
        const editionItemContainer = document.createElement('div');
        editionItemContainer.classList.add(
          'col-md-12',
          'col-lg-12',
          'col-xl-6',
          'my-1'
        );
        editionItemContainer.innerHTML = `
        <a href="game.html?id=${
          edition.id
        }" class="text-decoration-none text-light">
        <div class="rnd edition-card row brdr">
        <div class="d-flex g-0">
            <div class="p-1">
                <img src="${
                  edition.background_image
                }" class="edition-image rnd" onerror="this.src='assets/noImg.jpg'">
            </div>
            <div class="ms-2 mt-1">
                <div class="card-body">
                    <span class="fw-semibold">${edition.name} (${
          edition.released?.split('-')[0] || ''
        })</span><br>
        <span class="edition-icons"></span><br>
        <i class="bi bi-star-fill"></i>
        <span class="">${edition.rating}</span>
                </div>
            </div>
        </div>
        </div>
        </a>
        </div>
        `;
        const editionIcons =
          editionItemContainer.querySelector('.edition-icons');
        displayGamePlatformIcons(edition, editionIcons, platformIcons);
        editionList.appendChild(editionItemContainer);
      });
    } else {
      editionList.innerHTML = '';
    }
  }

  //display base games if available
  function displayParentGame(parents) {
    editionList.innerHTML = '';
    if (parents.length > 0) {
      parent;
      document.getElementById('parentContainer').style.display = 'block';
      parents.forEach((parent) => {
        const parentItemContainer = document.createElement('div');
        parentItemContainer.classList.add(
          'col-md-12',
          'col-lg-12',
          'col-xl-6',
          'my-1'
        );
        parentItemContainer.innerHTML = `
        <a href="game.html?id=${
          parent.id
        }" class="text-decoration-none text-light">
        <div class="rnd edition-card row brdr">
        <div class="d-flex g-0">
            <div class="p-1">
                <img src="${
                  parent.background_image
                }" class="edition-image rnd" onerror="this.src='assets/noImg.jpg'">
            </div>
            <div class="ms-2 mt-1">
                <div class="card-body">
                    <span class="fw-semibold">${parent.name} (${
          parent.released?.split('-')[0] || ''
        })</span><br>
        <span class="parent-icons"></span><br>
        <i class="bi bi-star-fill"></i>
        <span class="">${parent.rating}</span>
                </div>
            </div>
        </div>
        </div>
        </a>
        </div>
        `;
        const parentIcons = parentItemContainer.querySelector('.parent-icons');
        displayGamePlatformIcons(parent, parentIcons, platformIcons);
        parentList.appendChild(parentItemContainer);
      });
    } else {
      parentList.innerHTML = '';
    }
  }

  //show games from series
  function displaySeries(series) {
    seriesList.innerHTML = '';
    if (series.length > 0) {
      document.getElementById('seriesContainer').style.display = 'block';
      series.forEach((seriesItem) => {
        const seriesItemContainer = document.createElement('div');
        seriesItemContainer.classList.add(
          'col-md-12',
          'col-lg-12',
          'col-xl-6',
          'my-1'
        );
        seriesItemContainer.innerHTML = `
          <a href="game.html?id=${
            seriesItem.id
          }" class="text-decoration-none text-light">
            <div class="rnd edition-card row brdr" style="max-height:200px">
              <div class="d-flex g-0">
                <div class="p-1">
                  <img src="${
                    seriesItem.background_image
                  }" class="edition-image rnd" onerror="this.src='assets/noImg.jpg'">
                </div>
                <div class="ms-2 mt-1">
                  <div class="card-body">
                    <span class="fw-semibold">${seriesItem.name} (${
          seriesItem.released?.split('-')[0] || ''
        })</span><br>
                    <span class="series-icons"></span><br>
                    <i class="bi bi-star-fill"></i>
                    <span class="me-2">${seriesItem.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          </a>
        `;
        const seriesIcons = seriesItemContainer.querySelector('.series-icons');
        displayGamePlatformIcons(seriesItem, seriesIcons, platformIcons);
        seriesList.appendChild(seriesItemContainer);
      });
    } else {
      seriesList.innerHTML = '';
    }
  }

  //map store id to store names and icons
  const storeNames = {
    1: { name: 'Steam', icon: 'assets/steam.svg' },
    2: { name: 'Xbox Store', icon: 'assets/xbox.svg' },
    3: { name: 'PlayStation Store', icon: 'assets/ps.svg' },
    4: { name: 'App Store', icon: 'assets/apple.svg' },
    5: { name: 'GOG', icon: 'assets/gog.svg' },
    6: { name: 'Nintendo Store', icon: 'assets/nintendo.svg' },
    7: { name: 'Xbox 360 Store', icon: 'assets/xbox.svg' },
    8: { name: 'Google Play', icon: 'assets/gplay.svg' },
    9: { name: 'itch.io', icon: 'assets/itch.svg' },
    11: { name: 'Epic Games', icon: 'assets/epic.svg' },
  };

  //display available stores for the game
  function displayStores(stores) {
    const storeList = document.getElementById('stores');
    if (stores.length > 0) {
      storeList.style.display = 'block';
      document.getElementById('buyText').style.display = 'block';
      let storeItemsHTML = '<div class="row">';
      stores.forEach((storeItem) => {
        let storeName;
        let storeIcon;
        if (storeNames.hasOwnProperty(storeItem.store_id)) {
          storeName = storeNames[storeItem.store_id].name;
          storeIcon = storeNames[storeItem.store_id].icon;
        } else {
          storeName = extractStoreName(storeItem.url) || 'Store';
          storeIcon = `assets/unknown.svg`;
        }
        storeItemsHTML += `
        <div class=" col-6 my-1">
        <a class="btn btn-light fw-semibold btn-sm d-flex align-items-center" href=${storeItem.url} target="_blank">
        <img src="${storeIcon}" class="store-icon me-2" style="width: 2.4rem">
        <span>${storeName}</span>
        </a>
        </div>
        `;
      });
      storeItemsHTML += '</div>'; // Close the row
      storeList.innerHTML = storeItemsHTML;
    } else {
      storeList.innerHTML = `<p>No stores available</p>`;
    }
  }
  //get store names from url (format = store.com)
  function extractStoreName(url) {
    const matches = url.match(/\/\/(.*?\.com)/);
    return matches ? matches[1] : null;
  }

  //display screenshots if available
  function displayScreenshots(screenshots) {
    const carouselIndicators = document.getElementById('carousel-indicators');
    const carouselInner = document.getElementById('carousel-inner');

    carouselIndicators.innerHTML = ''; // Clear previous indicators if any
    carouselInner.innerHTML = ''; // Clear previous images if any

    if (screenshots.length > 0) {
      screenshots.forEach((screenshot, index) => {
        // Create carousel indicator
        const indicator = document.createElement('button');
        indicator.setAttribute('type', 'button');
        indicator.setAttribute('data-bs-target', '#screenshotsCarousel');
        indicator.setAttribute('data-bs-slide-to', index);
        indicator.className = index === 0 ? 'active' : '';
        indicator.setAttribute('aria-current', index === 0 ? 'true' : '');
        indicator.setAttribute('aria-label', `Slide ${index + 1}`);
        carouselIndicators.appendChild(indicator);

        // Create carousel item
        const carouselItem = document.createElement('div');
        carouselItem.className =
          index === 0 ? 'carousel-item active' : 'carousel-item';

        const img = document.createElement('img');
        img.src = screenshot.image;
        img.className = 'd-block w-100';

        carouselItem.appendChild(img);
        carouselInner.appendChild(carouselItem);
      });
    } else {
      const noScreenshots = document.createElement('div');
      noScreenshots.className = 'carousel-item active';
      noScreenshots.innerHTML =
        '<p class="text-center">No screenshots available</p>';
      carouselInner.appendChild(noScreenshots);
    }
  }

  const addToWishlist = async (gameId, gameName, backgroundImage) => {
    try {
      // Check if user is logged in
      const user = auth.currentUser;
      if (!user) {
        // If user is not logged in, redirect to login page or show a message
        console.log('User not logged in');
        return;
      }

      // Get the current date
      const currentDate = new Date().toISOString();

      // Get the user's document reference
      const userDocRef = doc(db, 'users', user.uid);

      // Check if the game is already in the user's wishlist
      const userSnapshot = await getDoc(userDocRef);
      const wishlist = userSnapshot.data().wishlist || [];
      const isGameInWishlist = wishlist.some((item) => item.gameId === gameId);
      if (isGameInWishlist) {
        showAlert(`This game is already in your catalogue`, 'warning');
        return;
      }

      // Add the game to the wishlist array in the user document with the current date
      await setDoc(
        userDocRef,
        {
          wishlist: [
            ...wishlist,
            {
              gameId: gameId,
              gameName: gameName,
              backgroundImage: backgroundImage,
              dateAdded: currentDate, // Add the current date
            },
          ],
        },
        { merge: true }
      );
      showAlert(`Game added to your catalogue. <a href="index.html" class="text-primary link-underline-primary">Return to dashboard</a>`, 'success');
    } catch (error) {
      showAlert(`Could not add game to catalogue`, 'danger');
    }
  };


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

  //end
});
