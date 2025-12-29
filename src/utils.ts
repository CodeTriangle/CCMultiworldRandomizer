const fs: typeof import('fs') = (0, eval)('require("fs")');

export function defineVarProperty(object: Object, name: string, igVar: string) {
	Object.defineProperty(object, name, {
		get() {
			return ig.vars.get(igVar);
		},
		set(newValue: any) {
			ig.vars.set(igVar, newValue);
		},
	});
}

export async function readJsonFromFile(path: string) {
	if (path.startsWith('./assets/')) {
		return fetch(path.slice(1)).then(resp => resp.json());
	}
	if (path.startsWith('/assets/')) {
		return fetch(path).then(resp => resp.json());
	}
	if (path.startsWith('assets/')) {
		return fetch('/' + path).then(resp => resp.json());
	}

	return JSON.parse((await fs.promises.readFile(path)) as unknown as string);
}

export function getElementIconString(element: string) {
	switch (element) {
		case "ALL":
			return "\\i[element-neutral]\\i[element-heat]\\i[element-cold]\\i[element-shock]\\i[element-wave]";
		case "ALL_ELEMENTS":
			return "\\i[element-heat]\\i[element-cold]\\i[element-shock]\\i[element-wave]";
		case "NEUTRAL":
			return "\\i[element-neutral]";
		case "HEAT":
			return "\\i[element-heat]";
		case "COLD":
			return "\\i[element-cold]";
		case "SHOCK":
			return "\\i[element-shock]";
		case "WAVE":
			return "\\i[element-wave]";
	}
}
