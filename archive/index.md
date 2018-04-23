---
title: Archive
---

{% for page in site.posts %}

{% assign nmonth = page.next.date | date: site.data.time.machine.ym %}
{% assign month = page.date | date: site.data.time.machine.ym %}
{% assign pmonth = page.previous.date | date: site.data.time.machine.ym %}

{% if month != nmonth %}
<section>

    <header class="archive-section-header dim-link">
        <h2>
            <time datetime="{{ month }}">
                {{ page.date | date: site.data.time.human.ym }}
            </time>
        </h2>
    </header>
{% endif %}

    <h3>
        <a href="{{ page.url | relative_url }}">
            {{ page.title | smartify }}
        </a>
    </h3>

{% if month != pmonth %}
</section>
{% endif %}

{% endfor %}
