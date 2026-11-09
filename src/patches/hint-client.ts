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

            sortList(list: ap.Hint[], sortType: HINT_SORT_TYPES): void;
            modelChanged(this: this, model: any, message: any, data: any): void;
            getCurrentSortText(this: APHintClientList): string;
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
            new(hint: ap.Hint, marqueeGroup: codetriangle.marquee.MarqueeGroup): APHintClientEntryLocation;
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

            title: sc.TextGui;
            chapter: sc.APHintClientChapter;
            player: sc.TextGui;
            location: sc.APHintClientEntryLocation;

            hint: ap.Hint;

            keepButtonPressed(this: this): void;
            unPressButton(this: this): void;
        }

        interface APHintClientEntryConstructor extends ImpactClass<sc.APHintClientEntry> {
            new(hint: ap.Hint, tabIndex: number): APHintClientEntry;
        }

        var APHintClientEntry: APHintClientEntryConstructor;
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
        init(hint, marqueeGroup) {
            this.parent(335, 13)
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

            this.setHint(hint)
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
                renderer.addGfx(this.gfx, 0, 0, (index % 2) * 147 + 5, Math.floor(index / 2) * 34, 142, 30)
            } else {
                renderer.addGfx(this.apGfx, 0, 0, (index % 2) * 147 + 5, Math.floor(index / 2) * 34, 142, 30)
            }
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

            this.hint = hint;
            const marqueeGroup = new codetriangle.marquee.MarqueeGroup(true);

            this.chapter = new sc.APHintClientChapter(hint)
            this.addChildGui(this.chapter)

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
            this.addChildGui(marqueeGui);

            const rightLabels = new ig.GuiElementBase();
            rightLabels.setPos(145, 5)
            rightLabels.setSize(47, 30)
            const player = new sc.TextGui(ig.lang.get(`sc.gui.mw.hint-client.hint.${tabIndex == 0 ? "receiver" : "sender"}`), { font: sc.fontsystem.tinyFont })
            player.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP)
            player.setPos(0, 20)
            rightLabels.addChildGui(player)
            this.addChildGui(rightLabels)

            this.player = new sc.TextGui(tabIndex == 0 ? hint.item.receiver.alias : hint.item.sender.alias, { font: sc.fontsystem.smallFont });
            this.player.setPos(195, 21);
            this.addChildGui(this.player)

            this.location = new sc.APHintClientEntryLocation(hint, marqueeGroup)
            this.addChildGui(this.location)
        },
        updateDrawables(renderer) {
            this.ninepatch.draw(renderer, this.hook.size.x, this.hook.size.y, this.focus ? 'focus' : 'default')
            this.ninepatch.draw(renderer, this.hook.size.x, this.hook.size.y, this.focus ? 'hfocus' : 'hdefault', 1)
        },
        keepButtonPressed() {
            this.keepPressed = true
            this.setPressed(true)
        },
        unPressButton() {
            this.keepPressed = false
            this.setPressed(false)
        },
    })

    sc.APHintClientList = sc.ListTabbedPane.extend({
        containerHeightOffset: -26,
        listPosOffset: -6,
        listHeightOffset: 6,
        listPageSize: 25,
        init() {
            this.parent(true)
            this.setSize(400, 216)
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP)
            this.setPivot(0, 216)
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
        },
        removeObservers() {
            sc.Model.removeObserver(sc.menu, this)
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
            const c = new sc.ItemTabbedBox.TabButton(
                ig.lang.get(`sc.gui.mw.hint-client.tabs.${key}`),
                index == 0 ? "quest-elite" : "quest-fav",
                105
            );
            c.textChild.setPos(7, 1)
            c.setPos(0, 2)
            c.setData({type: settings.type})
            this.addChildGui(c)
            return c
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
            list.setSize(400, 203);
            list.clear();
            list.clear();
            buttonGroup.clear();

            const hints = sc.multiworld.client.items.hints.filter(hint => {
                switch (tabIndex) {
                    case HINT_CATEGORY_TYPES.OUTGOING:
                        return hint.item.receiver.slot == sc.multiworld.client.players.self.slot && hint.item.receiver.team == sc.multiworld.client.players.self.team;
                    case HINT_CATEGORY_TYPES.INCOMING:
                        return hint.item.sender.slot == sc.multiworld.client.players.self.slot && hint.item.sender.team == sc.multiworld.client.players.self.team;
                }
            });
            this.sortList(hints, sort);
            for (const hint of hints) {
                list.addButton(new sc.APHintClientEntry(hint, tabIndex))
            }
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
                this.list.bg.hook.size.x = 216
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
            sc.menu.buttonInteract.addGlobalButton(this.hotkeySort, () => sc.control.menuHotkeyHelp2())
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyRequestHint, () => sc.control.menuHotkeyHelp3())
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

// @ts-expect-error
    sc.MENU_SUBMENU.AP_HINT_CLIENT = 300003;
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.AP_HINT_CLIENT] = {
        Clazz: sc.APHintClientMenu,
        name: "apHintClient",
    };
}
