---
---

'use strict';
const embed_gist = (function() {

    const cache = new Map();
    const range = document.createRange();

    return function(gid, file, lines, eid) {

        const div = document.getElementById(eid);

        const spin = createSpinner();
        div.appendChild(spin);

        const key = `${gid}_${file}`;
        const prom = cache.get(key) || (function() {
            const ret = new Promise(resolve => {
                window[eid] = resolve;
                const scp = document.createElement('script');
                scp.src = `{{ site.data.meta.gist.baseurl }}/${gid}.json?callback=${eid}&file=${file}`;
                div.appendChild(scp);
            });
            cache.set(key, ret);
            return ret;
        }());

        prom.then(obj => {

            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = obj.stylesheet;

            const gist = range.createContextualFragment(obj.div);
            gist.querySelectorAll('.gist-meta, .blob-num').forEach(e => e.remove());
            gist.querySelector('.gist-data').style.borderBottom = 'initial';

            if (lines.length) {
                const code = gist.querySelectorAll('tbody > tr');
                lines.push([code.length]);
                let i = 0;
                for (const [s, e] of lines) {
                    for (; i < s; ++i)
                        code[i].remove();
                    i = e;
                }
            }

            spin.remove();
            div.appendChild(css);
            div.appendChild(gist);
        });
    };
}());
