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
      if(!classDefinition.prototype[hookName]){
        mod[hookName] = function(){
          var res = hooks[hookName].apply(this, arguments);
          if(monitor){
            if(!monitor[hookName]) monitor[hookName] = 1;
            else monitor[hookName]++;
          }
          return res;
        };
      }else{
        originalFns[hookName] = classDefinition.prototype[hookName];
        mod[hookName] = function(){
          var res = originalFns[hookName].apply(this, arguments);
          hooks[hookName].apply(this, arguments);
          if(monitor){
            if(!monitor[hookName]) monitor[hookName] = 1;
            else monitor[hookName]++;
          }
          return res;
        };
      }
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

function parseControls(str){
  var res = str.split('|').map(function(word){
    return word.split('+');
  });
  res = res.map(function(arr){
      var ob = {'$and':[]};
      handleFlag(['ctrlKey', 'ctrl', 'control'], arr, ob['$and']);
      handleFlag(['shiftKey', 'shift'], arr, ob['$and']);
      handleFlag(['altKey', 'alt', 'alternate', 'option'], arr, ob['$and']);
      handleFlag(['metaKey', 'meta', 'command'], arr, ob['$and']);
      if(arr.length !== 1) throw new Error('ambiguous definition: '+arr.toString());
      var key = {key:{"$eq":arr[0]}};
      if(ob['$and'].length == 0) return key;
      ob['$and'].push(key);
      return ob;
  });
  return res;
}

var Context = {};

function enableRouteInput(){
  Context.inputHeirarchy = new Heirarchy({ eventType : 'input' });
  var stream = new Emitter();

  /*document.body.addEventListener('keydown', function(e){
      stream.emit('keydown', e);
  });
  document.body.addEventListener('keyup', function(e){
      stream.emit('keyup', e);
  });*/
  document.body.addEventListener('keypress', function(e){
      e.stopPropagation();
      e.preventDefault();
      var clone = eventSimplify(e);
      stream.emit('keypress', clone);
  });
  //Context.inputHeirarchy.tap('keydown', stream);
  //Context.inputHeirarchy.tap('keyup', stream);
  Context.inputHeirarchy.tap('keypress', stream);
  var originalExtend = Route.extend;
  Route.extend = function(){
    if(arguments[0] && arguments[0].input){
      arguments[0].input = Object.freeze(arguments[0].input);
    }
    return originalExtend.apply(this, arguments);
  };
  var lastRoute;
  routeModification({
      getHeirarchyNode: function(){
          if(this.inputHeirarchyNode) return this.inputHeirarchyNode;
          var input = this.input?this.input():{};
          var node = new Heirarchy.Node({ eventType : 'input' });
          var route = this;
          if(input.keyboard) Object.keys(input.keyboard).forEach(function(key){
            var conditions = parseControls(key);
            conditions.forEach(function(condition){
                node.on('input', condition, function(e){
                    if(!node.active) return; //WTF??
                    if(!route.actions[input.keyboard[key]]){
                        throw new Error('no action: '+input.keyboard[key]);
                    }
                    route.actions[input.keyboard[key]].apply(this, [e]);
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
