d3.json('index.json', function(err, index) {

    var titles = d3.select('#titles')
        .selectAll('li.title')
        .data(index.titles)
        .enter()
        .append('li')
        .attr('class', 'title')
        .text(function(d) {
            return d[0] + ': ' + d[1];
        })
        .on('click', clickTitle);

    function clickTitle(d) {
        var t = this;
        titles
            .classed('active', function(d) {
                return this == t;
            });

        sectionsFor(d);
    }

    var s = d3.select('#section');
    var subsections = d3.select('.sections');

    function doSection(d) {
        d3.json('sections/' + d[0].replace('§ ', '').trim() + '.json', function(err, section) {
            var s = d3.select('#section');
            s.select('h1').text(section.heading.catch_text);
            s.select('.text').text(section.text);

            var sections = subsections.selectAll('section')
                .data(section.sections, function(d) {
                    return d.prefix + d.text;
                });

            sections.enter().append('section');

            sections.exit().remove();

            sections.html(function(d) {
                return '<strong>' + d.prefix + '</strong> ' + d.text;
            });
        });
    }

    function sectionsFor(title) {

        function clickSection(d) {
            var t = this;
            sections
                .classed('active', function(d) {
                    return this == t;
                });

            doSection(d);
        }

        var sections = d3.select('#sections')
            .selectAll('li.section')
            .data(index.sections.filter(function(s) {
                return s[0].match(/§ (\d+)\-/)[1] == title[0];
            }), function(d) {
                return d[0];
            });

        sections
            .exit()
            .remove();

        sections
            .enter()
            .append('li')
            .attr('class', 'section')
            .text(function(d) {
                return d[0] + ' ' + d[1];
            })
            .on('click', clickSection);
    }
});
