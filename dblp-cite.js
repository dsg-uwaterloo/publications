var cheerio = require('cheerio');
var citeproc = require('citeproc');
var fs = require('fs');
var mustache = require('mustache');
var parseFullName = require('parse-full-name').parseFullName;
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

var citations = {};

// Add a new set of citations to the global object by parsing XML
function addCitationsFromXml(xml) {
  xml2js.parseString(xml, {trim: true}, function(err, result) {
    result.dblpperson.r.forEach(function(c) {
      // Each article is nested under a key with the type
      var type = Object.keys(c)[0];
      c = c[type][0];
  
      var csl = {};
  
      // DBLP also includes things such as serving as editor, which we ignore
      if (!c.hasOwnProperty('author')) {
        return;
      }
  
      csl['id'] = c['$'].key;
      csl['type'] = TYPES[type];
      csl['author'] = [];
      csl['title'] = c['title'][0];
  
      // Copy fields with their correct names
      Object.keys(CITATION_FIELDS).forEach(function(field) {
        if (c.hasOwnProperty(field)) {
          csl[CITATION_FIELDS[field]] = c[field][0];
        }
      });
  
      // Override the type if this was in a journal
      if (c.hasOwnProperty('journal')) {
        csl['type'] = 'journal';
      }
  
      if (c.hasOwnProperty('year')) {
        csl['issued'] = {'raw': c.year[0]};
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
  
      citations[csl['id']] = csl;
    });
  });
}

var authors = fs.readFileSync('authors.csv').toString().trim().split('\n');
authors.forEach(function(author) {
  console.log('Fetching citations for ' + author);

  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://dblp.uni-trier.de/pers/' + author + '.xml', false);
  xhr.send(null);

  // Follow possible redirects
  if (Math.floor(xhr.status / 100) == 3) {
    xhr.open('GET', xhr.getResponseHeader('Location'), false);
    xhr.send(null);
  }

  addCitationsFromXml(xhr.responseText);
});

// Provide the necessary functions to citeproc
var citeprocSys = {
  retrieveLocale: function (lang){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://raw.githubusercontent.com/Juris-M/citeproc-js-docs/master/locales-' + lang + '.xml', false);
    xhr.send(null);
    return xhr.responseText;
  },

  retrieveItem: function(id){
    return citations[id];
  }
};

// Get a new engine for a particular citation style
function getProcessor(styleID) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://raw.githubusercontent.com/citation-style-language/styles/master/' + styleID + '.csl', false);
  xhr.send(null);
  var styleAsText = xhr.responseText;
  return new citeproc.Engine(citeprocSys, styleAsText);
};

// Create a new processor and add all the citations
var processor = getProcessor('ieee');
processor.updateItems(Object.keys(citations));

// Generate HTML and strip citation numbers
var citationHTML = processor.makeBibliography()[1].join('\n');
var $ = cheerio.load(citationHTML);
$('div.csl-left-margin').remove();

// Render to a template
var template = fs.readFileSync('citations.mustache').toString();
var html = mustache.render(template, {citations: $.html()});
fs.writeFileSync('citations.html', html);
