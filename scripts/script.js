//main container
const container = document.getElementById('results');

// search operation
function searchWord() {
  // console.log('initializing function');
  url = `https://api.rawg.io/api/games/0`;
  // url = '../words.txt';
  fetch(url)
    .then((response) => {
      // console.log('fetching word definitions');
      return response.json();
    })
    .then((data) => {
      const result = data[0];
      displayResults(result);
    })
    .catch((error) => {
      console.error('Error fetching data', error);
    });
}


function displayResults(data) {
console.log(data)
}
