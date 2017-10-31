# DBLP-cite

This is a simple script which pulls a publication list from DBLP and produces and produces a list of citations formatted as HTML.
The script requires [Node.js](https://nodejs.org/) and dependencies can be installed with `npm install`.
All authors are stored in [`authors.csv`](authors.csv) where each line is just the last two components of the DBLP URL for an author.
Running `node dblp-cite.js` will download the citations for each author and write HTML to `citations.html`.
