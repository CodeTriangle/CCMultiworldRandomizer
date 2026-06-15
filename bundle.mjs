import * as fs from "node:fs/promises";
import { createWriteStream } from "node:fs"; 
import * as process from "node:process";
import * as fflate from "fflate";

const files = [
	"ccmod.json",
	"icon-24.png"
];

const directories = [
	"assets",
	"data/out",
	"mw-rando"
];

const exclude = [
	"data/out/locations.json"
];

const masterJSON = JSON.parse((await fs.readFile("data/in/master.json")).toString("utf-8"));

const versionArray = masterJSON["randoVersion"];
let versionString = `${versionArray[0]}.${versionArray[1]}.${versionArray[2]}`;
if (versionArray.length > 3) {
	versionString += `-${versionArray[3]}`;
}

const ccmodJSON = JSON.parse((await fs.readFile("ccmod.json")).toString("utf-8"));
ccmodJSON["version"] = versionString;
await fs.writeFile("ccmod.json", JSON.stringify(ccmodJSON, undefined, "\t"));

if (process.argv.length > 2) {
	versionString += `-${process.argv[2]}`;
}

const filename = `CCMultiworldRandomizer-${versionString}.ccmod`;
const outfile = createWriteStream(filename);

const zipfile = new fflate.Zip((err, data, final) => {
	if (err) {
		console.error(err);
		return;
	}
	outfile.write(data);
	if (final) {
		outfile.close();
	}
});

for (const path of files) {
	console.log("ADDING: ", path);
	if (exclude.includes(path)) {
		continue;
	}
	const zipstream = filename.endsWith(".png") ? new fflate.ZipPassThrough(path) : new fflate.ZipDeflate(path);
	zipfile.add(zipstream);
	zipstream.push(await fs.readFile(path), true);
}

for (const dir of directories) {
	for (const dirent of await fs.readdir(dir, { recursive: true, withFileTypes: true})) {
		if (!dirent.isFile()) {
			continue;
		}
		const path = `${dirent.parentPath}/${dirent.name}`;
		if (exclude.includes(path)) {
			continue;
		}
		console.log("ADDING: ", path);
		const zipstream = path.endsWith(".png") ? new fflate.ZipPassThrough(path) : new fflate.ZipDeflate(path);
		zipfile.add(zipstream);
		zipstream.push(await fs.readFile(path), true);
	}
}

zipfile.end();
