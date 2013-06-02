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

var titles_div = d3.select('#titles'),
    sections_div = d3.select('#sections'),
    identifier_div = d3.select('#code-identifier'),
    search_box = d3.select('#search-title'),
    s = search(),
    combobox = d3.combobox();

d3.select(document)
    .call(d3.keybinding('browser')
        .on('←', keyMove(-1))
        .on('→', keyMove(1))
        .on('/', focusSearch));

// pure helpers
function getter(y) { return function(x) { return x[y]; }; }

function doesNotApply(d) {
    return d[1].match(/\[(Repealed|Omitted|Expired)\]/g);
}

function sectionClass(d) {
    var c = '',
        prevPrefix = this.previousSibling ?
            d3.select(this.previousSibling).datum().prefix : null;
    // Look at previous prefix to know whether i is a lowercase letter or
    // a lowercase roman numeral.
    if (d.prefix.match(/^[ivx]+$/) && (d.prefix != 'i' || prevPrefix != 'h')) {
        c = 'section-4';
    }
    else if (d.prefix.match(/^[IVX]+$/) && (d.prefix != 'I' || prevPrefix != 'H')) {
        c = 'section-5';
    }
    else if (d.prefix.match(/([a-z])/)) c = 'section-1';
    else if (d.prefix.match(/([0-9])/)) c = 'section-2';
    else if (d.prefix.match(/([A-Z])/)) c = 'section-3';
    return c;
}

function sectionUrl(t) {
    return function(d) { return '#/' + t + '/' + d[0]; };
}

function sectionUrlPure(d) {
    return '#/' + d[0].match(/^(\d+)/)[1] + '/' + d[0];
}

function sectionAsComplete(s) {
    var val = s[0] + ' ' + s[1];
    return { title: val, value: val, type: 'section' };
}

function updateTitle(title) {
    identifier_div.text(title ? ('§ ' + title) : '');
}

function focusSearch() {
    d3.event.preventDefault();
    search_box.node().focus();
}

function keyMove(dir) {
    return function() {
        var sections = sections_div
            .selectAll('li.title'), i = null;
        sections.each(function(_, ix) {
            if (d3.select(this).classed('active')) i = ix;
        });
        if (!(i === null || (dir === -1 && i === 0) ||
            (dir === 1 && i === sections[0].length - 1))) {
            d3.select(sections[0][i + dir]).select('a')
                .trigger('click');
        }
    };
}

d3.json('index.json').on('load', function(index) {
    titles_div.datum(index.titles)
        .call(browser.list, function(d) { return '#/' + d[0]; });

    var title_search = search_box
        .on('keyup', keyup)
        .call(combobox)
        .on('change', change);

    var router = Router({
        '#/:title': titles,
        '#/:title/:section': section
    });

    var byTitle = d3.nest().key(function getSectionNumber(d) {
        return d[0].split('-')[0];
    }).map(index.sections);

    router.init();

    function titles(t) {
        var selected_title = titles_div.selectAll('li.title')
            .classed('active', false)
            .filter(function(d, i) { return d[0] == t; })
            .classed('active', true)
            .node().scrollIntoView();
        listSections(t, byTitle[t]);
        d3.select('.titles-container').classed('selected', true);
        d3.select('.sections-container').classed('selected', false);
        updateTitle(t);
    }

    function sections(t, s) {
        titles(t);
        var li = sections_div.selectAll('li.title')
            .classed('active', false)
            .filter(function(d, i) { return d[0] === s; })
            .classed('active', true)
            .node().scrollIntoView();
        updateTitle(s);
    }

    function section(t, s) {
        sections(t, s);

        var section_div = d3.select('#section');
        section_div.classed('loading', true);

        d3.json('sections/' + s + '.json').on('load', function(section) {

            section_div.classed('loading', false);
            d3.select('.sections-container').classed('selected', true);

            var content = section_div.selectAll('div.content')
                .data([section], function(d) { return d.heading.identifier; });

            content.exit().remove();

            var div = content.enter()
                .append('div')
                .attr('class', 'content')
                .property('scrollTop', 0);

            div.append('h1')
                .attr('class', 'pad2')
                .text(function(d) { return d.heading.catch_text; });

            if (section.text) {
                div.append('div')
                    .attr('class', 'section-text pad2')
                    .selectAll('p')
                    .data(function(d) { return section.text.split(/\n+/); })
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

            var extras = [
                { text: section.credits, title: 'Credits' },
                { text: section.historical, title: 'Historical and Statutory' }];
            var extra_sections = div.selectAll('div.limited-text')
                .data(extras.filter(function(e) { return e.text; }))
                .enter().append('div').attr('class', 'pad2 limited-text');
            extra_sections.append('h4').text(function(d) { return d.title; });
            extra_sections.append('p').html(function(d) { return cited(d.text); });

            var downloads = div.append('div').attr('class', 'pad21h download no-print');
            downloads.append('span').text('download: ');
            downloads.append('a')
                .text(function(d) { return d.heading.identifier + '.json'; })
                .attr('href', function(d) {
                    return 'sections/' + d.heading.identifier + '.json';
                });
        }).get();
    }

    function listSections(t, d) {
        sections_div.datum(d).call(browser.list, sectionUrl(t));
    }

    function searchSection(s) {
        return (byTitle[s] || []).map(sectionAsComplete);
    }

    function keyup() {
        if (!this.value) return;
        if (this.value.match(/^(\d+)\-/)) {
            return combobox.data(searchSection(this.value.match(/^(\d+)\-/)[1]));
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
            sections_div
                .datum(d.map(function(o) {
                    return o.title;
                })).call(browser.list, sectionUrlPure);
        });
    }
}).get();
