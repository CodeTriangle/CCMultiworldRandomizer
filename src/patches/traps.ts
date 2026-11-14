import * as ap from "archipelago.js";
import MwRandomizer from "../plugin";

let trapenemy_settings = {};
trapenemy_settings.type = "trap-dummy";
let trapenemy = null

export function sendTrap(item: ap.Item){
  switch(item.name) {
    case "Forgetfulness Trap":
      sc.model.player.exp = 0;
      break;
    case "Naked Trap":
      sc.model.player.setEquipment(1,-1);
      sc.model.player.setEquipment(2,-1);
      sc.model.player.setEquipment(3,-1);
      sc.model.player.setEquipment(4,-1);
      sc.model.player.setEquipment(5,-1);
      break;
    case "Poverty Trap":
      sc.model.player.credit = Math.floor(sc.model.player.credit * 0.8);
      break;
    case "Overload Trap":
      sc.model.player.addElementLoad(200);
      break;
    case "Override Trap":
      sc.model.player.resetSkillTree(0);
      sc.model.player.resetSkillTree(1);
      sc.model.player.resetSkillTree(2);
      sc.model.player.resetSkillTree(3);
      sc.model.player.resetSkillTree(4);
      break;
    case "Bomb Trap":
      ig.game.events.callEvent( new ig.Event( {name: "Bombing Trap", steps: [ { type: "WAIT", time: 0.1 }, { type: "SPAWN_ENEMY", "position": { "x": 0, "y": 0, "z": 2000 }, "enemyInfo": { "type": "trap-dummy" }, "targetPlayer": false, "name": "trap-master", "startAction": [ { "type": "DO_ENEMY_ACTION", "actionName": "Bombing" } ] }, { type: "WAIT", time: 0.1 } ] }), ig.EventRunType.PARALLEL);
      break;
    case "Laser Of Doom Trap":
      ig.game.events.callEvent( new ig.Event( { name: "Laser of Doom Trap", steps: [ { type: "WAIT", time: 0.1 }, { type: "SPAWN_ENEMY", "position": { "x": 0, "y": 0, "z": 12000 }, "enemyInfo": { "type": "trap-dummy" }, "targetPlayer": false, "name": "trap-master", "startAction": [ { "type": "DO_ENEMY_ACTION", "actionName": "Laser", "noStateReset": true } ] }, { type: "WAIT", time: 5 } ] }), ig.EventRunType.PARALLEL);
      break;
    case "Zoom Trap":
    case "Zoom Out Trap":
      let zoom = 4;
      if (item.name == "Zoom Out Trap") { zoom = 0.25; }
      ig.game.events.callEvent(new ig.Event({ name:'Zoom Event Trap', steps: [ { type: 'WAIT', time: 0.5 },{ type: 'SET_CAMERA_TARGET', entity: { "player": true } }, { type: 'SET_CAMERA_ZOOM', zoom: zoom, duration: 10, transition: 'EASE_IN_OUT' }, { type: 'WAIT', time: 10 }, ], }), ig.EventRunType.PARALLEL);
      break;
    case "Winded Trap":
      sc.model.player.params.addTrapDebuff(["DASH-STEP-MINUS"],30,-1);
      break;
    case "Clumsy Trap":
      sc.model.player.params.addTrapDebuff(["NO-DASH"],30,-1);
      break;
    case "Artless Trap":
      sc.model.player.params.addTrapDebuff(["LOW-SP-REGEN"],30,-1);
      break;
    case "Drunk Trap":
      sc.model.player.params.addTrapDebuff(["DRUNK"],30,-1);
      break;
    case "Burglar's Rope Trap":
      sc.model.player.params.addTrapDebuff(["ZERO-XP"],30,-1);
      break;
    case "Slip Trap":
      sc.model.player.params.addTrapDebuff(["SLIP"],30,-1);
      break;
    case "Voidout Trap":
      sc.model.player.params.addTrapDebuff(["VOIDOUT"],30,-1);
      break;
    case "Prepare to Hi Trap":
      // ig.game.events.callEvent(new ig.Event({ name:'OHKO Trap', steps: [ { type: 'WAIT', time: 1 },{ type: "REGEN_HP", target: { "player": true }, value: -1, showNumbers: true}] }), ig.EventRunType.PARALLEL);
      sc.model.player.params.addTrapDebuff(["INSTADEATH"],30,-1);
      break;
    case "Combo Breaker Trap":
      // this one is still clunky, only updates after finishing a rank level
      sc.model.combatRank = 0;
      sc.model.increaseCombatRank(0);
      break;
    case "Ice Cage Trap":
      ig.game.events.callEvent(new ig.Event( {name: "Ice Cage Trap", steps: [ { type: "WAIT", time: 0.1 }, { type: "SPAWN_ICE_CAGE", "desType": "iceBlock", "time": 15 }, { type: "WAIT", time: 1 } ] }), ig.EventRunType.INTERRUPTABLE);
      break;
    case "Element Swap Trap":
      sc.model.player.scrollElementMode(Math.floor(Math.random()*3-1),false,false);
      break;
    case "Landmark Trap":
      for (let area of Object.keys(sc.map.activeLandmarks)) {
        for (let landmark of Object.keys(sc.map.activeLandmarks[area])) {
          if (sc.map.activeLandmarks[area][landmark].active) { sc.map.activeLandmarks[area][landmark].active = false; }
        }
      }
      break;
    case "SP Trap":
      sc.model.player.params.consumeSp(sc.model.player.spLevel*4);
      break;
    case "Failed Hack Trap":
      ig.game.events.callEvent(new ig.Event({ name:'Failed Hack Trap', steps: [ { type: 'WAIT', time: 1 },{ "entity": { "player": true }, "action": [ { "duration": -1, "align": "BOTTOM", "rotateFace": 0, "flipLeftFace": false, "wait": false, "waitSkip": 0, "actionDetached": false, "fixPos": false, "type": "SHOW_EFFECT", "effect": { "sheet": "area.arid", "name": "hackDashCharge" }, "offset": { "x": 0, "y": 0, "z": 0 } }, { "value": 96, "type": "SET_FLOAT_HEIGHT" }, { "time": 0.5, "type": "WAIT" } ], "repeating": false, "wait": true, "keepState": false, "immediately": false, "type": "DO_ACTION" }, { "entity": { "player": true }, "action": [ { "value": 96, "type": "SET_FLOAT_HEIGHT" }, { "duration": -1, "align": "BOTTOM", "rotateFace": 0, "flipLeftFace": false, "wait": false, "waitSkip": 0, "actionDetached": false, "fixPos": false, "type": "SHOW_EFFECT", "effect": { "sheet": "area.arid", "name": "hackDashCharge2" }, "offset": { "x": 0, "y": 0, "z": 0 } }, { "wait": false, "viaWalkConfig": false, "type": "SHOW_ANIMATION", "anim": "specialSwirlEndTop" }, { "time": 1, "type": "WAIT" } ], "repeating": false, "wait": true, "keepState": false, "immediately": false, "type": "DO_ACTION" }, { "entity": { "player": true }, "action": [ { "duration": -1, "align": "BOTTOM", "rotateFace": 0, "flipLeftFace": false, "wait": false, "waitSkip": 0, "actionDetached": false, "fixPos": false, "type": "SHOW_EFFECT", "effect": { "sheet": "area.arid", "name": "hackDash" }, "offset": { "x": 0, "y": 0, "z": 0 } }, { "wait": false, "type": "SHOW_EXTERN_ANIM", "anim": { "sheet": "player-poses", "name": "drill" } }, { "value": 0, "type": "SET_FLOAT_HEIGHT" }, { "value": -800, "type": "SET_Z_VEL" }, { "type": "WAIT_UNTIL_ON_GROUND" } ], "repeating": false, "wait": true, "keepState": false, "immediately": false, "type": "DO_ACTION" }, { "entity": { "player": true }, "action": [ { "wait": false, "type": "SHOW_EXTERN_ANIM", "anim": { "sheet": "player-poses", "name": "floored" } }, { "duration": 0, "align": "BOTTOM", "rotateFace": 0, "flipLeftFace": false, "wait": false, "waitSkip": 0, "actionDetached": false, "fixPos": false, "type": "SHOW_EFFECT", "effect": { "sheet": "area.arid", "name": "hackFail" }, "offset": { "x": 0, "y": 0, "z": 0 } }, { "time": 0.4, "type": "WAIT" }, { "duration": 0, "align": "BOTTOM", "rotateFace": 0, "flipLeftFace": false, "wait": true, "waitSkip": 0, "actionDetached": false, "fixPos": false, "type": "SHOW_EFFECT", "effect": { "sheet": "dust", "name": "large" }, "offset": { "x": 0, "y": 0, "z": 0 } }, { "time": 1, "type": "WAIT" } ], "repeating": false, "wait": true, "keepState": false, "immediately": false, "type": "DO_ACTION" }, ] }), ig.EventRunType.PARALLEL);
      break;
    case "Full Course Trap":
      // add sounds
      ig.game.events.callEvent(new ig.Event({ name:'Full Course Trap', steps: [{ type: 'WAIT', time: 1 }, { type: "DO_ACTION", entity: { "player": true }, action: [{ type: 'SHOW_ANIMATION', entity: { "player": true }, anim: "itemFetch", followUp:"itemEatSlow", wait: true},{ type: 'SHOW_ANIMATION', entity: { "player": true }, anim: "itemEatSlow", followUp:"itemEffect", wait: true},{ type: 'SHOW_ANIMATION', entity: { "player": true }, anim: "itemEatSlow", followUp:"itemEffect", wait: true},{ type: 'SHOW_ANIMATION', entity: { "player": true }, anim: "itemEatSlow", followUp:"itemEffect", wait: true},{ type: 'SHOW_ANIMATION', entity: { "player": true }, anim: "itemEffect", followUp:"itemEffectLoop", wait: true}]}, { type: 'WAIT', time: 5 }, ], }), ig.EventRunType.PARALLEL);
      break;
    case "Blocked Trap":
      ig.game.events.callEvent(new ig.Event({ name:'Sergey Trap', steps: [ { "ignoreSlowDown": false, "time": 0.8, "type": "WAIT" }, { "message": { "en_US": "Lea!", "de_DE": "Lea!", "fr_FR": "fr_FR", "langUid": 4059, "zh_CN": "\u770b\u6837\u5b50\u8fd9\u4e9b\u666e\u901a\u7684\u4efb\u52a1NPC\u8fd8\u6ca1\u6709\u66f4\u52a0\u7ec6\u81f4\u7684\u53cd\u5e94\u3002", "ja_JP": "\u3069\u3046\u3084\u3089\u904b\u55b6\u306f\u307e\u3060\u3001\u6a19\u6e96\u7684\u306a\u30af\u30a8\u30b9\u30c8\u7528NPC\u306b\n\u7e4a\u7d30\u306a\u53d7\u3051\u7b54\u3048\u306f\u5b9f\u88c5\u3057\u3066\u306a\u3044\u307f\u305f\u3044\u3060\u306d\u3002", "ko_KR": "\uc544\uc9c1 \uc77c\ubc18 \ud018\uc2a4\ud2b8 NPC\ub4e4\uc5d0\uac8c \ub354 \uadf8\ub7f4\uc2f8\ud55c \ub300\uc751\uc744 \uc785\ub825\ud558\uc9c0 \uc54a\uc740 \uac83 \uac19\uad70.", "zh_TW": "\u770b\u6a23\u5b50\u9019\u4e9b\u666e\u901a\u7684\u4efb\u52d9NPC\u9084\u6c92\u6709\u66f4\u52a0\u7d30\u7dfb\u7684\u53cd\u61c9\u3002" }, "person": { "person": "main.sergey", "expression": "JOKING" }, "type": "SHOW_SIDE_MSG" }, { "message": { "en_US": "...", "de_DE": "...", "fr_FR": "fr_FR", "langUid": 4131, "zh_CN": "\u2026", "ja_JP": "...", "ko_KR": "...", "zh_TW": "\u2026" }, "person": { "person": "main.lea", "expression": "SHOCKED" }, "type": "SHOW_SIDE_MSG" }, { "message": { "en_US": "I've got good news for you.", "de_DE": "Als h\u00e4tten diese einfachen Quest-NPCs immer noch keine ausgefeilteren Antworttexte bekommen.", "fr_FR": "fr_FR", "langUid": 4059, "zh_CN": "\u770b\u6837\u5b50\u8fd9\u4e9b\u666e\u901a\u7684\u4efb\u52a1NPC\u8fd8\u6ca1\u6709\u66f4\u52a0\u7ec6\u81f4\u7684\u53cd\u5e94\u3002", "ja_JP": "\u3069\u3046\u3084\u3089\u904b\u55b6\u306f\u307e\u3060\u3001\u6a19\u6e96\u7684\u306a\u30af\u30a8\u30b9\u30c8\u7528NPC\u306b\n\u7e4a\u7d30\u306a\u53d7\u3051\u7b54\u3048\u306f\u5b9f\u88c5\u3057\u3066\u306a\u3044\u307f\u305f\u3044\u3060\u306d\u3002", "ko_KR": "\uc544\uc9c1 \uc77c\ubc18 \ud018\uc2a4\ud2b8 NPC\ub4e4\uc5d0\uac8c \ub354 \uadf8\ub7f4\uc2f8\ud55c \ub300\uc751\uc744 \uc785\ub825\ud558\uc9c0 \uc54a\uc740 \uac83 \uac19\uad70.", "zh_TW": "\u770b\u6a23\u5b50\u9019\u4e9b\u666e\u901a\u7684\u4efb\u52d9NPC\u9084\u6c92\u6709\u66f4\u52a0\u7d30\u7dfb\u7684\u53cd\u61c9\u3002" }, "person": { "person": "main.sergey", "expression": "JOKING" }, "type": "SHOW_SIDE_MSG" }, { "message": { "en_US": "Seems I was able to prevent a really inconvenient trap from happening.", "de_DE": "Na ja, das kommt uns gelegen.", "fr_FR": "fr_FR", "langUid": 4129, "zh_CN": "\u55ef\uff0c\u8fd9\u5bf9\u6211\u4eec\u6765\u8bf4\u662f\u597d\u6d88\u606f\u3002", "ja_JP": "\u307e\u3042\u3001\u50d5\u3089\u306b\u3068\u3063\u3066\u306f\u3044\u3044\u30cb\u30e5\u30fc\u30b9\u3060\u3088\u3002", "ko_KR": "\ubb50, \uc6b0\ub9ac\uc5d0\uac90 \uc88b\uc740 \uc77c\uc774\uc9c0\ub9cc.", "zh_TW": "\u55ef\uff0c\u9019\u5c0d\u6211\u5011\u4f86\u8aaa\u662f\u597d\u6d88\u606f\u3002" }, "person": { "person": "main.sergey", "expression": "AWAY" }, "type": "SHOW_SIDE_MSG" }, { "message": { "en_US": "...", "de_DE": "...", "fr_FR": "fr_FR", "langUid": 5402, "zh_CN": "\u2026", "ja_JP": "...", "ko_KR": "...", "zh_TW": "\u2026" }, "person": { "person": "main.lea", "expression": "ANNOYED" }, "type": "SHOW_SIDE_MSG" }, { "message": { "en_US": "Yes, I am sorry.\\.", "de_DE": "Ja, es tut mir leid.\\.", "fr_FR": "fr_FR", "langUid": 4132, "zh_CN": "\u597d\u5427\uff0c\u5bf9\u4e0d\u8d77\u3002\\.\u6211\u4f1a\u52aa\u529b\u89e3\u51b3\u8fd9\u4e2a\u95ee\u9898\u7684\u3002", "ja_JP": "\u3042\u3042\u3001\u3054\u3081\u3093\u306d\u3002\n\\.\u305d\u306e\u4ef6\u306b\u3064\u3044\u3066\u306f\u4eca\u3082\u9811\u5f35\u3063\u3066\u308b\u3088\u3002", "ko_KR": "\uadf8\ub798, \ubbf8\uc548\ud574.\\. \uacc4\uc18d \uc791\uc5c5\ud574 \ubcfc\uac8c.", "zh_TW": "\u597d\u5427\uff0c\u5c0d\u4e0d\u8d77\u3002\\.\u6211\u6703\u52aa\u529b\u89e3\u6c7a\u9019\u500b\u554f\u984c\u7684\u3002" }, "person": { "person": "main.sergey", "expression": "ROLL_EYES" }, "type": "SHOW_SIDE_MSG" }] }), ig.EventRunType.PARALLEL);
      break;
    case "Death Trap":
      ig.game.events.callEvent(new ig.Event({ name:'Death Trap', steps: [ { type: 'WAIT', time: 0.5 },{ type: "MANUAL_COMBATANT_KILL", entity: { "player": true }}] }), ig.EventRunType.PARALLEL);
      break;
    case "Rotate Trap":
      $("#game").css('transform', 'rotate(' + 180 + 'deg)');
      setTimeout(() => {$("#game").css('transform', 'rotate(' + 0 + 'deg)')}, 5000);
      break;
    case "Full Rotate Trap":
      $("#game").css('transform', 'rotate(' + Math.random() * 360 + 'deg)');
      setTimeout(() => {$("#game").css('transform', 'rotate(' + 0 + 'deg)')}, 5000);
      break;
  }
}
export function patch(plugin: MwRandomizer) {
  sc.STAT_CHANGE_SETTINGS["DASH-STEP-MINUS"] = {
    change: sc.STAT_CHANGE_TYPE.MODIFIER,
    type: sc.STAT_PARAM_TYPE.DASH_STEP,
    value: -1,
    icon: "stat-dash",
    grade: "stat-rank-down-3",
  };
  sc.STAT_CHANGE_SETTINGS["NO-DASH"] = {
    change: sc.STAT_CHANGE_TYPE.MODIFIER,
    type: sc.STAT_PARAM_TYPE.DASH_STEP,
    value: -10,
    icon: "stat-dash",
    grade: "stat-rank-down-3",
  };
  sc.STAT_CHANGE_SETTINGS["LOW-SP-REGEN"] = {
    change: sc.STAT_CHANGE_TYPE.MODIFIER,
    type: sc.STAT_PARAM_TYPE.SP_REGEN,
    value: -1,
    icon: "stat-sp-regen",
    grade: "stat-rank-down-3",
  };
  sc.STAT_CHANGE_SETTINGS["LOW-HP"] = {
    change: sc.STAT_CHANGE_TYPE.STATS,
    type: sc.STAT_PARAM_TYPE.HP,
    value: 0.1,
    icon: "stat-hp",
    grade: "stat-rank-down-3",
  };
  sc.STAT_CHANGE_SETTINGS["DRUNK"] = {
    change: sc.STAT_CHANGE_TYPE.MODIFIER,
    type: { key: "AIM_SPEED" },
    value: -2,
    icon: "stat-overheat",
    grade: "stat-rank-down-3",
  };
  sc.STAT_CHANGE_SETTINGS["ZERO-XP"] = {
    change: sc.STAT_CHANGE_TYPE.MODIFIER,
    type: { key: "XP_ZERO" },
    value: 1,
    icon: "stat-overheat",
    grade: "stat-rank-down-3",
  };
  sc.STAT_CHANGE_SETTINGS["SLIP"] = {
    change: sc.STAT_CHANGE_TYPE.MODIFIER,
    type: { key: "SLIP" },
    value: 1,
    icon: "stat-dash",
    grade: "stat-rank-down-3",
  };
  sc.STAT_CHANGE_SETTINGS["VOIDOUT"] = {
    change: sc.STAT_CHANGE_TYPE.MODIFIER,
    type: { key: "VOIDOUT" },
    value: 1,
    icon: "stat-dash",
    grade: "stat-rank-down-3",
  };
  sc.STAT_CHANGE_SETTINGS["INSTADEATH"] = {
    change: sc.STAT_CHANGE_TYPE.MODIFIER,
    type: { key: "INSTADEATH" },
    value: 1,
    icon: "stat-hp",
    grade: "stat-rank-down-3",
  };

  //thank you epicyoshimaster
  ig.ActorEntity.inject({
    update(...args) {
      if(this.isPlayer && this.params.getModifier("SLIP")) {
        this.jumpingEnabled = false;
        
        if(sc.model.isCutscene()) {
          this.jumpingEnabled = true;
        }
      }

      this.parent(...args);
    },

    onFallFromEdge(...args) {
      if(this.isPlayer && this.params.getModifier("SLIP")) {
        this.jumpingEnabled = false;
        
        if(sc.model.isCutscene()) {
          this.jumpingEnabled = true;
        }
      }

      this.parent(...args);
    }
  });
  //trap debuff via item buff system
  sc.CombatParams.inject({
    debuffs: [],
    addTrapDebuff: function (a, b, c) {
      a = new sc.ItemBuff(a, b, c);

      return this.addDebuff(a);
    },
    addDebuff: function (a) {
      var b = this.getStat("hp") - this.currentHp;
      this.buffs.push(a);
      this.currentHp = this.getStat("hp") - b;
      sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.BUFF_ADDED, a);
      sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED);
      return true;
    },
    removeDebuff: function (a) {
      var b = this.getStat("hp") - this.currentHp;
      this.buffs.erase(a);
      this.currentHp = this.getStat("hp") - b;
      a.clear();
      sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.BUFF_REMOVED, a);
      sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED);
    },
  });

  // oneshot on falling into void when voidout trap is active
  ig.ENTITY.Combatant.inject({
    quickFall(...args) {
        if (this.isPlayer && this.params && this.params.getModifier("VOIDOUT")) { 
          this.fallDmgFactor = 1
        }
        else { 
          this.fallDmgFactor = 0.1
        }
      this.parent(...args);
    }
  });
  //this inject might be problematic, but hopefully not
  ig.ENTITY.Player.inject({
    onPreDamageModification(...args) {
      if (args[4] && args[5] != sc.SHIELD_RESULT.PERFECT && this.params.getModifier("INSTADEATH") ) {
        args[4].damage = Math.max(args[4].damage, this.params.currentHp || 1);
      }
      else {
        this.parent(args);
      }
    }
  });
  ig.EVENT_STEP.SPAWN_ICE_CAGE = ig.EventStepBase.extend({
    time: 0,
    _timer: 0,
    destroyed: false,
    ignoreSlowDown: true,
    destructible: null,
    _wm: new ig.Config({
      attributes: {
        // position: { _type: "Vec3", _info: "spawn point", _visualize: true, _pointSelect: true, },
        desType: { _type: "String", _info: "Type of destructible object", _select: sc.DESTRUCTIBLE_TYPE, _withNull: true, },
        onDestructIncrease: { _type: "VarName", _info: "Variable to increase by one when destroyed", _optional: true, },
        onPreDestructIncrease: { _type: "VarName", _info: "Variable to increase by one when destroyed", _optional: true, },
        effect: { _type: "Effect", _info: "Optional Effect", _optional: true, _popup: true, },
        time: { _type: "NumberExpression", _info: "Time to wait in seconds" },
      },
    }),
    init: function (a) {
      assertContent(a, "time");
      // this.position = a.position;
      if (ig.game.playerEntity) { this.position = ig.game.playerEntity.getAlignedPos(); }
      else { this.position = Vec3.create() }
      this.desType = a.desType;
      this.onDestructIncrease = a.onDestructIncrease;
      this.onPreDestructIncrease = a.onPreDestructIncrease;
      if (a.effect) this.effect = new ig.EffectHandle(a.effect);
      this.time = a.time;
      this.ignoreSlowDown = a.ignoreSlowDown || false;
    },
    start: function () {
      var a = ig.Event.getVec3(this.position, Vec3.create()), a = ig.game.spawnEntity( ig.ENTITY.Destructible, a.x - 12+32, a.y - 12, 300, { desType: this.desType, permaDestruct: false, blockNavMap: true, onDestructIncrease: this.onDestructIncrease, onPreDestructIncrease: this.onPreDestructIncrease, }, false );
      var b = ig.Event.getVec3(this.position, Vec3.create()), b = ig.game.spawnEntity( ig.ENTITY.Destructible, b.x - 12-32, b.y - 12, 300, { desType: this.desType, permaDestruct: false, blockNavMap: true, onDestructIncrease: this.onDestructIncrease, onPreDestructIncrease: this.onPreDestructIncrease, }, false );
      var c = ig.Event.getVec3(this.position, Vec3.create()), c = ig.game.spawnEntity( ig.ENTITY.Destructible, c.x - 12, c.y - 12+32, 300, { desType: this.desType, permaDestruct: false, blockNavMap: true, onDestructIncrease: this.onDestructIncrease, onPreDestructIncrease: this.onPreDestructIncrease, }, false );
      var d = ig.Event.getVec3(this.position, Vec3.create()), d = ig.game.spawnEntity( ig.ENTITY.Destructible, d.x - 12, d.y - 12-32, 300, { desType: this.desType, permaDestruct: false, blockNavMap: true, onDestructIncrease: this.onDestructIncrease, onPreDestructIncrease: this.onPreDestructIncrease, }, false );
      this.effect && this.effect.spawnOnTarget(a) && this.effect.spawnOnTarget(b) && this.effect.spawnOnTarget(c) && this.effect.spawnOnTarget(d);
      this.destructibles = [a,b,c,d];
      this._timer = ig.Event.getExpressionValue(this.time); 
    },
    run: function (a) {
      this._timer = this._timer - (this.ignoreSlowDown ? ig.system.actualTick : ig.system.tick);
      return this._timer <= 0 && !this.destroyed && this.destroy();
    },
    destroy: function (a) {
      this.destroyed = true;
      for (let dest of this.destructibles) {
        var c = ig.Event.getEntity(dest, Vec3.create());
        c && c.startDestruction && c.startDestruction();
      }
    }
  });
}