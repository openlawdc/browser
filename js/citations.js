function cited(text) {

    // is this a current DC Code cite (something we should cross-link),
    // or is it to a prior version of the DC Code?
    function currentCodeCite(cite) {
        var index = cite.excerpt.search(/ior\s+codifications\s+1981\s+Ed\.?\,?/i);
        return !(index > 0 && index < 40);
    }

    function codeUrlFor(cite) {
        return '#/' + cite.dc_code.title + '/' + cite.dc_code.title +
            '-' + cite.dc_code.section;
    }

    function lawUrlFor(cite) {
        return 'http://www.govtrack.us/search?q=' + cite.match.replace(' ', '%20');
    }

    function statUrlFor(cite) {
        return 'http://api.fdsys.gov/link?collection=statute&volume=' + cite.stat.volume + '&page=' + cite.stat.page;
    }

    // just link to that year's copy on the DC Register website
    function dcrUrlFor(cite) {
        var year = parseInt(cite.dc_register.volume, 10) + 1953;
        return 'http://www.dcregs.dc.gov/Gateway/IssueList.aspx?IssueYear=' + year;
    }

    return Citation.find(text, {
        context: {
            dc_code: {
                source: 'dc_code'
            }
        },
        excerpt: 40,
        types: ['dc_code', 'dc_register', 'law', 'stat'],
        replace: function(cite) {
            if (cite.type == 'dc_code') {
                if (currentCodeCite(cite))
                    return "<a href=\"" + codeUrlFor(cite) + "\">" + cite.match + "</a>";
                else
                    return cite.match;
            }
            else if (cite.type == 'law')
                return "<a href=\"" + lawUrlFor(cite) + "\">" + cite.match + "</a>";
            else if (cite.type == 'dc_register') {
                if (parseInt(cite.dc_register.volume, 10) >= 57)
                    return "<a href=\"" + dcrUrlFor(cite) + "\">" + cite.match + "</a>";
                else
                    return cite.match;
            } else if (cite.type == 'stat') {
                if (parseInt(cite.stat.volume, 10) >= 65)
                    return "<a href=\"" + statUrlFor(cite) + "\">" + cite.match + "</a>";
                else
                    return cite.match;
            }
        }
    }).text;
}
