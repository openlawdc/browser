mkdir -p tmp
wget http://rawgithub.com/unitedstates/citation/master/citation.js -O tmp/citation.js
wget http://rawgithub.com/unitedstates/citation/master/citations/dc_code.js -O tmp/dc_code.js
wget http://rawgithub.com/unitedstates/citation/master/citations/dc_register.js -O tmp/dc_register.js
wget http://rawgithub.com/unitedstates/citation/master/citations/law.js -O tmp/law.js
wget http://rawgithub.com/unitedstates/citation/master/citations/stat.js -O tmp/stat.js
cat tmp/*.js > js/lib/citation.js

