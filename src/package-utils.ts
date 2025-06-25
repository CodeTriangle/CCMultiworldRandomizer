const fs: typeof import('fs') = (0, eval)('require("fs")');
import * as ap from "archipelago.js";

const CACHE_DIR = ".apcache";

export async function saveGamePackage(game: string, pkg: ap.GamePackage): Promise<void> {
	let dir = `${CACHE_DIR}/${game}`;
	let file = `${dir}/${pkg.checksum}.json`;

	// make directory then write file containing data package
	return fs.promises.access(file, fs.constants.R_OK)
		.catch(() => fs.promises.mkdir(dir, {recursive: true})
			.then(() => fs.promises.writeFile(file, JSON.stringify(pkg), "utf8"))
		);
}

export async function saveDataPackage(pkg: ap.DataPackage) {
	return Promise.all(
		Object.entries(pkg.games).map(([game, gpkg]) => saveGamePackage(game, gpkg))
	)
}

export async function loadGamePackage(game: string, checksum: string): Promise<ap.GamePackage | null> {
	return fs.promises.readFile(`${CACHE_DIR}/${game}/${checksum}.json`, {encoding: "utf8"})
		.then(contents => JSON.parse(contents))
		.catch(e => {
			console.log(e);
			return null;
		});
}

export async function loadDataPackage(checksums: Record<string, string>): Promise<Record<string, ap.GamePackage>> {
	let result: Record<string, ap.GamePackage> = {};

	await Promise.all(
		Object.entries(checksums)
			.map(async ([game, checksum]) => {
				return loadGamePackage(game, checksum)
					.then(pkg => {
						if (pkg != null) {
							result[game] = pkg;
						}
					});
			})
	);

	return result;
}
