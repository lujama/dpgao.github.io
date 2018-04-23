'use strict';
function createSpinner() {
    const spin = document.createElement('img');
    spin.src = 'https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif';
    spin.style.display = 'block';
    spin.style.margin = 'auto';
    return spin;
}
