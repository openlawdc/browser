// pure helpers
function getter(y) { return function(x) { return x[y]; }; }

function doesNotApply(d) {
    return d[1].match(/\[(Repealed|Omitted|Expired)\]/g);
}

function sectionClass(d) {
    var c = '';
    if (d.prefix.match(/([a-z])/)) c = 'section-1';
    else if (d.prefix.match(/([0-9])/)) c = 'section-2';
    else if (d.prefix.match(/([A-Z])/)) c = 'section-3';
    return c;
}

var browser = {};

browser.list = function(selection, linkify) {
    var titles = selection
        .selectAll('li.title')
        .data(function(d) { return d; }, function(d) { return d[0]; }),
        li = titles.enter().append('li').attr('class', 'title'),
        a = li.append('a').attr('href', linkify);
    titles.exit().remove();
    a.append('span').attr('class', 'number').text(getter(0));
    a.append('span').attr('class', 'name').text(getter(1));
};

d3.json('index.json').on('load', function(index) {

    d3.select(document)
        .call(d3.keybinding('arrows')
            .on('←', keyMove(-1))
            .on('→', keyMove(1)));

    d3.select('#titles').datum(index.titles)
        .call(browser.list, function(d) { return '#/' + d[0]; });

    var s = search(),
        combobox = d3.combobox();

    var title_search = d3.select('#search-title')
        .on('keyup', keyup)
        .call(combobox)
        .on('change', change);

    var router = Router({
        '#/:title': titles,
        '#/:title/:section': section
    });

    router.init();

    function titles(t) {
        var selected_title = d3.select('#titles').selectAll('li.title')
            .classed('active', function(d) { return d[0] === t; })
            .filter(function(d, i) { return d[0] == t; })
            .node().scrollIntoView();
        listSections(t, index.sections.filter(function(s) {
            return s[0].match(/(\d+)\-/)[1] == t[0];
        }));
        d3.select('.titles-container').classed('selected', true);
        d3.select('.sections-container').classed('selected', false);
        updateTitle(t);
    }

    function sections(t, s) {
        titles(t);
        var sections = d3.select('#sections').selectAll('li.title')
            .classed('active', function(d) { return d[0] === s; });
        sections.filter(function(d, i) { return d[0] === s; })
            .node().scrollIntoView();
        updateTitle(s);
    }

    function section(t, s) {
        sections(t, s);
        d3.select('#section').classed('loading', true);
        d3.json('sections/' + s + '.json').on('load', function(section) {
            d3.select('#section').classed('loading', false);
            var s = d3.select('#section');

            d3.select('.sections-container').classed('selected', true);

            var content = s.selectAll('div.content')
                .data([section], function(d) { return JSON.stringify(d); });

            content.exit().remove();

            var div = content.enter()
                .append('div')
                .attr('class', 'content')
                .property('scrollTop', 0);

            div.append('h1')
                .attr('class', 'pad2')
                .attr('id', 'article-title')
                .text(function(d) {
                    return d.heading.catch_text;
                });

            if (section.text) {
                div.append('div')
                    .attr('class', 'section-text pad2')
                    .selectAll('p')
                    .data(function(d) {
                        return section.text.split(/\n+/);
                    })
                    .enter().append('p').html(cited);
            }

            var sections = div.append('div')
                .attr('class', 'pad2')
                .selectAll('section')
                .data(section.sections, function(d) { return d.prefix + d.text; });

            sections.exit().remove();

            var sectionelem = sections.enter()
                .append('section')
                .attr('class', sectionClass);

            var section_p = sectionelem.append('p');

            section_p.append('span')
                .attr('class', 'section-prefix')
                .text(getter('prefix'));

            section_p.append('span')
                .html(function(d) { return cited(d.text); });

            var extras = [];
            if (section.credits) extras.push({ text: section.credits, title: 'Credits' });
            if (section.historical) extras.push({ text: section.credits, title: 'Historical and Statutory' });
            var extra_sections = div.selectAll('div.limited-text')
                .data(extras)
                .enter().append('div').attr('class', 'pad2 limited-text');
            extra_sections.append('h4').text(function(d) { return d.title; });
            extra_sections.append('p').html(function(d) { return cited(d.text); });

            var downloads = div.append('p').attr('class', 'pad1');
            downloads.append('span').text('download: ');
            downloads.append('a')
                .text(function(d) { return d.heading.identifier + '.json'; })
                .attr('href', function(d) {
                    return 'sections/' + d.heading.identifier + '.json';
                });
        }).get();
    }

    function listSections(t, d) {
        d3.select('#sections').datum(d)
            .call(browser.list, function(d) {
                return '#/' + t + '/' + d[0];
            });
    }

    function searchSection(s) {
        return index.sections.map(function(s) {
            return {
                title: s[0] + ' ' + s[1],
                value: s[0] + ' ' + s[1],
                type: 'section'
            };
        });
    }

    function updateTitle(title) {
        d3.select('#code-identifier').text(title ? ('§ ' + title) : '');
    }

    function keyup() {
        if (!this.value) return;
        if (this.value.match(/^(\d)\-/)) {
            return combobox.data(searchSection(this.value));
        }
        s.autocomplete(this.value, function(results) {
            combobox.data(results.map(function(r) {
                return { title: r, value: r };
            }));
        });
    }

    function change() {
        var data = combobox.data();
        if (!data.length) return;
        if (data[0].type === 'section') {
            var path = this.value.split(' ')[0];
            var title = path.match(/^([\d]+)/)[0];
            router.setRoute(title + '/' + path);
            this.value = '';
            return;
        }
        s.query(this.value, function(d) {
            d3.select('#sections')
                .datum(d.map(function(o) {
                return o.title;
            })).call(browser.sections);
        });
    }

    function keyMove(dir) {
        return function() {
            var sections = d3.select('#sections')
                .selectAll('li.section'), i = null;
            sections.each(function(_, ix) {
                if (d3.select(this).classed('active')) i = ix;
            });
            if (!(i === null || (dir === -1 && i === 0) ||
                (dir === 1 && i === sections[0].length - 1))) {
                d3.select(sections[0][i + dir]).trigger('click');
            }
        };
    }
}).get();
