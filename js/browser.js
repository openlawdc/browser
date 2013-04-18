// pure helpers
function getter(y) { return function(x) { return x[y]; }; }

var browser = {};

browser.titles = function(selection) {
    var titles = selection
        .selectAll('li.title')
        .data(function(d) { return d; }),
        li = titles.enter().append('li')
            .attr('class', 'title'),
        a = li.append('a')
            .attr('href', function(d) { return '#/' + d[0]; })
            .attr('class', 'clearfix');
    a.append('span').attr('class', 'number').text(getter(0));
    a.append('span').attr('class', 'name').text(getter(1));
};

browser.sections = function(selection) {
    var sections = selection.selectAll('li.section')
        .data(function(d) { return d; }, function(d) { return d[0]; });

    sections.exit().remove();

    var a = sections
        .enter().append('li')
        .attr('class', 'section clearfix')
        .classed('repealed', doesNotApply)
        .append('a')
        .attr('href', function(d) {
            return '#' + d[0].split('-')[0] + '/' + d[0];
        });

    a.append('span').attr('class', 'section-number').text(getter(0));
    a.append('span').attr('class', 'section-name').text(getter(1));

    function doesNotApply(d) {
        return d[1].match(/\[(Repealed|Omitted|Expired)\]/g);
    }
};

d3.json('index.json').on('load', function(index) {

    // Build initial title listing
    var titles = d3.select('#titles')
        .datum(index.titles)
        .call(browser.titles);

    function findTitle(t) {
        var title = titles
            .classed('active', function(d) { return d[0] === t; })
            .filter(function(d, i) { return d[0] == t; });

        // updateTitle(d[0]);
        sectionsFor(t);

        d3.select('.titles-container').classed('selected', true);
        d3.select('.sections-container').classed('selected', false);

        // var top = title.property('offsetTop'),
        //     tc = d3.select('.titles-container');
        // if (top > tc.property('scrollTop') + tc.property('offsetHeight') - 35) {
        //     tc.property('scrollTop', top - 35);
        // }
        // d3.select('.content #section').html('');
    }

    function findSection(t, s) {
        updateTitle(s);
        // Only refresh section list if we're changing titles
        var currentTitle = d3.select(".title.active");
        if (currentTitle.empty() || currentTitle.data()[0][0] != t) {
            findTitle(t);
        }

        var sections = d3.select('#sections')
            .selectAll('li.section')
            .classed('active',function(d) { return d[0] === s; });
        var section = sections
            .filter(function(d, i){ return d[0] === s; });

        // Handle what happens if we specify an invalid section.  TODO: Do this better
        if (section.empty()) return;

        // Scroll to the right part of the sections list if we can't see it
        var sectionsContainer = d3.select('.sections-container');
        if (section.property('offsetTop') > sectionsContainer.property('scrollTop') +
            sectionsContainer.property('offsetHeight')) {
            sectionsContainer.property('scrollTop',section.property('offsetTop')-35);
        }

        doSection(section.data()[0]);
    }

    // Show an actual section text - header, historical notes, and so on.
    function doSection(d) {
        d3.select('#section').classed('loading', true);
        d3.json('sections/' + d[0] + '.json').on('load', function(section) {
            d3.select('#section').classed('loading', false);
            var s = d3.select('#section');

            d3.select('.sections-container').classed('selected', true);

            var content = s.selectAll('div.content')
                .data([section], function(d) { return JSON.stringify(d); });

            content.exit().remove();

            var div = content.enter()
                .append('div')
                .attr('class', 'content')
                .property('scrollTop',0);

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
                    .enter()
                    .append('p')
                    .html(cited);
            }

            var sections = div.append('div')
                .attr('class', 'pad2')
                .selectAll('section')
                .data(section.sections, function(d) {
                    return d.prefix + d.text;
                });

            var sectionelem = sections.enter()
                .append('section')
                .attr('class', sectionClass);

            sections.exit().remove();

            var section_p = sectionelem.append('p');

            section_p.append('span')
                .attr('class', 'section-prefix')
                .text(getter('prefix'));

            section_p.append('span')
                .html(function(d) {
                    return cited(d.text);
                });

            if (section.credits) {
                var credits = div.append('div')
                    .attr('class', 'pad2 limited-text')
                    .data(function(d) { return d.credits; });
                credits.append('h4')
                    .text('Credits');
                credits.append('p')
                    .html(cited);
            }

            if (section.historical) {
                var history = div.append('div')
                    .attr('class', 'pad2 limited-text')
                    .data(function(d) { return d.historical; });
                history.append('h4')
                    .text('Historical and Statutory');
                history.append('p')
                    .html(cited);
            }

            var downloads = div.append('p').attr('class', 'pad1');

            downloads.append('span').text('download: ');

            downloads.append('a')
                .text(function(d) {
                    return d.heading.identifier + '.json';
                })
                .attr('href', function(d) {
                    return 'sections/' + d.heading.identifier + '.json';
                });

        }).get();
    }


    function sectionClass(d) {
        var c = '';
        if (d.prefix.match(/([a-z])/)) c = 'section-1';
        else if (d.prefix.match(/([0-9])/)) c = 'section-2';
        else if (d.prefix.match(/([A-Z])/)) c = 'section-3';
        return c;
    }

    function sectionsFor(title) {
        d3.select('#sections').datum(index.sections.filter(function(s) {
            return s[0].match(/(\d+)\-/)[1] == title[0];
        })).call(browser.sections);
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

    var s = search(),
        combobox = d3.combobox();

    var title_search = d3.select('#search-title')
        .on('keyup', keyup)
        .call(combobox)
        .on('change', change);

    function keyup() {
        if (!this.value) return;
        if (this.value.match(/^(\d)\-/)) {
            return combobox.data(searchSection(this.value));
        }
        s.autocomplete(this.value, function(results) {
            combobox.data(results.map(function(r) {
                return {
                    title: r,
                    value: r
                };
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

    var routes = {
        '#/:title': findTitle,
        '#/:title/:section': findSection
    };

    router = Router(routes);
    router.init();

    d3.select(document)
        .call(d3.keybinding('arrows')
            .on('←', keyMove(-1))
            .on('→', keyMove(1)));

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
