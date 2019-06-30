'use strict';
import Route from '@ember/routing/route';
import Heirarchy from 'npm:stream-responder-heirarchy';
import Emitter from 'npm:extended-emitter';

var fnHooks ={};
var monitor;
fnHooks.mutate = function(classDefinition, hooks){
    var originalFns = {};
    var mod = {};
    Object.keys(hooks).forEach(function(hookName){
        var proto = classDefinition.prototype;
        originalFns[hookName] = proto[hookName];
        mod[hookName] = function(){
            var res;
            if(!this._super){
                if(originalFns[hookName]){
                    res = originalFns[hookName].apply(this, arguments);
                    hooks[hookName].apply(this, arguments);
                }else{
                    res = hooks[hookName].apply(this, arguments);
                }
            }else{
                this._super.apply(this, arguments);
                res = hooks[hookName].apply(this, arguments);
            }
            if(monitor){
                if(!monitor[hookName]) monitor[hookName] = 1;
                else monitor[hookName]++;
            }
            return res;
        };
    });
    if(classDefinition.reopen){
        //ember class
        classDefinition.reopen(mod);
    }else{
        //js class prototype
        Object.keys(mod).forEach(function(key){
            classDefinition.prototype[key] = mod[key];
        });
    }
}

function routeModification(hooks){
    return fnHooks.mutate(Route, hooks);
}

function eventSimplify(e){
    var res = {};
    res.cased = e.key;
    res.key = e.key.toLowerCase();
    res.keyCode = e.keyCode;
    res.which = e.which;
    res.altKey = e.altKey;
    res.ctrlKey = e.ctrlKey;
    res.shiftKey = e.shiftKey;
    res.metaKey = e.metaKey;
    res.bubbles = true;
    return res;
}

function filterFlag(word){
    var words = Array.isArray(word)?word:[word];
    return function(i){
        var lower = i.toLowerCase();
        return words.reduce(function(agg, value){
            return agg || lower === value.toLowerCase()
        }, false);
    }
}

function handleFlag(word, optList, criterion){
    var flag = (Array.isArray(word)?word:[word])[0];
    var filtered = optList.filter(filterFlag(word));
    if(filtered.length){
        var pos = optList.indexOf(filtered[0]);
        optList.splice(pos, 1);
        var criteria = {};
        criteria[flag] = {"$eq":true};
        criterion.push(criteria);
    }
}

function parseControls(str, mode){
  var res = str.split('|').map(function(word){
    return word.split('+');
  });
  res = res.map(function(arr){
      var ob = {'$and':[]};
      switch(mode){
          case 'keyboard':
              handleFlag(['ctrlKey', 'ctrl', 'control'], arr, ob['$and']);
              handleFlag(['shiftKey', 'shift'], arr, ob['$and']);
              handleFlag(['altKey', 'alt', 'alternate', 'option'], arr, ob['$and']);
              handleFlag(['metaKey', 'meta', 'command'], arr, ob['$and']);
              if(arr.length !== 1) throw new Error('ambiguous definition: '+arr.toString());
              var key = {key:{"$eq":arr[0]}};
              if(ob['$and'].length == 0) return key;
              ob['$and'].push(key);
              break;
          case 'controller':
              while(arr.length>1){
                var criteria = {};
                criteria[arr.shift()] = {"$eq":true};
                ob['$and'].push(criteria)
              }
              ob['$and'].push({button:{"$eq":arr[0]}});

      }
      return ob;
  });
  return res;
}

var Context = {};

function enableRouteInput(){
  Context.inputHeirarchy = new Heirarchy({ eventType : 'input' });
  var stream = new Emitter();

  Route.reopenClass({
      addInputSource : function(source, options){
          Context.inputHeirarchy.tap(options.eventType || options, stream);
          if(source.setHandler){
              source.setHandler(function(buttons, axes, buttonUp, axesUp){
                  Object.keys(buttonUp).forEach(function(releasedButtonName){
                      var ret = JSON.parse(JSON.stringify(buttons));
                      Object.keys(axes).forEach(function(axisName){
                          ret[axisName] = axes[axisName];
                      });
                      ret.button = releasedButtonName;
                      stream.emit(options.eventType || options, ret);
                  });
                  if(options.handler){
                      options.handler(buttons, axes, buttonUp, axesUp);
                  }
              });
          }else{
              source.addEventListener(options.eventType || options, function(e){
                  e.stopPropagation();
                  e.preventDefault();
                  var clone = eventSimplify(e);
                  stream.emit(options.eventType || options, clone);
              });
          }
      },
      bodyInput : function(eventType){
          Route.addInputSource(document.body, (eventType || 'keypress'))
      }
  });
  Route.bodyInput();
  var lastRoute;
  routeModification({
      getHeirarchyNode: function(){
          if(this.inputHeirarchyNode) return this.inputHeirarchyNode;
          var input = this.input?this.input():{};
          var node = new Heirarchy.Node({ eventType : 'input' });
          var route = this;
          if(input.keyboard) Object.keys(input.keyboard).forEach(function(key){
            var conditions = parseControls(key, 'keyboard');
            conditions.forEach(function(condition){
                node.on('input', condition, function(e){
                    if(!node.active) return; //WTF??
                    if(!route.actions[input.keyboard[key]]){
                        throw new Error('no action: '+input.keyboard[key]);
                    }
                    route.actions[input.keyboard[key]].apply(route, [e]);
                })
            });
          });
          if(input.controller) Object.keys(input.controller).forEach(function(key){
            var conditions = parseControls(key, 'controller');
            conditions.forEach(function(condition){
                node.on('input', condition, function(e){
                    var type = e.key?input.keyboard:input.controller;
                    if(!node.active) return; //WTF??
                    if(!route.actions[type[key]]){
                        throw new Error('no action: '+type[key]);
                    }
                    route.actions[type[key]].apply(route, [e]);
                })
            });
          });
          this.inputHeirarchyNode = node;
          Context.inputHeirarchy.add(node);
          return node;
      },
      renderTemplate: function(){
        if(lastRoute){
            lastRoute.setHeirarchyNode(false);
        }
        this.setHeirarchyNode(true);
        lastRoute = this;
      },
      setHeirarchyNode: function(on){
        var node = this.getHeirarchyNode();
        if(!node) return;
        if(on){
          node.activate();
        }else{
          node.deactivate();
        }
      }
  });
}

export function initialize(){
  //console.log('INIT CALLED')
  enableRouteInput();
}

export default {
  initialize,
  setMonitor : function(ob){
    monitor = ob;
  }
};

window.setRouteModMonitor = function(ob){
  monitor = ob;
}
