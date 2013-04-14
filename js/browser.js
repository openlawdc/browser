d3.json('index.json', function(err, index) {

    // Build initial title listing
    var titles = d3.select('#titles')
        .selectAll('li.title')
        .data(index.titles);

    var li = titles
        .enter()
        .append('li')
        .attr('class', 'title')
        .on('click', clickTitle)
        .append('div')
        .attr('class', 'clearfix');

    li.append('span')
        .attr('class', 'number')
        .text(function(d) { return d[0]; });

    li.append('span')
        .attr('class', 'name')
        .text(function(d) { return d[1]; });

    function clickTitle(d) {
        router.setRoute(d[0]);
    }

    function findTitle(t){
        var t = titles
            .classed('active', function(d) { return d[0] === t; })
            .filter(function(d,i) { return d[0] == t })
        var d = t.data()[0];
        sectionsFor(d);
    }

    function findSection(t,s){
        findTitle(t);
        var sections = d3.select('#sections')
            .selectAll('li.section')
            .classed('active',function(d) { return d[0] === s; })
        var section = sections.filter(function(d,i){ return d[0] === s; })
        doSection(section.data()[0]);
    }

    function doSection(d) {
        d3.select('#section').classed('loading', true);
        d3.json('sections/' + d[0] + '.json', function(err, section) {
            d3.select('#section').classed('loading', false);
            var s = d3.select('#section');

            var content = s.selectAll('div.content')
                .data([section], function(d) { return JSON.stringify(d); });

            content.exit().remove();

            var div = content.enter()
                .append('div')
                .attr('class', 'content');

            div.append('h1')
                .attr('class', 'pad1')
                .text(function(d) {
                    return d.heading.catch_text;
                });

            if (section.text) {
                div.append('div')
                    .attr('class', 'pad1')
                    .selectAll('p')
                    .data(function(d) {
                        return section.text.split(/\n+/);
                    })
                    .enter()
                    .append('p')
                    .html(function(d) {
                        return cited(d);
                    });
            }

            var sections = div.append('div')
                .attr('class', 'pad1')
                .selectAll('section')
                .data(section.sections, function(d) {
                    return d.prefix + d.text;
                });

            var sectionelem = sections.enter()
                .append('section')
                .attr('class', function(d) {
                    var c = '';
                    if (d.prefix.match(/([a-z])/)) c = 'section-1';
                    else if (d.prefix.match(/([0-9])/)) c = 'section-2';
                    else if (d.prefix.match(/([A-Z])/)) c = 'section-3';
                    return c;
                });
            sections.exit().remove();

            var section_p = sectionelem.append('p');

            section_p.append('span')
                .attr('class', 'section-prefix')
                .text(function(d) {
                    return d.prefix;
                });

            section_p.append('span')
                .html(function(d) {
                    return cited(d.text);
                });

            if (section.credits) {
                var credits = div.append('div')
                    .attr('class', 'pad1 limited-text');
                credits.append('h4')
                    .text('Credits');
                credits.append('p')
                    .html(function(d) {
                        return cited(d.credits);
                    });
            }

            if (section.historical) {
                var history = div.append('div')
                    .attr('class', 'pad1 limited-text');
                history.append('h4')
                    .text('Historical');
                history.append('p')
                    .html(function(d) {
                        return cited(d.historical);
                    });
            }
        });
    }

    function doesNotApply(d) {
        return d[1].match(/\[(Repealed|Omitted|Expired)\]/g);
    }

    function cited(text) {
        return Citation.find(text, {
            context: {dc_code: {source: "dc_code"}},
            types: ["dc_code", "law"],
            replace: function(cite) {
                if (cite.type == "dc_code")
                    return "<a href=\"" + urlFor(cite) + "\">" + cite.match + "</a>";
                else if (cite.type == "law")
                    return "<a href=\"" + "http://www.govtrack.us/search?q=" + cite.match.replace(" ","%20") + "\">" + cite.match + "</a>";
            }
        }).text;
    }

    function urlFor(cite) {
        var url = "/current/" + cite.dc_code.title + "-" + cite.dc_code.section;
        if (cite.dc_code.subsections.length > 0)
            url += "#" + cite.dc_code.subsections.join("/");
        return url;
    }

    function sectionsFor(title) {

        var data = index.sections.filter(function(s) {
            return s[0].match(/(\d+)\-/)[1] == title[0];
        });

        doSections(data);
    }

    function doSections(data) {

        function clickSection(d) {
            router.setRoute(1,d[0]);
        }

        // build section list
        var sections = d3.select('#sections')
            .selectAll('li.section')
            .data(data, function(d) {
                return d[0];
            });

        sections.exit().remove();

        var li = sections
            .enter()
            .append('li')
            .attr('class', 'section')
            .classed('repealed', doesNotApply)
            .on('click', clickSection);

        li.append('span')
            .attr('class', 'section-number')
            .text(function(d) { return d[0]; });

        li.append('span')
            .attr('class', 'section-name')
            .text(function(d) { return d[1]; });

        d3.select('.sections-container')
            .property('scrollTop', 0);
    }

    var s = search();
    var combobox = d3.combobox();

    var title_search = d3.select('#search-title').on('keyup', function() {
            if (!this.value) return;
            s.autocomplete(this.value, function(results) {
                combobox.data(results.map(function(r) {
                    return {
                        title: r,
                        value: r
                    };
                }));
            });
        })
        .call(combobox)
        .on('change', function() {
            s.query(this.value, function(d) {
                doSections(d.map(function(o) {
                    return o.title;
                }));
            });
        });

    var routes = {
        '#/:title': findTitle,
        '#/:title/:section': findSection
    }
    router = Router(routes);
    router.init();    
});
