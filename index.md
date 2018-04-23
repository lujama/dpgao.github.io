---
---

{% for page in site.posts %}
<article>

    {% include heading.html %}

    {{ page.excerpt }}

    <p>
        <a href="{{ page.url | relative_url }}">
            Read more…
        </a>
    </p>

</article>
{% endfor %}
