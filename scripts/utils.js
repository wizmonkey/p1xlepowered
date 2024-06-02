//authentication animation
document.getElementById('loginBtn').addEventListener('click', () => {
    const registerPane = document.getElementById('registerPane');
    const loginPane = document.getElementById('loginPane');
    registerPane.classList.remove('show');
    registerPane.classList.add('slide-right');
    setTimeout(() => {
        registerPane.classList.add('hidden');
        loginPane.classList.remove('hidden');
        loginPane.classList.remove('slide-left');
        loginPane.classList.add('show');
    }, 500);
});

document.getElementById('registerBtn').addEventListener('click', () => {
    const registerPane = document.getElementById('registerPane');
    const loginPane = document.getElementById('loginPane');
    loginPane.classList.remove('show');
    loginPane.classList.add('slide-left');
    setTimeout(() => {
        loginPane.classList.add('hidden');
        registerPane.classList.remove('hidden');
        registerPane.classList.remove('slide-right');
        registerPane.classList.add('show');
    }, 500);
});

