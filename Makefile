all: search js/lib.js

js/lib.js: js/lib
	cat js/lib/d3.v3.min.js \
		js/lib/d3.keybinding.js \
		js/lib/d3.combobox.js \
		js/lib/d3.trigger.js \
		js/lib/director.min.js > js/lib.js

precook.zip:
	wget https://dl.dropboxusercontent.com/u/68059/dccode/precook.zip -O precook.zip

search:
	unzip precook.zip
