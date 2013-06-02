/* Citation.js - a legal citation extractor.
 *
 * Open source, public domain license: https://github.com/unitedstates/citation
 *
 * Originally authored by Eric Mill, at the Sunlight Foundation
 */

if (typeof(_) === "undefined" && typeof(require) !== "undefined") {
  _ = require("underscore");
  XRegExp = require('xregexp').XRegExp;
}

(function() {
  Citation = {

    // will be filled in by individual citation types
    types: {},

    // check a block of text for citations of a given type -
    // return an array of matches, with citation broken out into fields
    find: function(text, options) {
      if (!options) options = {};

      // default: no excerpt
      var excerpt = options.excerpt ? parseInt(options.excerpt, 10) : 0;

      // whether to return parent citations
      // default: false
      var parents = options.parents || false;

      // default: all types, can be filtered to one, or an array of them
      var types;
      if (options.types) {
        if (_.isArray(options.types)) {
          if (options.types.length > 0)
            types = options.types;
        } else
          types = [options.types];
      }

      // only allow valid types
      if (types)
        types = _.intersection(types, _.keys(Citation.types));
      else
        types = _.keys(Citation.types);

      // if no matches, abort
      if (types.length === 0) return null;


      // caller can provide optional context that can change what patterns individual citators apply
      var context = options.context || {};


      // caller can provide a replace callback to alter every found citation.
      // this function will be called with each (found and processed) cite object,
      // and should return a string to be put in the cite's place.
      //
      // the resulting transformed string will be in the returned object as a 'text' field.
      // this field will only be present if a replace callback was provided.
      //
      // providing this callback will also cause matched cites not to return the 'index' field,
      // as the replace process will completely screw them up. only use the 'index' field if you
      // plan on doing your own replacing.

      var replace = options.replace;


      // figure out which patterns we're going apply, assign each an identifier
      var citators = {};

      _.each(types, function(type) {
        var patterns = Citation.types[type].patterns;

        // individual parsers can opt to make their parsing context-specific
        if (typeof(patterns) == "function")
          patterns = patterns(context[type] || {});

        _.each(patterns, function(pattern, i) {
          var name = type + "_" + i; // just needs to be unique

          // small pre-process on each regex - prefix named captures to ensure uniqueness.
          // will be un-prefixed before passing to processor.
          var uniquified = pattern.regex
            .replace(new RegExp("\\(\\?<([a-z0-9]+)>", "ig"), "(?<" + name + "_" + "$1>");

          citators[name] = {
            regex: uniquified,
            processor: pattern.processor,  // original processor method per-cite, expects named captures
            type: type // store so we can figure out per-cite what we're talking about
          };
        });
      });

      var names = _.keys(citators);

      // now let's merge each pattern's regex into a single regex, using named capture groups
      var regex = _.map(names, function(name) {
        return "(?<" + name + ">" + citators[name].regex + ")";
      }).join("|");

      regex = new XRegExp(regex, "ig");


      // accumulate the results
      var results = [];

      var replaced = XRegExp.replace(text, regex, function() {
        var match = arguments[0];

        // establish which pattern matched - each pattern name must be unique (even among individual named groups)
        var name = _.find(names, function(citeName) {if (match[citeName]) return true;});
        var type = citators[name].type;
        var processor = citators[name].processor;

        // extract and de-prefix any captured groups from the individual citator's regex
        var captures = Citation.capturesFrom(name, match);

        // process the matched data into the final object
        var cites = processor(captures);
        if (!_.isArray(cites)) cites = [cites]; // one match can generate one or many citation results (e.g. ranges)


        // put together the match-level information
        var matchInfo = {type: type};
        matchInfo.match = match.toString(); // match data can be converted to the plain string

        var index = arguments[arguments.length - 2]; // offset is second-to-last argument

        if (!replace)
          matchInfo.index = index;


        // use index to grab surrounding excerpt
        if (excerpt > 0) {
          var proposedLeft = index - excerpt;
          var left = proposedLeft > 0 ? proposedLeft : 0;

          var proposedRight = index + matchInfo.match.length + excerpt;
          var right = (proposedRight <= text.length) ? proposedRight : text.length;

          matchInfo.excerpt = text.substring(left, right);
        }


        // if we want parent cites too, make those now
        if (parents && Citation.types[type].parents_by) {
          cites = _.flatten(_.map(cites, function(cite) {
            return Citation.citeParents(cite, type);
          }));
        }

        cites = _.map(cites, function(cite) {
          var result = {};

          // match-level info
          _.extend(result, matchInfo);

          // cite-level info, plus ID standardization
          result[type] = cite;
          _.extend(result[type], Citation.types[type].standardize(result[type]));

          results.push(result);

          return result;
        });

        // I don't know what to do about ranges yet - but for now, screw it
        var toReplace;
        if (typeof(replace) === "function")
          toReplace = replace(cites[0]);
        else if ((typeof(replace) === "object") && (typeof(replace[type]) === "function"))
          toReplace = replace[type](cites[0]);

        if (toReplace)
          return toReplace;
        else
          return matchInfo.match;
      });

      var output = {
        citations: _.compact(results)
      };

      if (replace)
        output.text = replaced;

      return output;
    },

    // for a given set of cite-specific details,
    // return itself and its parent citations
    citeParents: function(citation, type) {
      var field = Citation.types[type].parents_by;
      var results = [];

      for (var i=citation[field].length; i >= 0; i--) {
        var parent = _.clone(citation);
        parent[field] = parent[field].slice(0, i);
        results.push(parent);
      }
      return results;
    },

    // internal function - given a XRegExp match object, and a name prefix,
    // return a new object with the de-prefixed captured values
    capturesFrom: function(name, match) {
      var captures = {};
      _.each(_.keys(match), function(key) {
        if (key.indexOf(name + "_") === 0)
          captures[key.replace(name + "_", "")] = match[key];
      });
      return captures;
    }

  };


  // TODO: load only the citation types asked for
  if (typeof(require) !== "undefined") {
    require("./citations/usc");
    require("./citations/law");
    require("./citations/cfr");
    require("./citations/va_code");
    require("./citations/dc_code");
    require("./citations/dc_register");
    require("./citations/dc_law");
    require("./citations/stat");
  }


  if (typeof(window) !== "undefined")
    window.Citation = Citation;

  if (typeof(module) !== "undefined" && module.exports)
    module.exports = Citation;
})();
Citation.types.dc_code = {
  name: "DC Code",
  type: "regex",

  // normalize all cites to an ID, with and without subsections
  standardize: function(data) {
    return {
      id: _.flatten(["dc-code", data.title, data.section, data.subsections]).join("/"),
      section_id: ["dc-code", data.title, data.section].join("/")
    };
  },

  // field to calculate parents from
  parents_by: "subsections",

  patterns: function(context) {
    // only apply this regex if we're confident that relative citations refer to the DC Code
    if (context.source == "dc_code") {
      return [

        // § 32-701
        // § 32-701(4)
        // § 3-101.01
        // § 1-603.01(13)
        // § 1- 1163.33
        // § 1 -1163.33
        // section 16-2326.01
        {
          regex:
            "(?:section|§)\\s+(?<title>\\d+)" +
            "\\s?\\-\\s?" +
            "(?<section>[\\w\\d]+(?:\\.?[\\w\\d]+)?)" +      // section identifier, letters/numbers/dots
            "(?<subsections>(?:\\([^\\)]+\\))*)", // any number of adjacent parenthesized subsections

          processor: function(captures) {
            var title = captures.title;
            var section = captures.section;
            var subsections = [];
            if (captures.subsections) subsections = _.compact(captures.subsections.split(/[\(\)]+/));

            return {
              title: title,
              section: section,
              subsections: subsections
            };
          }
        }
      ];
    }

    // absolute cites
    else {
      return [

        // D.C. Official Code 3-1202.04
        // D.C. Official Code § 3-1201.01
        // D.C. Official Code §§ 38-2602(b)(11)
        // D.C. Official Code § 3- 1201.01
        // D.C. Official Code § 3 -1201.01
        {
          regex:
            "D\\.?C\\.? Official Code\\s+" + // absolute identifier
            "(?:§*\\s+)?(?<title>\\d+)" +            // optional section sign, plus title
            "\\s?\\-\\s?" +
            "(?<section>[\\w\\d]+(?:\\.?[\\w\\d]+)?)" +      // section identifier, letters/numbers/dots
            "(?<subsections>(?:\\([^\\)]+\\))*)", // any number of adjacent parenthesized subsections

          processor: function(captures) {
            var title = captures.title;
            var section = captures.section;

            var subsections = [];
            if (captures.subsections) subsections = _.compact(captures.subsections.split(/[\(\)]+/));

            return {
              title: title,
              section: section,
              subsections: subsections
            };
          }
        }
      ];
    }
  }
};
Citation.types.dc_register = {
  name: "DC Register",
  type: "regex",

  // normalize all cites to an ID
  standardize: function(match) {
    return {
      id: _.flatten(["dc-register", match.volume, match.page]).join("/")
    };
  },

  patterns: [
    // 54 DCR 8014
    {
      regex:
        "(?<volume>\\d+)\\s+" +
        "DCR" +
        "\\s+(?<page>\\d+)",
      processor: function(match) {
        return {
          volume: match.volume,
          page: match.page,
        };
      }
    }
  ]
};
Citation.types.law = {
  name: "US Slip Law",
  type: "regex",

  standardize: function(cite) {
    return {
      id: _.flatten(["us-law", cite.type, cite.congress, cite.number, cite.sections]).join("/"),
      law_id: ["us-law", cite.type, cite.congress, cite.number].join("/")
    }
  },

  // field to calculate parents from
  parents_by: "sections",

  patterns: [
    // "Public Law 111-89"
    // "Pub. L. 112-56"
    // "Pub. L. No. 110-2"
    // "Pub.L. 105-33"
    // "Private Law 111-72"
    // "Priv. L. No. 98-23"
    // "section 552 of Public Law 111-89"
    // "section 4402(e)(1) of Public Law 110-2"
    {
      regex: 
        "(?:section (?<section>\\d+[\\w\\d\-]*)(?<subsections>(?:\\([^\\)]+\\))*) of )?" +
        "(?<type>pub(?:lic)?|priv(?:ate)?)\\.?\\s*l(?:aw)?\\.?(?:\\s*No\\.?)?" +
        " +(?<congress>\\d+)[-–]+(?<number>\\d+)", 
      processor: function(captures) {
        var sections = [];
        if (captures.section) sections.push(captures.section);
        if (captures.subsections) sections = sections.concat(_.compact(captures.subsections.split(/[\(\)]+/)));

        return {
          type: captures.type.match(/^priv/i) ? "private" : "public",
          congress: captures.congress,
          number: captures.number,
          sections: sections
        }
      }
    },

    // "PL 19-4"
    // "P.L. 45-78"
    // "section 552 of PL 19-4"
    // "section 4402(e)(1) of PL 19-4"
    {
      regex: 
        "(?:section (?<section>\\d+[\\w\\d\-]*)(?<subsections>(?:\\([^\\)]+\\))*) of )?" +
        "P\\.?L\\.? +(?<congress>\\d+)[-–](?<number>\\d+)", 
      processor: function(captures) {
        sections = [];
        if (captures.section) sections.push(captures.section);
        if (captures.subsections) sections = sections.concat(_.compact(captures.subsections.split(/[\(\)]+/)));

        return {
          type: "public",
          congress: captures.congress,
          number: captures.number,
          sections: sections
        }
      }
    }
  ]
};Citation.types.stat = {
  name: "US Statutes At Large",
  type: "regex",

  // normalize all cites to an ID
  standardize: function(cite) {
    return {
      id: _.flatten(["stat", cite.volume, cite.page]).join("/")
    }
  },

  patterns: [
    // "117 Stat. 1952"
    // "77 STAT. 77"
    {
      regex: 
        "(?<volume>\\d+[\\w]*)\\s+" +
        "Stat\\.?" +
        "\\s+(?<page>\\d+)", 
      processor: function(match) {

        return {
          volume: match.volume,
          page: match.page,
        }
      }
    }
  ]
};
