// console.log('Dictionary Loaded');

// define.addEventListener('click', () => {
//     console.log('clicked define');
//     populate();
// })

// function populate() {
//     let results = objOne['results'];
//     let html = '';
//     results.forEach(element => {
//         html += `<li class="list-group-item">  ${element.definition} </li>`;
//     });
//     let def = document.getElementById('def');
//     def.innerHTML = html;
// }

// let define = document.getElementById('define');


//main container
const container = document.getElementById('results');

// search operation
function searchWord() {
  let search = document.getElementById('search');
  let word = search.value.toLowerCase().trim();
  // console.log('initializing function');
  url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
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

// function displayResults(data) {
//   const container = document.getElementById('results');
//   container.innerHTML = ''; // Clear previous results

//   // Create elements to display word data
//   const wordElement = document.createElement('h2');
//   wordElement.textContent = data.word;
//   container.appendChild(wordElement);

//   //phonetics
//   const phoneticsList = document.createElement('ul');
//   data.phonetics.forEach((phonetics) => {
//     const listItem = document.createElement('li');
//     listItem.textContent = `Phonetic: ${phonetics.text}`;
//     listItem.innerHTML = `Phonetic: <a href="${phonetics.audio}" target="_blank">${phonetics.text} (listen)</a>`;
//     phoneticsList.appendChild(listItem);
//   });
//   container.appendChild(phoneticsList);

//   //meanings
//   data.meanings.forEach((meaning) => {
//     const meaningElement = document.createElement('div');
//     meaningElement.innerHTML = `<h3>${meaning.partOfSpeech}</h3>`;

//     meaning.definitions.forEach((definition) => {
//       const definitionElement = document.createElement('p');
//       definitionElement.innerHTML = `<strong>Definition:</strong> ${definition.definition}<br><strong>Example:</strong> ${definition.example}`;
//       meaningElement.appendChild(definitionElement);
//     });
//     container.appendChild(meaningElement);
//   });

//   //wiki url
//   const sourceUrls = document.createElement('h2');
//   sourceUrls.textContent = data.sourceUrls;
//   container.appendChild(sourceUrls);
// }

function displayResults(data) {

  //word
  const title = document.getElementById('title');
  title.innerHTML = `${data.word}`;

  //phonetics
  const phonetic = document.getElementById('phonetics');
  phonetic.innerHTML = ''; // Clear previous phonetics
  // let phonetics = data.phonetics;
  data.phonetics.forEach((phonetics) => {
    phonetic.innerHTML += `[
    <a href="${phonetics.audio}" target="_blank" class="text-decoration-none">
    ${phonetics.text}</a> ]`;
  });

  //definitions
  const definitionContainer = document.getElementById('definitionContainer');
  definitionContainer.innerHTML = '';
  definitionContainer.innerHTML += `<hr>`;
  data.meanings.forEach((meanings) => {
    definitionContainer.innerHTML += `<h4 class="fw-semibold">${meanings.partOfSpeech}</h4>`;

    meanings.definitions.forEach((definition) => {
      definitionContainer.innerHTML += `
        <div style="line-height: -2>
        <p class="fw-bolder">${definition.definition}
        <p class="fst-italic">${definition.example}</p></p>
        </div>
        `;
    });
  });

  //wiki url
  const sources = document.getElementById('links');
  sources.innerHTML = '';
  sources.innerHTML += `
  <hr>
  <a href="${data.sourceUrls}" target="_blank" class="text-decoration-none">
  ${data.sourceUrls}</a>
  `;

  //license
  const licenseContainer = document.getElementById('licenseContainer');
  licenseContainer.innerHTML = '';
  licenseContainer.innerHTML += `
    <span>License: </span>
    <a href="${data.license.url}" target="_blank" class="text-decoration-none">
  <span class="badge text-bg-info">${data.license.name}</span></a>
  `;
}
