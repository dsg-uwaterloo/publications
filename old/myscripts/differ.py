

baseFiles = [ '../archive/build-all-profonly-23jan19/dsg.bib', '../archive/build-all-profonly-17mar19/diff.bib', '../archive/build-all-profonly-20may19/diff.bib', '../archive/build-all-profonly-21jul19/diff.bib', '../archive/build-all-profonly-8oct19/diff.bib']
deleteFiles = [ '../archive/build-all-profonly-17mar19/delete.bib', '../archive/build-all-profonly-20may19/delete.bib', '../archive/build-all-profonly-21jul19/delete.bib', '../archive/build-all-profonly-8oct19/delete.bib' ]

baseEntries = set()
for filename in baseFiles :	
	f = open(filename, 'r')
	fEntries = set([ a for a in f.read().split('\n') if len(a) > 0])
	baseEntries = baseEntries.union(fEntries)

for filename in deleteFiles :	
	f = open(filename, 'r')
	fEntries = set([ a for a in f.read().split('\n') if len(a) > 0])
	baseEntries = baseEntries.difference(fEntries)




currentFile = '../archive/build-all-profonly-10jan21/dsg.bib'
currentEntries = set()
f = open(currentFile, 'r')
cEntries = set([ a for a in f.read().split('\n') if len(a) > 0])


result = baseEntries.difference(cEntries)

print len(result)

f = open('delete.bib', 'w')

for e in result :
	f.write(e + "\n\n");

f.close()


result = cEntries.difference(baseEntries)

print len(result)

f = open('diff.bib', 'w')

for e in result :
	f.write(e + "\n\n");

f.close()


