all: search

precook.zip:
	wget https://dl.dropboxusercontent.com/u/68059/dccode/precook.zip -O precook.zip

search:
	unzip precook.zip
