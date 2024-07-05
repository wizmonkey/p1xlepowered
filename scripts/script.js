// Main container
const container = document.getElementById('results');
const search = document.getElementById('gameSearch');

// Search operation
search.addEventListener('input', searchGame);
function searchGame(event) {
  event.preventDefault(event); // Prevent form from submitting
  const apiKey = '8a972d161c664d8696e1c01b930e9641';
  const name = search.value.toLowerCase().trim();

  if (name.length > 2) {
    fetch(`https://api.rawg.io/api/games?key=${apiKey}&search=${name}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok ' + res.statusText);
        }
        return res.json();
      })
      .then((data) => {
        if (data.results && data.results.length > 0) {
          displayResults(data.results);
          // console.log(results.platforms);
        } else {
          container.innerHTML = `<p class="text-center">Oh No! We couldn't find any game with that name =(</p>`;
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        container.innerHTML = `<p>Error fetching data: ${error.message}</p>`;
      });
  } else {
    container.innerHTML =
      '<p class="text-center">Gimme some more words to check for a game!</p>';
  }
}

// map between platform names and their corresponding icons
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

function displayResults(games) {
  container.innerHTML = '';

  const resultsHtml = games
    .map((game) => {

      // add platform icons
      let platformIconsHTML = '';
      // show platform icons based on parent_platforms
      if (game.parent_platforms) {
        game.parent_platforms.forEach(platform => {
          const platformName = platform.platform.name.toLowerCase();
          const iconClass = platformIcons[platformName] || '';
          if (iconClass) {
            // append platform icon HTML to the string
            platformIconsHTML += `<i class="${iconClass} me-2"></i>`;
          }
        });
      }

      //get release yaer from release date
      const releaseDate = game.released?.split('-')[0] || '';

      return `
      <a href="game.html?id=${game.id}" class="text-decoration-none text-light">
        <div class="rnd search-card row mb-2 brdr" style="max-height:150px">
          <div class="d-flex g-0">
            <div class="p-1">
              <img src="${game.background_image}" class="search-image rnd" onerror="this.src='assets/noImg.jpg'">
            </div>
            <div class="ms-2 mt-1">
              <div class="card-body">
                <span class="fw-bold">${game.name} (${releaseDate || ''})</span><br>
                ${platformIconsHTML}
              </div>
            </div>
          </div>
        </div>
      </a>
      `;
    })
    .join('');

  container.innerHTML = resultsHtml;
}

// Event listener for search button
document.getElementById('submit').addEventListener('click', searchGame);

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
