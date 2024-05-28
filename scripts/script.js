//main container
const container = document.getElementById('results');

// search operation
function searchWord() {
  let search = document.getElementById('search');
  let word = search.value.toLowerCase().trim();
  // console.log('initializing function');
  url = `https://api.rawg.io/api/games/0`;
  // url = '../words.txt';
  document.getElementById('spinner').style.display = 'inline-block';
  fetch(url)
    .then((response) => {
      // console.log('fetching word definitions');
      return response.json();
    })
    .then((data) => {
      const result = data[0];
      // console.log('fetch ready, displaying items');
      document.getElementById('spinner').style.display = 'none';
      displayResults(result);
    })
    .catch((error) => {
      // console.error('Error fetching data', error);
      document.getElementById('spinner').style.display = 'none';
      container.innerHTML = `<div class="alert alert-info alert-dismissible fade show" role="alert">
      <strong>Oops!</strong> No results found for <strong>${word}</strong>.
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
    });
  search.value = '';
}


function displayResults(data) {

  //word
  const title = document.getElementById('title');
  title.innerHTML = `${data.word}`;
}
