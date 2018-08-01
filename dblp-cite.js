var citeproc = require('citeproc');
var fs = require('fs');
var mustache = require('mustache');
var parseFullName = require('parse-full-name').parseFullName;
var striptags = require('striptags');
var unidecode = require('unidecode');
var xml2js = require('xml2js');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

// Mapping from DBLP types to CSL-JSON
TYPES = {
  'article': 'article',
  'inproceedings': 'paper-conference'
}

// Mapping from DBLP citation fields to CSL-JSON
CITATION_FIELDS = {
  'booktitle': 'container-title',
  'ee': 'DOI',
  'journal': 'container-title',
  'number': 'issue',
  'pages': 'page',
  'title': 'title',
  'volume': 'volume'
}

// Mapping from DBLP author fields to CSL-JSON
AUTHOR_FIELDS = {
  'first': 'given',
  'last': 'family',
  'middle': 'middle',
  'suffix': 'suffix'
}

// Load the blacklist
var blacklist = {};
var blacklistEntries = fs.readFileSync('blacklist.csv').toString().trim().split('\n');
blacklistEntries.forEach(function(blacklistEntry) {
  blacklist[blacklistEntry] = true;
});

var citations = {};

// Add a new set of citations to the global object by parsing XML
function addCitationsFromXml(xml, start, end) {
  xml2js.parseString(xml, {trim: true}, function(err, result) {
    result.dblpperson.r.forEach(function(c) {
      // Each article is nested under a key with the type
      var type = Object.keys(c)[0];
      c = c[type][0];

      // Check the publication is within the desired range
      if (c.hasOwnProperty('year')) {
        if ((!isNaN(start) && c.year[0] < start) ||
            (!isNaN(end) && c.year[0] < end)) {
          return;
        }
      }

      var csl = {};

      // DBLP also includes things such as serving as editor, which we ignore
      if (!c.hasOwnProperty('author')) {
        return;
      }

      csl['id'] = c['$'].key;
      csl['type'] = TYPES[type];
      csl['author'] = [];
      csl['title'] = c['title'][0];

      // Skip entries in the blacklist
      if (csl['id'] in blacklist) {
        return;
      }

      // Copy fields with their correct names
      Object.keys(CITATION_FIELDS).forEach(function(field) {
        if (c.hasOwnProperty(field)) {
          csl[CITATION_FIELDS[field]] = c[field][0];
        }
      });

      // Override the type if this was in a journal
      if (c.hasOwnProperty('journal')) {
        csl['type'] = 'article-journal';
      }

      // Store the citation in the appropriate year
      var year = 'Unknown';
      if (c.hasOwnProperty('year')) {
        year = c.year[0];
        csl['issued'] = {'raw': year};
      }

      // Add all authors
      c.author.forEach(function(author) {
        // Authors with ORCID may not be plain strings
        if (typeof author == 'object') {
          author = author['_'];
        }

        var parsed = parseFullName(author.replace(/\s+\d+$/, ''));
        var cslAuthor = {};

        // Copy fields to the author
        Object.keys(AUTHOR_FIELDS).forEach(function(field) {
          if (parsed[field]) {
            cslAuthor[AUTHOR_FIELDS[field]] = parsed[field];
          }
        });

        csl['author'].push(cslAuthor);
      });

      if (!citations.hasOwnProperty(year + '')) {
        citations[year + ''] = {};
      }
      csl['id'] = year + ':' + csl['id']
      citations[year + ''][csl['id']] = csl;
    });
  });
}

var authors = fs.readFileSync('authors.csv').toString().trim().split('\n');
authors.forEach(function(authorLine) {
  authorLine = authorLine.split(",");
  var author = authorLine[0];
  var start = parseInt(authorLine[1]);
  var end = parseInt(authorLine[2]);

  console.log('Fetching citations for ' + author);

  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://dblp.uni-trier.de/pers/xx/' + author, false);
  xhr.send(null);

  // Follow possible redirects
  if (Math.floor(xhr.status / 100) == 3) {
    xhr.open('GET', xhr.getResponseHeader('Location'), false);
    xhr.send(null);
  }

  addCitationsFromXml(xhr.responseText, start, end);
});

// Provide the necessary functions to citeproc
var citeprocSys = {
  retrieveLocale: function (lang) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://raw.githubusercontent.com/Juris-M/citeproc-js-docs/master/locales-' + lang + '.xml', false);
    xhr.send(null);
    return xhr.responseText;
  },

  retrieveItem: function(id) {
    return citations[id.split(':')[0]][id];
  },

  variableWrapper: function(params, prePunct, str, postPunct) {
    if (params.variableNames[0] === 'title'
        && params.itemData.DOI
        && params.context === "bibliography") {
      return prePunct + '<a href="' + params.itemData.DOI + '">' + str + '</a>' + postPunct;
    } else {
      return (prePunct + str + postPunct);
    }
  }
};

// Get a new engine for a particular citation style
function getProcessor(style) {
  var styleAsText = fs.readFileSync(style).toString();
  return new citeproc.Engine(citeprocSys, styleAsText);
};

// Generate the HTML for each year
var processor = getProcessor('dsg.csl');
var bibtexProcessor = getProcessor('bibtex.csl')
var citationsHTML = [];
var bibtex = '';
var years = Object.keys(citations);
years.sort(function(a, b) {
  if (a == b) { return 0; }
  if (a == 'Unknown') { return 1; }
  if (b == 'Unknown') { return -1; }
  return parseInt(b) - parseInt(a);
});
years.forEach(function(citationYear) {
  if (citations.hasOwnProperty(citationYear)) {
    var entries = citations[citationYear];
    processor.updateItems(Object.keys(entries));
    var citationHTML = processor.makeBibliography()[1].join('\n');
    citationsHTML.push({year: citationYear, entries: citationHTML});

    bibtexProcessor.updateItems(Object.keys(entries));
    var citationsBibtex = bibtexProcessor.makeBibliography()[1].map(function(ref) {
      ref = striptags(ref);
      return ref.replace(/^\s+@([a-z]+){([^,]+)/i, function(match, type, key) {
        return '@' + type + '{' + unidecode(key.replace(/\s/, ''));
      });
    }).join('\n');
    bibtex += citationsBibtex;
  }
});

// Render the generated HTML to a template
var template = fs.readFileSync('citations.mustache').toString();
var html = mustache.render(template, {citations: citationsHTML});
if (!fs.existsSync('./build')){
  fs.mkdirSync('./build');
}
fs.writeFileSync('./build/index.html', html);
fs.writeFileSync('./build/dsg.bib', bibtex);
