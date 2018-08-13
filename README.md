# DBLP-cite

This is a simple script which pulls a publication list from DBLP and produces and produces a list of citations formatted as HTML.
The script requires [Node.js](https://nodejs.org/) and dependencies can be installed with `npm install`.
All authors are stored in [`authors.csv`](authors.csv) where each line is just the last two components of the DBLP URL for an author in the first column and a start and end year in the second column.
In case DBLP misattributes a publication, the key for a specific publication which should *not* be included can be added to [`blacklist.csv`](blacklist.csv).
Running `node dblp-cite.js` will download the citations for each author and write HTML to `build/index.html` and BibTeX to `build/dsg.bib`.

## Usage

This repository has been tested with Node.js Carbon.
First run `npm install` to install the necessary dependencies.
You can test locally by running `node dblp-cite.js`.
To actually deploy the changes, just push to GitHub.
Building the page is automatically done by [Travis CI](https://travis-ci.org/) and deployed via [GitHub Pages](https://docs.travis-ci.com/user/deployment/pages/).
To trigger updates without actually changing the code, you can visit the [builds page](https://travis-ci.org/dsg-uwaterloo/publications/builds) on Travis and select "Trigger build" under "More options" in the top-right.
This could certainly be automated with a cron job using the [Travis API](https://docs.travis-ci.com/user/triggering-builds/).

## Citation retrieval

Retrieving data from DBLP consists of the following steps:

1. Download the XML for each author
2. Convert the XML to Javascript objects with [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)
3. Reformat the objects into CSL-JSON (change from DBLP entry types to CSL-JSON types, rename fields, etc.)

## Formatting

The formatting of bibliography entries is done using the [Citation Style Language](https://citationstyles.org/).
There is one style for the [HTML](dsg.csl) and another for [BibTeX](bibtex.csl).
These styles can be customized as needed.
