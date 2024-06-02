import {
  auth,
  db,
  setDoc,
  doc,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from './fireAuth.js';

const userName = document.getElementById('username');
const userEmail = document.getElementById('email');
const userEmailAuth = document.getElementById('emailAuth');
const userPassword = document.getElementById('password');
const userPasswordAuth = document.getElementById('passwordAuth');

const dispName = document.getElementById('dispName');
const dispEmail = document.getElementById('dispEmail');

const signUpButton = document.getElementById('signUpButton');
const LogInButton = document.getElementById('LogInButton');
const signOutButton = document.getElementById('signOutButton');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const secret = document.getElementById('secret');
const alertContainer = document.getElementById('alertContainer');

const showAlert = (message, type) => {
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

const userSignUp = async () => {
  const signUpName = userName.value;
  const signUpEmail = userEmail.value;
  const signUpPassword = userPassword.value;

  if (!signUpName || !signUpEmail || !signUpPassword) {
    showAlert('Please fill in all the fields.', 'warning');
    return;
  }

  createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword)
    .then(async (userCredential) => {
      const user = userCredential.user;
      console.log(user);
      showAlert('Account Created', 'success');

      // Save the user data
      await setDoc(doc(db, 'users', user.uid), {
        username: signUpName,
        email: signUpEmail,
      });

      // Automatically log in the user and redirect to home page
      window.location.href = 'index.html';
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);

      switch (errorCode) {
        case 'auth/email-already-in-use':
          showAlert('This email is already in use.', 'danger');
          break;
        case 'auth/invalid-email':
          showAlert('Invalid email address.', 'danger');
          break;
        case 'auth/operation-not-allowed':
          showAlert('Operation not allowed.', 'danger');
          break;
        case 'auth/weak-password':
          showAlert('Weak password. Please use a stronger password.', 'danger');
          break;
        default:
          showAlert('Error: ' + errorMessage, 'danger');
      }
    });
};

const userSignIn = async () => {
  const signInEmail = userEmailAuth.value;
  const signInPassword = userPasswordAuth.value;

  if (!signInEmail || !signInPassword) {
    showAlert('Please fill in both the email and password fields.', 'warning');
    return;
  }

  signInWithEmailAndPassword(auth, signInEmail, signInPassword)
    .then((userCredential) => {
      const user = userCredential.user;
      showAlert('Signed In', 'success');
      // Redirect to homepage
      window.location.href = 'index.html';
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);

      switch (errorCode) {
        case 'auth/invalid-credential':
          showAlert('Oops! Incorrect Email or Password.', 'danger');
          break;
        case 'auth/wrong-password':
          showAlert('Incorrect password. Please try again.', 'danger');
          break;
        case 'auth/invalid-email':
          showAlert('Invalid email address.', 'danger');
          break;
        case 'auth/user-disabled':
          showAlert('User account is disabled.', 'danger');
          break;
        default:
          showAlert('Error: ' + errorMessage, 'danger');
      }
    });
};

const checkAuthState = async () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User is signed in:', user);
    } else {
      console.log('No user is signed in.');
    }
  });
};
checkAuthState();

signUpButton.addEventListener('click', userSignUp);
LogInButton.addEventListener('click', userSignIn);
