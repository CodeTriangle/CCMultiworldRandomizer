#!/bin/bash

vparts=( $(jq -r '.randoVersion[]' data/in/master.json) )
version="${vparts[0]}.${vparts[1]}.${vparts[2]}$([ -n "${vparts[3]}" ] && echo -${vparts[3]})"

sed -i '/"version"/ s/: ".\+"/: '"\"$version\"/" ccmod.json

[ -n "$1" ] && version="$version-$1";

filename="CCMultiworldRandomizer-$version.ccmod";
[ -f "$filename" ] && rm "$filename"
zip -r "$filename" assets ccmod.json data/out mw-rando icon*.png -x data/out/locations.json
