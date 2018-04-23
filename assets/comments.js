---
---

'use strict';
function embed_comments(id) {

    const elem = document.getElementById('comment-section');

    const spin = createSpinner();
    elem.appendChild(spin);

    fetch(`{{ site.github.api_url }}/repos/{{ site.github.repository_nwo }}/issues/${id}/comments`, {
        headers: {
            'Accept': 'application/vnd.github.html+json'
        }
    }).then(data => {
        spin.remove();
        if (data.ok)
            return data.json();
        else
            throw data;
    }).then(json => {
        return json.reduce((acc, obj) => acc + `<article><header class="comment-header dim-link">{% avatar ${obj.user.login} %}<div class="comment-header-text"><div><a href="${obj.user.html_url}">${obj.user.login}</a></div><div><time datetime="${obj.created_at}">${new Date(obj.created_at).toLocaleString()}</time></div></div></header>${obj.body_html}</article>`, '');
    }, error => {
        return `<p>${error.status} ${error.statusText}</p>`;
    }).then(html =>
        elem.insertAdjacentHTML('beforeend', html)
    );
}
