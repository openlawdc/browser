function cited(text) {
    return Citation.find(text, {
        context: {
            dc_code: {
                source: 'dc_code'
            }
        },
        excerpt: 40,
        types: ['dc_code', 'dc_register', 'dc_law', 'law', 'stat'],
        replace: {
            dc_code: codeCited,
            law: lawCited,
            dc_register: dcrCited,
            stat: statCited,
            dc_law: dcLawCited
        }
    }).text;

    function linked(url, text) {
        return "<a href='" + url + "'>" + text + "</a>";
    }

    // The detected citation is a DC "Law" - a slip law number, assigned
    // to an act after it becomes law.
    //
    // However, DC's legislative portal, LIMS, does not know law numbers,
    // only act numbers. @vdavez and @adamturoff created a crosswalk between
    // the two.
    //
    // The crosswalk is a JSON object, loaded into the global namespace as "dc_laws".
    // At cite time, this function does a quick lookup in that crosswalk and links
    // the user to the act which became the cited law.
    function dcLawCited(cite) {
        var lawNumber = cite.dc_law.period + "-" + cite.dc_law.number;
        var prefixedLawNumber = cite.dc_law.period + "-" + zeroPrefix(cite.dc_law.number, 3);
        console.log("lawNumber: " + lawNumber);
        console.log("prefixedLawNumber: " + prefixedLawNumber);

        var billNumber = dc_laws[prefixedLawNumber];
        if (!billNumber) // leave unlinked
            return cite.match;

        var pieces = billNumber.split("-");
        billNumber = pieces[0] + "-" + zeroPrefix(pieces[1], 4);

        var text = "D.C. Law " + lawNumber;
        var url = "http://dcclims1.dccouncil.us/lims/legislation.aspx?LegNo=B" + billNumber;
        return linked(url, text);
    }

    // what in Ruby would be:
    // "0" * 5 => "00000"
    function repeated(num, string) {
        return new Array(num + 1).join(string);
    }

    // handles a max of 4
    function zeroPrefix(number, zeroes) {
        var toAdd;
        if (number < 10)
            toAdd = zeroes - 1;
        else if (number < 100)
            toAdd = zeroes - 2;
        else if (number < 1000)
            toAdd = zeroes - 3;
        else
            toAdd = zeroes - 4;

        if (toAdd < 0) toAdd = 0;

        return repeated(toAdd, "0") + number;
    }

    function statCited(cite) {
        if (parseInt(cite.stat.volume, 10) < 65)
            return;

        return linked('http://api.fdsys.gov/link?collection=statute&volume=' + cite.stat.volume + '&page=' + cite.stat.page,
            cite.match);
    }

    // is this a current DC Code cite (something we should cross-link),
    // or is it to a prior version of the DC Code?
    function codeCited(cite) {
        var index = cite.excerpt.search(/ior\s+codifications\s+1981\s+Ed\.?\,?/i);
        if (index > 0 && index < 40) // found, and to the left of the cite
            return;

        return linked("#/" + cite.dc_code.title + "/" + cite.dc_code.title + "-" + cite.dc_code.section,
            cite.match);
    }

    function lawCited(cite) {
        var lawName = cite.law.type + " law " + cite.law.congress + "-" + cite.law.number;
        var url = 'http://www.govtrack.us/search?q=' + encodeURIComponent(lawName);
        return linked(url, cite.match);
    }

    // just link to that year's copy on the DC Register website
    function dcrCited(cite) {
        if (parseInt(cite.dc_register.volume, 10) < 57)
            return;

        var year = parseInt(cite.dc_register.volume, 10) + 1953;
        return linked('http://www.dcregs.dc.gov/Gateway/IssueList.aspx?IssueYear=' + year,
            cite.match);
    }
}
