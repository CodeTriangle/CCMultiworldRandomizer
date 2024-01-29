import * as esbuild from 'esbuild';
import {polyfillNode} from 'esbuild-plugin-polyfill-node';
import * as fs from 'fs';

if (!fs.existsSync("mw-rando")) {
	fs.mkdirSync("mw-rando");
}

esbuild.build({
	"target": "es2018",
	"format": "esm",
	"platform": "node",
	"bundle": true,
	"sourcemap": "inline",
	"outfile": "mw-rando/plugin.js",
	"plugins": [ polyfillNode({
		"polyfills": {
			"crypto": true,
			"fs": false,
			"events": false,
		}
	}) ],
	"entryPoints": ["src/plugin.ts"],
});

esbuild.build({
	"target": "es2018",
	"format": "esm",
	"platform": "node",
	"bundle": true,
	"sourcemap": "inline",
	"outfile": "mw-rando/multiworld-model.js",
	"entryPoints": ["src/modules/multiworld-model.ts"],
	"format": "iife"
});
