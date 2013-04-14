d3.json('index.json').on('load', function(index) {

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
        updateTitle(d[0]);
    }

    function findTitle(t) {
        var title = titles
            .classed('active', function(d) { return d[0] === t; })
            .filter(function(d,i) { return d[0] == t; });
        if (title.empty()) {
            alert("Title " + t + " does not exist in the current DC code.");
            return;
        }
        var d = title.data()[0];
        updateTitle(d[0]);
        sectionsFor(d);

        d3.select('.titles-container').classed('selected', true);
        d3.select('.sections-container').classed('selected', false);

        //Scroll to the item if we can't already see it
        var top = title.property('offsetTop');
        var tc = d3.select('.titles-container');
        if(top > tc.property('scrollTop') + tc.property('offsetHeight')-35){
            tc.property('scrollTop',top-35);
        }

        d3.select(".content #section").html("");
    }

    function findSection(t, s) {
        updateTitle(s);
        //Only refresh section list if we're changing titles
        var currentTitle = d3.select(".title.active");
        if (currentTitle.empty() || currentTitle.data()[0][0] != t) {
            findTitle(t);
        }

        var sections = d3.select('#sections')
            .selectAll('li.section')
            .classed('active',function(d) { return d[0] === s; });
        var section = sections
            .filter(function(d, i){ return d[0] === s; });

        //Handle what happens if we specify an invalid section.  TODO: Do this better
        if(section.empty()){
            return;
        }

        //Scroll to the right part of the sections list if we can't see it
        var sectionsContainer = d3.select('.sections-container');
        if(section.property('offsetTop') > sectionsContainer.property('scrollTop') + sectionsContainer.property('offsetHeight')){
            sectionsContainer.property('scrollTop',section.property('offsetTop')-35);
        }

        doSection(section.data()[0]);
    }

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
                    .html(function(d) {
                        return cited(d);
                    });
            }

            var sections = div.append('div')
                .attr('class', 'pad2')
                .selectAll('section')
                .data(section.sections, function(d) {
                    return d.prefix + d.text;
                });

            function sectionClass(d) {
                var c = '';
                if (d.prefix.match(/([a-z])/)) c = 'section-1';
                else if (d.prefix.match(/([0-9])/)) c = 'section-2';
                else if (d.prefix.match(/([A-Z])/)) c = 'section-3';
                return c;
            }

            var sectionelem = sections.enter()
                .append('section')
                .attr('class', sectionClass);

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
                    .attr('class', 'pad2 limited-text');
                credits.append('h4')
                    .text('Credits');
                credits.append('p')
                    .html(function(d) {
                        return cited(d.credits);
                    });
            }

            if (section.historical) {
                var history = div.append('div')
                    .attr('class', 'pad2 limited-text');
                history.append('h4')
                    .text('Historical and Statutory');
                history.append('p')
                    .html(function(d) {
                        return cited(d.historical);
                    });
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

    function doesNotApply(d) {
        return d[1].match(/\[(Repealed|Omitted|Expired)\]/g);
    }

    function cited(text) {
        return Citation.find(text, {
            context: {dc_code: {source: "dc_code"}},
            types: ["dc_code", "law", "stat"],
            replace: function(cite) {
                if (cite.type == "dc_code")
                    return "<a href=\"" + urlFor(cite) + "\">" + cite.match + "</a>";
                else if (cite.type == "law")
                    return "<a href=\"" + "http://www.govtrack.us/search?q=" + cite.match.replace(" ","%20") + "\">" + cite.match + "</a>";
                else if (cite.type == "stat")
                    return "<a href=\"" + statUrlFor(cite) + "\">" + cite.match + "</a>";
            }
        }).text;
    }

    function urlFor(cite) {
        var url = "#/" + cite.dc_code.title + "/" + cite.dc_code.title + "-" + cite.dc_code.section;

        // TODO: link to subsections within a section, somehow
        // if (cite.dc_code.subsections.length > 0)
        //     url += "#" + cite.dc_code.subsections.join("/");

        return url;
    }

    function statUrlFor(cite) {
        return "http://api.fdsys.gov/link?collection=statute&volume=" + cite.stat.volume + "&page=" + cite.stat.page;
    }

    function sectionsFor(title) {

        var data = index.sections.filter(function(s) {
            return s[0].match(/(\d+)\-/)[1] == title[0];
        });

        doSections(data);
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

    function doSections(data) {

        function clickSection(d) {
            router.setRoute(1,d[0]);
            updateTitle(d[0]);
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
            .attr('class', 'section clearfix')
            .classed('repealed', doesNotApply)
            .on('click', clickSection);

        li.append('span')
            .attr('class', 'section-number')
            .text(function(d) { return d[0]; });

        li.append('span')
            .attr('class', 'section-name')
            .text(function(d) { return d[1]; });

    }

    function updateTitle(title) {
        if (title)
            d3.select('#code-identifier').text('§ ' + title);
        else d3.select('#code-identifier').text('');
    }

    var s = search();
    var combobox = d3.combobox();

    var title_search = d3.select('#search-title').on('keyup', function() {
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
        })
        .call(combobox)
        .on('change', function() {
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
                doSections(d.map(function(o) {
                    return o.title;
                }));
            });
        });

    var routes = {
        '#/:title': findTitle,
        '#/:title/:section': findSection
    };
    router = Router(routes);
    router.init();
}).get();
