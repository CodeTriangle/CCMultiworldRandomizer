declare namespace sc {
	interface MultiWorldItemContent extends ig.GuiElementBase {
		timer: number;
		id: number;
		player: number;
		textGui: sc.TextGui;

		updateOption(this: this, isNormalSize: boolean): void;
		updateTimer(this: this): void;
	}

	interface MultiWorldItemContentConstructor extends ImpactClass<MultiWorldItemContent> {
		new(item: ItemInfo): MultiWorldItemContent;
	}

	var MultiWorldItemContent: sc.MultiWorldItemContentConstructor;

	interface MultiWorldHudBox extends sc.RightHudBoxGui, sc.Model.Observer {
		contentEntries: MultiWorldItemContent[];
		delayedStack: MultiWorldItemContent[];
		size: number;
		
		addEntry(this: this, itemInfo: ItemInfo): void;
		_popDelayed(this: this): void;
		_updateSizes(this: this, isNormalSize: boolean): void;
		// modelChanged(this: this, model: sc.Model, msg: number, data: any);
	}

	interface MultiWorldHudBoxConstructor extends ImpactClass<MultiWorldHudBox> {
		new(): MultiWorldHudBox;
	}

	var MultiWorldHudBox: sc.MultiWorldHudBoxConstructor;
}
