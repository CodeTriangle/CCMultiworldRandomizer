import * as ap from 'archipelago.js';
import type MwRandomizer from '../plugin';
import {MultiworldArea} from "../item-data.model";

// HACK: This should be in archipelago.js but it is not exported
export const HintStatuses = {
    /** The receiving player has not set a status. */
    unspecified: 0,
    /** The receiving player has specified this item is unnecessary. */
    noPriority: 10,
    /** The receiving player has specified this item is detrimental. */
    avoid: 20,
    /** The receiving player has specified this item is required/important. */
    priority: 30,
    /** The receiving player has received this item. */
    found: 40,
} as const;

const VanillaChapterMap = {
    "arid": 7,
    "autumn-area": 3,
    "autumn-fall": 6,
    "bergen": 4,
    "bergen-trails": 4,
    "cold-dng": 4,
    "forest": 9,
    "heat-area": 5,
    "heat-dng": 5,
    "heat-village": 5,
    "jungle": 8,
    "jungle-city": 8,
    "rhombus-sqr": 10,
    "rookie-harbor": 2,
    "shock-dng": 8,
    "tree-dng": 8,
    "wave-dng": 8,
    "evo-village": 12,
    "beach": 13,
    "final-dng": 14
} satisfies Record<MultiworldArea, number>;

const OffworldGameMap = {
    "Candy Box 2": 1
} as const satisfies Record<string, number>;

declare global {
    namespace sc {
        var AP_COLOR_MAPPING: Record<ap.ValidJSONColorType, string>;

        enum MENU_SUBMENU {
            AP_HINT_CLIENT = 300003,
        }

        interface APHintClientList extends sc.ListTabbedPane {
            marqueeGroup: codetriangle.marquee.MarqueeGroup;
            buttons: sc.APHintClientEntry[];
            blockHint: ap.Hint | null;

            sortList(list: ap.Hint[], sortType: HINT_SORT_TYPES): void;
            modelChanged(this: this, model: any, message: any, data: any): void;
            getCurrentSortText(this: APHintClientList): string;
            newHintReceived(this: this, hint: ap.Hint): void;
            loadHints(this: this, tabIndex: number): ap.Hint[];
            hintCategory(hint: ap.Hint): HINT_CATEGORY_TYPES[];
        }

        interface APHintClientListConstructor extends ImpactClass<sc.APHintClientList> {
            new(): APHintClientList;
        }

        var APHintClientList: APHintClientListConstructor;

        interface APHintClientEntryLocation extends ig.BoxGui {
            marqueeGroup: codetriangle.marquee.MarqueeGroup;
            location: codetriangle.marquee.TextMarqueeGui;
            status: sc.TextGui;

            setHint(this: APHintClientEntryLocation, hint: ap.Hint): void;
        }

        interface APHintClientEntryLocationConstructor extends ImpactClass<sc.APHintClientEntryLocation> {
            new(marqueeGroup: codetriangle.marquee.MarqueeGroup): APHintClientEntryLocation;
        }

        var APHintClientEntryLocation: APHintClientEntryLocationConstructor;

        interface APHintClientChapter extends ig.GuiElementBase {
            gfx: ig.Image,
            apGfx: ig.Image,
            chapter: [true, typeof VanillaChapterMap[keyof typeof VanillaChapterMap]] | [false, typeof OffworldGameMap[keyof typeof OffworldGameMap]]

            setHint(hint: ap.Hint): void;
        }

        interface APHintClientChapterConstructor extends ImpactClass<sc.APHintClientChapter> {
            new(hint: ap.Hint): APHintClientChapter
        }

        var APHintClientChapter: APHintClientChapterConstructor;

        interface APHintClientHintUpdateEffect extends ig.GuiElementBase {
            ninepatch: ig.NinePatch;

            playNew(this: this, callback: () => void): void;
        }

        interface APHintClientHintUpdateEffectConstructor extends ImpactClass<sc.APHintClientHintUpdateEffect> {
            new(): APHintClientHintUpdateEffect
        }

        var APHintClientHintUpdateEffect: APHintClientHintUpdateEffectConstructor;

        interface APHintClientMenu extends sc.ListInfoMenu {
            hintList: sc.APHintClientList;
            options: sc.SortMenu;
            hotkeyRequestHint: sc.ButtonGui;

            onBackButtonPress(): void;
            openOptionsMenu(this: this, button: sc.APHintClientEntry): void;
            onOptionsExecute(this: this, button: sc.ButtonGui): void;
            onOptionsBack(this: this): void;
            onRequestHintButtonPressed(this: this): void;
            modelChanged(this: this, model: any, message: any, data: any): void;

            _createButton(this: this, menuName: string, index: number, menu: sc.MENU_SUBMENU): sc.ButtonGui;
            _keepButtonFocused: sc.APHintClientEntry | null;
        }

        interface APHintClientMenuConstructor extends ImpactClass<sc.APHintClientMenu> {
            new(): APHintClientMenu;
        }

        var APHintClientMenu: APHintClientMenuConstructor;

        interface APHintClientEntry extends ig.FocusGui {
            ninepatch: ig.NinePatch;
            gfx: ig.Image;

            wrapper: ig.GuiElementBase,
            effect: sc.APHintClientHintUpdateEffect;

            title: sc.TextGui;
            chapter: sc.APHintClientChapter;
            player: sc.TextGui;
            location: sc.APHintClientEntryLocation;

            hint: ap.Hint;

            addObservers(this: this): void;
            removeObservers(this: this): void;

            keepButtonPressed(this: this): void;
            unPressButton(this: this): void;
            hintUpdated(this: this, hint: ap.Hint): void;
            setHint(this: this, hint: ap.Hint): void;
            doNewEffect(this: this): void;
        }

        interface APHintClientEntryConstructor extends ImpactClass<sc.APHintClientEntry> {
            new(hint: ap.Hint, tabIndex: number): APHintClientEntry;
        }

        var APHintClientEntry: APHintClientEntryConstructor;

        interface APHintClientRequestHintDialog extends ig.GuiElementBase {
            ninepatch: ig.NinePatch;
            gfx: ig.Image;

            msgBox: sc.CenterBoxGui;
            textGui: sc.TextGui;
            buttonInteract: ig.ButtonInteractEntry;
            buttongroup: sc.ButtonGroup;
            inputGui: modmanager.gui.InputField;
            hintCostGui: sc.TextGui;
            hintPointsGui: sc.TextGui;
            backButton: sc.ButtonGui;
            requestButton: sc.ButtonGui;

            onBackButtonPress(this: this): void;
            onRequestHint(this: this): void;
        }

        interface APHintClientRequestHintDialogConstructor extends ImpactClass<sc.APHintClientRequestHintDialog> {
            new(): APHintClientRequestHintDialog
        }

        var APHintClientRequestHintDialog: APHintClientRequestHintDialogConstructor;
    }

    interface Window {
        apmenu: sc.APHintClientMenu;
    }
}

