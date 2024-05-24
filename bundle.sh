#!/bin/bash

version="$(jq -r <ccmod.json .version)";
[ -n "$1" ] && version="$version-$1";

filename="CCMultiworldRandomizer-$version.ccmod";
[ -f "$filename" ] && rm "$filename"
zip -r "$filename" assets ccmod.json data/out mw-rando -x data/out/locations.json