enum HINT_SORT_TYPES {
    UNSPECIFIED = 0,
    STATUS = 1,
    PLAYER = 2,
    ITEM_NAME = 3
}

enum HINT_CATEGORY_TYPES {
    INCOMING = 0,
    OUTGOING = 1
}

export function patch(plugin: MwRandomizer) {
    sc.APHintClientEntryLocation = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch('media/gui/menu.png', {
            width: 4,
            height: 4,
            left: 13,
            top: 13,
            right: 4,
            bottom: 0,
            offsets: { default: { x: 459, y: 224 } },
        }),
        init(marqueeGroup) {
            this.parent(337, 13)
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM)
            this.setPos(3, 3)
            this.marqueeGroup = marqueeGroup
            this.location = new codetriangle.marquee.TextMarqueeGui('', 330, { font: sc.fontsystem.smallFont })
            this.location.setPos(26, 0)
            this.location.addToGroup(marqueeGroup)
            this.addChildGui(this.location)
            this.status = new sc.TextGui('', { font: sc.fontsystem.tinyFont })
            this.status.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER)
            this.status.setPos(5, 1)
            this.addChildGui(this.status)
        },
        setHint(hint: ap.Hint) {
            const hintStatus = ({
                [HintStatuses.unspecified]: "Unspecified",
                [HintStatuses.noPriority]: "\\c[4]No Priority",
                [HintStatuses.avoid]: "\\c[1]Avoid",
                [HintStatuses.priority]: "\\c[2]Priority",
                [HintStatuses.found]: "\\c[4]Found",
            } as const)[hint.status] ?? "Unspecified"
            this.status.setText(hintStatus)

            const locationText =
                hint.entrance == "Vanilla"
                    ? hint.item.locationName
                    : `${hint.item.locationName} - ${hint.entrance}`;
            this.location.setSize(300 - this.status.hook.size.x, this.location.textGui.hook.size.y);
            this.location.setText(locationText)
        },
        updateDrawables(renderer) {
            this.parent(renderer)
            renderer.addGfx(this.ninepatch.gfx, 13, 1, 481, 224, 8, 11)
        },
    })

    sc.APHintClientChapter = ig.GuiElementBase.extend({
        gfx: new ig.Image('media/gui/chapters.png'),
        apGfx: new ig.Image('media/gui/archipelago-chapters.png'),
        chapter: [true, 11],
        init(hint: ap.Hint) {
            this.parent()
            this.setSize(147, 30)
            this.setPos(4, 16)
            this.setHint(hint)
        },
        setHint(hint: ap.Hint) {
            if (hint.item.locationGame == "CrossCode") {
                const locationId = hint.item.locationId;
                const area = sc.randoData.areas[locationId.toString()]
                if (area) {
                    this.chapter = [true, VanillaChapterMap[area]];
                } else {
                    this.chapter = [true, 11];
                }
            } else {
                this.chapter = [false, OffworldGameMap[hint.item.locationGame as keyof typeof OffworldGameMap] ?? 0];
            }
        },
        updateDrawables(renderer) {
            const [vanilla, index] = this.chapter;
            if (vanilla) {
                renderer.addGfx(this.gfx, 0, 0, (index % 2) * 147 + 5, Math.floor(index / 2) * 34 + 2, 142, 30)
            } else {
                renderer.addGfx(this.apGfx, 0, 0, (index % 2) * 147 + 5, Math.floor(index / 2) * 34 + 2, 142, 30)
            }
        },
    })

    sc.APHintClientHintUpdateEffect = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch('media/gui/buttons.png', {
            width: 28,
            height: 10,
            left: 8,
            top: 15,
            right: 8,
            bottom: 15,
            offsets: { default: { x: 175, y: 114 } },
        }),
        transitions: {
            DEFAULT: { state: { alpha: 1 }, time: 0.5, timeFunction: KEY_SPLINES.EASE },
            HIDDEN: { state: { alpha: 0, scaleY: 0 }, time: 0.5, timeFunction: KEY_SPLINES.EASE },
            HIDDEN_UPDATE: { state: { alpha: 0 }, time: 0.3, timeFunction: KEY_SPLINES.EASE },
            DEFAULT_UPDATE: { state: { alpha: 1 }, time: 0.3, timeFunction: KEY_SPLINES.EASE },
            NEW_HIDDEN: { state: { alpha: 0.5, scaleX: 0 }, time: 0.5, timeFunction: KEY_SPLINES.EASE },
            NEW_HIDDEN_END: { state: { alpha: 0 }, time: 0.3, timeFunction: KEY_SPLINES.EASE },
        },
        init() {
            this.parent()
            this.setSize(395, 50)
            this.setPivot(0, 20)
            this.doStateTransition('HIDDEN', true)
        },
        playNew(callback) {
            this.doStateTransition('NEW_HIDDEN', true)
            this.setPivot(0, 20)
            this.doStateTransition(
                'DEFAULT',
                false,
                false,
                () => {
                    this.setPivot(395, 20)
                    callback && callback()
                    this.doStateTransition('NEW_HIDDEN_END', false, false, null, 0.05)
                },
                0.2
            )
        },
        updateDrawables(renderer) {
            this.ninepatch.drawComposite(renderer, this.hook.size.x, this.hook.size.y, 'default', 'lighter')
        },
    })

    sc.APHintClientEntry = ig.FocusGui.extend({
        transitions: {
            DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
            HIDDEN: { state: { alpha: 0 }, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
        },
        gfx: new ig.Image('media/gui/menu.png'),
        ninepatch: new ig.NinePatch('media/gui/buttons.png', {
            width: 28,
            height: 10,
            left: 8,
            top: 15,
            right: 8,
            bottom: 15,
            offsets: {
                default: { x: 0, y: 114 },
                focus: { x: 45, y: 114 },
                hdefault: { x: 170, y: 50 },
                hfocus: { x: 213, y: 50 },
            },
        }),

        init(hint, tabIndex) {
            this.parent()
            this.setSize(395, 50)

            this.wrapper = new ig.GuiElementBase();
            this.wrapper.setSize(395, 50);
            this.wrapper.hook.transitions = {
                DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
                HIDDEN: { state: { alpha: 0 }, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
            }
            this.wrapper.doStateTransition('DEFAULT', true)

            const marqueeGroup = new codetriangle.marquee.MarqueeGroup(true);

            this.chapter = new sc.APHintClientChapter(hint)
            this.wrapper.addChildGui(this.chapter)

            const itemInfo = sc.multiworld.getItemInfo(hint.item);
            const marqueeGui = new sc.MultiWorldItemMarqueeGui(itemInfo, 384, false);
            if (itemInfo.level > 0) {
                marqueeGui.iconGui.setDrawCallback((width: number, height: number) => {
                    sc.MenuHelper.drawLevel(
                        itemInfo.level,
                        width,
                        height,
                        this.gfx,
                        itemInfo.isScalable
                    );
                });
            }

            marqueeGui.addToGroup(marqueeGroup);
            marqueeGui.setPos(5, 1);
            this.wrapper.addChildGui(marqueeGui);

            const rightLabels = new ig.GuiElementBase();
            rightLabels.setPos(145, 5)
            rightLabels.setSize(47, 30)
            const player = new sc.TextGui(ig.lang.get(`sc.gui.mw.hint-client.hint.${tabIndex == 0 ? "receiver" : "sender"}`), { font: sc.fontsystem.tinyFont })
            player.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP)
            player.setPos(0, 20)
            rightLabels.addChildGui(player)
            this.wrapper.addChildGui(rightLabels)

            this.player = new sc.TextGui(tabIndex == 0 ? hint.item.receiver.alias : hint.item.sender.alias, { font: sc.fontsystem.smallFont });
            this.player.setPos(195, 21);
            this.wrapper.addChildGui(this.player)

            this.location = new sc.APHintClientEntryLocation(marqueeGroup)
            this.wrapper.addChildGui(this.location)

            this.addChildGui(this.wrapper);

            this.effect = new sc.APHintClientHintUpdateEffect();
            this.addChildGui(this.effect);

            this.setHint(hint);
        },
        addObservers() {
            sc.multiworld.client.items.on("hintUpdated", this.hintUpdated.bind(this))
        },
        removeObservers() {
            sc.multiworld.client.items.off("hintUpdated", this.hintUpdated.bind(this))
        },
        hintUpdated(hint) {
            if (this.hint.item.sender.slot == hint.item.sender.slot && this.hint.item.sender.team == hint.item.sender.team && this.hint.item.locationId == hint.item.locationId) {
                this.setHint(hint)
            }
        },
        setHint(hint) {
            this.hint = hint;
            this.location.setHint(hint)
        },
        updateDrawables(renderer) {
            if (this.wrapper.hook.currentStateName != 'HIDDEN') {
                this.ninepatch.draw(renderer, this.hook.size.x, this.hook.size.y, this.focus ? 'focus' : 'default')
                this.ninepatch.draw(renderer, this.hook.size.x, this.hook.size.y, this.focus ? 'hfocus' : 'hdefault', 1)
            }
        },
        keepButtonPressed() {
            this.keepPressed = true
            this.setPressed(true)
        },
        unPressButton() {
            this.keepPressed = false
            this.setPressed(false)
        },
        doNewEffect() {
            this.wrapper.doStateTransition('HIDDEN', true)
            this.effect.playNew(() => {
                this.wrapper.doStateTransition('DEFAULT', true)
            })
        }
    })

    sc.APHintClientList = sc.ListTabbedPane.extend({
        containerHeightOffset: -26,
        listPosOffset: -6,
        listHeightOffset: 6,
        listPageSize: 25,
        buttons: [],
        blockHint: null,
        init() {
            this.parent(true)
            this.setSize(400, 216)
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP)
            this.setPanelSize(400, 216)
            this.hook.transitions = {
                DEFAULT: {state: {}, time: 0.2, timeFunction: KEY_SPLINES.LINEAR},
                HIDDEN: {state: {alpha: 0, offsetX: 218}, time: 0.2, timeFunction: KEY_SPLINES.LINEAR},
                HIDDEN_EASE: {state: {alpha: 0, offsetX: 218}, time: 0.2, timeFunction: KEY_SPLINES.EASE},
            }
            this.addTab('incoming', 0, {type: HINT_CATEGORY_TYPES.INCOMING})
            this.addTab('outgoing', 1, {type: HINT_CATEGORY_TYPES.OUTGOING})
        },
        addObservers() {
            sc.Model.addObserver(sc.menu, this)
            sc.multiworld.client.items.on("hintReceived", this.newHintReceived.bind(this))
        },
        removeObservers() {
            sc.Model.removeObserver(sc.menu, this)
            sc.multiworld.client.items.off("hintReceived", this.newHintReceived.bind(this))
        },
        newHintReceived(hint) {
            // Find out where this hint goes
            const hintCategories = this.hintCategory(hint);
            if (!hintCategories.includes(this.currentTabIndex)) {
                this.blockHint = hint;
                this.switchTab(hintCategories[0]);
                this.blockHint = null;
            }

            const index = 0;
            const entry = new sc.APHintClientEntry(hint, this.currentTabIndex);
            entry.addObservers();
            this.buttons.splice(index, 0, entry);
            this.currentList.insertButton(entry, index, 0.2);
            this.currentList.setScrollY(0, false);
            entry.doNewEffect();
        },
        show(){
            this.parent()
            this.setTab(this.currentTabIndex || 0, true, {skipSounds: true})
            ig.interact.setBlockDelay(0.2)
            this.doStateTransition('DEFAULT')
        },
        hide() {
            this.parent()
            this.doStateTransition('HIDDEN')
        },
        onButtonTraversal() {
            this.parent()
            let b = -1;
            sc.control.menuListDown() ? (b = 1) : sc.control.menuListUp() && (b = 0)
        },
        getCurrentSortText() {
            const sortType = this.tabContent[this.currentTabIndex]
                ? this.tabContent[this.currentTabIndex].sort || HINT_SORT_TYPES.UNSPECIFIED
                : HINT_SORT_TYPES.UNSPECIFIED;

            let key = 'unspecified';
            switch (sortType) {
                case HINT_SORT_TYPES.UNSPECIFIED:
                    key = 'unspecified'
                    break
                case HINT_SORT_TYPES.STATUS:
                    key = 'status'
                    break
                case HINT_SORT_TYPES.PLAYER:
                    key = 'player'
                    break
                case HINT_SORT_TYPES.ITEM_NAME:
                    key = 'itemName'
                    break
            }
            return ig.lang.get(`sc.gui.menu.sort.${key}`);
        },
        onLeftRightPress() {
            return {skipSounds: true}
        },
        onTabChanged(newIndex, prevIndex) {
            sc.BUTTON_SOUND.submit.play()
        },
        onTabButtonCreation(key, index, settings) {
            const button = new sc.ItemTabbedBox.TabButton(
                ig.lang.get(`sc.gui.mw.hint-client.tabs.${key}`),
                index == 0 ? "quest-elite" : "quest-fav",
                120
            );
            button.textChild.setPos(7, 1)
            button.setPos(0, 2)
            button.setData({type: settings.type})
            this.addChildGui(button)
            return button
        },
        onTabPressed(button, wasSame) {
            if (!wasSame) {
                sc.BUTTON_SOUND.submit.play()
                this.setTab(this.getButtonIndex(button))
                for (let i = this.tabArray.length; i--;)
                    if (button == this.tabArray[i]) {
                        sc.menu.setSynoTab(i)
                        break
                    }
                return false
            }
        },
        onTabSelected() {
            sc.menu.setInfoText('', true)
        },
        onTabMouseFocusLost() {
            sc.menu.setInfoText('', true)
        },
        onCreateListEntries(list, buttonGroup, tabIndex, sort) {
            for (const button of this.buttons) {
                button.removeObservers();
            }
            list.setSize(400, 203);
            list.clear();
            this.buttons = [];
            buttonGroup.clear();

            const hints = this.loadHints(tabIndex);
            this.sortList(hints, sort);
            for (const hint of hints) {
                const entry = new sc.APHintClientEntry(hint, tabIndex);
                entry.addObservers();
                this.buttons.push(entry);
                list.addButton(entry)
            }
        },
        loadHints(tabIndex) {
            return sc.multiworld.client.items.hints.filter(hint => {
                if (this.blockHint) {
                    if (this.blockHint.item.sender.slot == hint.item.sender.slot && this.blockHint.item.sender.team == hint.item.sender.team && this.blockHint.item.locationId == hint.item.locationId) {
                        // Block this hint, it will probably be added as part of an animation
                        return false;
                    }
                }
                return this.hintCategory(hint).includes(tabIndex);
            });
        },
        hintCategory(hint) {
            const categories = [];
            if (hint.item.sender.slot != sc.multiworld.client.players.self.slot || hint.item.sender.team != sc.multiworld.client.players.self.team) {
                // Outgoing hint: the sender is offworld
                categories.push(HINT_CATEGORY_TYPES.OUTGOING);
            }
            if (hint.item.sender.slot == sc.multiworld.client.players.self.slot && hint.item.sender.team == sc.multiworld.client.players.self.team) {
                // Incoming hint: we are the sender
                categories.push(HINT_CATEGORY_TYPES.INCOMING);
            }
            return categories;
        },
        onListEntryPressed(button: sc.ListBoxButton) {
            sc.BUTTON_SOUND.submit.play()
            sc.menu.setSynopPressed(button)
        },
        onListMouseFocusLost() {
            sc.menu.setInfoText(null, true)
        },
        sortList(list, sortType) {
            switch (sortType) {
                case HINT_SORT_TYPES.UNSPECIFIED:
                    break;
                case HINT_SORT_TYPES.STATUS: {
                    const statusList = [
                        HintStatuses.priority,
                        HintStatuses.unspecified,
                        HintStatuses.noPriority,
                        HintStatuses.avoid,
                        HintStatuses.found
                    ]
                    list.sort((a, b) => {
                        return statusList.indexOf(a.status) - statusList.indexOf(b.status)
                    })
                    break
                }
                case HINT_SORT_TYPES.PLAYER:
                    list.sort((a, b) => {
                        return a.item.receiver.alias.localeCompare(b.item.receiver.alias)
                    })
                    break
                case HINT_SORT_TYPES.ITEM_NAME:
                    list.sort((a, b) => {
                        return a.item.name.localeCompare(b.item.name)
                    })
                    break
            }

            list.sort((a, b) => {
                // Put found hints at the bottom
                if (a.found == b.found) {
                    return 0;
                } else {
                    return a.found ? -1 : 1;
                }
            })
        },
        modelChanged(model, message, data) {
            model == sc.menu && message == sc.MENU_EVENT.SORT_LIST && this.sort(data.data.sortType)
        },
    })

    sc.APHintClientMenu = sc.ListInfoMenu.extend({
        helpGui: null,
        init() {
            const list = new sc.APHintClientList();
            this.parent(list)
            if (this.list) {
                this.list.hook.pos.x = 0
                this.list.bg.hook.pos.y = this.list.bg.hook.pos.y - 5
                this.list.bg.hook.size.x = 400
                this.list.bg.hook.size.y = this.list.bg.hook.size.y + 5
            }

            this.options = new sc.SortMenu(this.onOptionsExecute.bind(this), this.onOptionsBack.bind(this), 126);
            this.options.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP)
            this.options.setPivot(this.options.hook.size.x / 2, 0)
            this.options.addButton('priority', 0, 0)
            this.options.addButton('noPriority', 1, 1)
            this.options.addButton('avoid', 2, 2)
            this.options.addButton('copy', 3, 3)

            this.hotkeyRequestHint = new sc.ButtonGui(
                `\\i[help2]${ig.lang.get('sc.gui.menu.menu-titles.requestNewHint')}`,
                void 0,
                true,
                sc.BUTTON_TYPE.SMALL
            )
            this.hotkeyRequestHint.keepMouseFocus = true
            this.hotkeyRequestHint.hook.transitions = {
                DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE },
                HIDDEN: {
                    state: { offsetY: -this.hotkeyRequestHint.hook.size.y },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR,
                },
            }
            this.hotkeyRequestHint.onButtonPress = this.onRequestHintButtonPressed.bind(this)
            this.sortMenu.addButton('auto', HINT_SORT_TYPES.UNSPECIFIED, 0)
            this.sortMenu.addButton('hintStatus', HINT_SORT_TYPES.STATUS, 1)
            this.sortMenu.addButton('player', HINT_SORT_TYPES.PLAYER, 2)
            this.sortMenu.addButton('itemName', HINT_SORT_TYPES.ITEM_NAME, 3)
            this.doStateTransition('DEFAULT')
        },
        showMenu() {
            this.parent()

            // @ts-expect-error ListInfoMenu.updateSortMenuButton is not present in types
            this.list && this.updateSortMenuButton(this.list.getCurrentSortText())
        },
        exitMenu() {
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyRequestHint)
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp)
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeySort)
            this.parent()
        },
        onAddHotkeys(b) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, () => sc.control.menuHotkeyHelp())
            sc.menu.buttonInteract.addGlobalButton(this.hotkeySort, () => sc.control.menuHotkeyHelp3())
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyRequestHint, () => sc.control.menuHotkeyHelp2())
            this.commitHotKeysToTopBar(b)
        },
        commitHotKeysToTopBar(b) {
            sc.menu.addHotkey(
                () => this.hotkeyRequestHint
            )
            sc.menu.addHotkey(
                () => this.hotkeySort
            )
            sc.menu.addHotkey(
                () => this.hotkeyHelp
            )
            sc.menu.commitHotkeys(b)
        },
        onRequestHintButtonPressed() {
            const dialog = new sc.APHintClientRequestHintDialog()
            ig.gui.addGuiElement(dialog)
            dialog.show()
        },
        createHelpGui() {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(
                    this,
                    ig.lang.get('sc.gui.mw.hint-client.manual.title'),
                    ig.lang.get('sc.gui.mw.hint-client.manual.pages'),
                    () => {
                        this.commitHotKeysToTopBar(true)
                    },
                    true
                )
                this.helpGui.hook.zIndex = 15e4
                this.helpGui.hook.pauseGui = true
            }
        },
        modelChanged(model, message, data) {
            if (model == sc.menu) {
                if (message == sc.MENU_EVENT.SORT_LIST) {
                    // @ts-expect-error ListInfoMenu.updateSortMenuButton is not present in types
                    this.updateSortMenuButton(data.text)
                } else if (message == sc.MENU_EVENT.SYNO_CHANGED_TAB) {
                    this.sortMenu.active && this.sortMenu.hideSortMenu()
                    // @ts-expect-error ListInfoMenu.updateSortMenuButton is not present in types
                    this.updateSortMenuButton(this.list.getCurrentSortText())
                } else if (message == sc.MENU_EVENT.SYNOP_BUTTON_PRESS) {
                    this.openOptionsMenu(data)
                }
            }
        },
        openOptionsMenu(button) {
            this.hotkeySort.setActive(false)
            this.hotkeyRequestHint.setActive(false)
            const optionsMenu = this.options;
            ig.gui.addGuiElement(optionsMenu)
            const buttonCoordinates = button.hook.screenCoords!;
            const buttonLeft = buttonCoordinates.x;
            let buttonBottom = buttonCoordinates.y + buttonCoordinates.h - 2;
            let optionsHook = optionsMenu.hook;
            if (buttonBottom + optionsHook.size.y > ig.system.height - 26) {
                buttonBottom = buttonCoordinates.y - optionsHook.size.y + 1
                optionsMenu.setPivot(optionsHook.size.x / 2, optionsHook.size.y)
            } else optionsMenu.setPivot(optionsHook.size.x / 2, 0)

            const isOurHint = button.hint.item.receiver.slot == sc.multiworld.client.players.self.slot && button.hint.item.receiver.team == sc.multiworld.client.players.self.team
            optionsMenu.buttons[0].setActive(isOurHint)
            optionsMenu.buttons[1].setActive(isOurHint)
            optionsMenu.buttons[2].setActive(isOurHint)
            optionsMenu.buttons[3].setActive(true)
            button.keepButtonPressed()
            this._keepButtonFocused = button
            optionsMenu.showSortMenuAt(buttonLeft, buttonBottom)
        },
        onOptionsExecute(button) {
            const hintButton = this._keepButtonFocused;
            if (hintButton) {
                hintButton.unPressButton()
                this._keepButtonFocused = null
                const hint = hintButton.hint;
                switch (button.data.sortType) {
                    case 0:
                        // Priority
                        hint.updateStatus(HintStatuses.priority);
                        break;
                    case 1:
                        // No priority
                        hint.updateStatus(HintStatuses.noPriority);
                        break;
                    case 2:
                        // Avoid
                        hint.updateStatus(HintStatuses.avoid);
                        break;
                    case 3: {
                        // Copy
                        let locationName: string;
                        if (hint.entrance == "Vanilla") {
                            locationName = hint.item.locationName;
                        } else {
                            locationName = `${hint.item.locationName} (${hint.entrance})`;
                        }
                        const hintText = `[Hint]: ${hint.item.receiver.alias}'s ${hint.item.name} is at ${locationName} in ${hint.item.sender.alias}'s World.`;
                        void navigator.clipboard.writeText(hintText);
                    }
                }
            }
            this.options.hideSortMenu()
            ig.interact.setBlockDelay(0.2)
            this.onOptionsBack()
        },
        onOptionsBack() {
            if (this._keepButtonFocused) {
                this._keepButtonFocused.unPressButton()
                this._keepButtonFocused = null
            }
            this.hotkeySort.setActive(true)
            this.hotkeyRequestHint.setActive(true)
            if (ig.input.mouseGuiActive) {
                sc.menu.buttonInteract.mouseOverGui = null
                sc.menu.synopInfo = null
            }
        },
    });

    sc.APHintClientRequestHintDialog = ig.GuiElementBase.extend({
        gfx: new ig.Image('media/gui/menu.png'),
        transitions: {
            DEFAULT: { state: { alpha: 1 }, time: 0.2, timeFunction: KEY_SPLINES.EASE_OUT },
            HIDDEN: { state: { alpha: 0 }, time: 0.3, timeFunction: KEY_SPLINES.EASE_IN },
        },
        init() {
            this.parent()
            this.hook.zIndex = 9999999
            this.hook.localAlpha = 0.8
            this.hook.temporary = true
            this.hook.pauseGui = true
            this.hook.size.x = ig.system.width
            this.hook.size.y = ig.system.height

            this.buttonInteract = new ig.ButtonInteractEntry();
            this.buttongroup = new sc.ButtonGroup();
            this.buttonInteract.pushButtonGroup(this.buttongroup);
            this.buttongroup.addPressCallback(() => {});

            const baseDialog = new ig.GuiElementBase()
            baseDialog.setSize(270, 90)

            this.textGui = new sc.TextGui("What do you want to hint for?", { maxWidth: 300 })
            baseDialog.addChildGui(this.textGui)

            this.inputGui = new sc.APUpDownInputField(
                264,
                this.textGui.hook.size.y + 3,
                modmanager.gui.INPUT_FIELD_TYPE.DEFAULT,
                false
            );
            this.inputGui.hook.pos.y = this.textGui.hook.size.y + 3;
            this.buttongroup.addFocusGui(this.inputGui, 0, 0);
            baseDialog.addChildGui(this.inputGui)

            this.hintCostGui = new sc.TextGui(`\\c[4]Hint cost: \\c[0]${sc.multiworld.client.room.hintCost}`, { maxWidth: 300, font: sc.fontsystem.tinyFont })
            this.hintCostGui.hook.pos.y = this.inputGui.hook.pos.y + this.inputGui.hook.size.y + 3;
            baseDialog.addChildGui(this.hintCostGui)

            this.hintPointsGui = new sc.TextGui(`\\c[4]Available Hint points: \\c[0]${sc.multiworld.client.room.hintPoints}`, { maxWidth: 300, font: sc.fontsystem.tinyFont })
            this.hintPointsGui.hook.pos.y = this.hintCostGui.hook.pos.y + this.hintCostGui.hook.size.y + 3;
            baseDialog.addChildGui(this.hintPointsGui)

            this.backButton = new sc.ButtonGui("Cancel", 128)
            this.backButton.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.backButton.setPos(5, 0);
            this.backButton.onButtonPress = this.onBackButtonPress.bind(this);
            this.backButton.submitSound = sc.BUTTON_SOUND.back;
            this.buttongroup.addFocusGui(this.backButton, 2, 0);
            this.buttonInteract.addGlobalButton(this.backButton, sc.control.menuBack);
            baseDialog.addChildGui(this.backButton)

            this.requestButton = new sc.ButtonGui("Request Hint", 128)
            this.requestButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.requestButton.setPos(5, 0);
            this.requestButton.onButtonPress = this.onRequestHint.bind(this);
            this.requestButton.submitSound = sc.BUTTON_SOUND.back;
            this.buttongroup.addFocusGui(this.requestButton, 1, 0);
            baseDialog.addChildGui(this.requestButton)

            this.msgBox = new sc.CenterBoxGui(baseDialog)
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER)
            this.addChildGui(this.msgBox)
            this.doStateTransition('HIDDEN', true)
            this.doStateTransition('DEFAULT')
        },
        show() {
            ig.interact.addEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.msgBox.doStateTransition('DEFAULT')
            this.doStateTransition("DEFAULT");
            sc.model.addChoiceGui(this)
        },
        hide() {
            ig.interact.removeEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.msgBox.doStateTransition('HIDDEN')
            this.doStateTransition("HIDDEN", false, true);
            sc.model.addChoiceGui(this)
        },
        updateDrawables(renderer) {
            renderer.addColor('#000', 0, 0, this.hook.size.x, this.hook.size.y)
        },
        onBackButtonPress() {
            this.hide();
        },
        onRequestHint() {
            const callbacks: {
                messageCallback: (...messages: ap.MessageEvents["userCommand"]) => void,
                hintCallback: (...messages: ap.MessageEvents["itemHinted"]) => void
            } = {
                messageCallback: null!,
                hintCallback: null!,
            };

            this.requestButton.setActive(false);

            callbacks.messageCallback = message => {
                sc.multiworld.client.messages.off("userCommand", callbacks.messageCallback);
                sc.multiworld.client.messages.off("itemHinted", callbacks.hintCallback);
                sc.Dialogs.showErrorDialog(message, true);
                this.requestButton.setActive(true);
            };
            callbacks.hintCallback = (text, item) => {
                sc.multiworld.client.messages.off("userCommand", callbacks.messageCallback);
                sc.multiworld.client.messages.off("itemHinted", callbacks.hintCallback);
                this.hide();
                this.requestButton.setActive(true);
                sc.BUTTON_SOUND.shop_cash.play()
            };
            sc.multiworld.client.messages.on("userCommand", callbacks.messageCallback);
            sc.multiworld.client.messages.on("itemHinted", callbacks.hintCallback);

            sc.multiworld.client.messages.say(`!hint ${this.inputGui.value.join("")}`);
        },
    })


// @ts-expect-error
    sc.MENU_SUBMENU.AP_HINT_CLIENT = 300003;
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.AP_HINT_CLIENT] = {
        Clazz: sc.APHintClientMenu,
        name: "apHintClient",
    };
}
