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

function compareDates(a,b) {
        // Compare two dates (could be of any type supported by the convert
        // function above) and returns:
        //  -1 : if a < b
        //   0 : if a = b
        //   1 : if a > b
        // NaN : if a or b is an illegal date
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(a=convertDate(a).valueOf()) &&
            isFinite(b=convertDate(b).valueOf()) ?
            (a>b)-(a<b) :
            NaN
        );
    }

    function convertDate(d) {
            // Converts the date in d to a date-object. The input can be:
            //   a date object: returned without modification
            //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
            //   a number     : Interpreted as number of milliseconds
            //                  since 1 Jan 1970 (a timestamp)
            //   a string     : Any format supported by the javascript engine, like
            //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
            //  an object     : Interpreted as an object with year, month and date
            //                  attributes.  **NOTE** month is 0-11.
            return (
                d.constructor === Date ? d :
                d.constructor === Array ? new Date(d[0],d[1],d[2]) :
                d.constructor === Number ? new Date(d) :
                d.constructor === String ? new Date(d) :
                typeof d === "object" ? new Date(d.year,d.month,d.date) :
                NaN
            );
        }

function parseControls(str, mode){
  var res = str.split('|').map(function(word){
    return word.split('+');
  });
  res = res.map(function(arr){
      var ob = {'$and':[]};
      var criteria;
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
                criteria = {};
                criteria[arr.shift()] = {"$eq":true};
                ob['$and'].push(criteria)
              }
              ob['$and'].push({button:{"$eq":arr[0]}});
              break;
          case 'cardswipe':
            ob['$and'].push({track_one:{"$exists":true}});
            ob['$and'].push({track_two:{"$exists":true}});
            arr.pop();
            while(arr.length>0){
                criteria = {};
                criteria[arr.shift()] = {"$eq":true};
                ob['$and'].push(criteria)
            }
            break;
        case 'barcodescanner':
            while(arr.length>1){
              criteria = {};
              criteria[arr.shift()] = {"$exists":true};
              ob['$and'].push(criteria)
          }
            ob['$and'].push({scan:{"$exists":true}});
            break;
      }
      return ob;
  });
  return res;
}

var Context = {};
var inputInitialized = false;
var inputListeners = [];

function enableRouteInput(){
  Context.inputHeirarchy = new Heirarchy({ eventType : 'input' });
  var stream = new Emitter();
console.log('##################', Route.setInputSource)
  Route.reopenClass({
      addInputSource : function(source, opts){
          var options = opts || {}
          Context.inputHeirarchy.tap(options.eventType || options, stream);
          if(source.setHandler){ //gamepad
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
              if(source.Scanner && source.stdIn && source.fake){ //card-swipe
                  var Swipe = source;
                  var el = options.el || document.body;
                  var scanner = new Swipe.Scanner();
                  new Swipe({
                      scanner : scanner,
                      onScan : function(swipeData){
                          if(!(swipeData && swipeData.track_one && swipeData.track_two)) return;
                          stream.emit(options.eventType || options, swipeData);
                          swipeData.expired = compareDates(swipeData.expiration, new Date()) < 0;
                          swipeData.valid = !swipeData.expired;
                          swipeData[swipeData.type.toLowerCase()] = true;
                          stream.emit(options.eventType || options, swipeData);
                      }
                  });
                  var keylistener = function(e){
                      scanner.input(e.key);
                  };
                  inputListeners.push({
                      type : options.keyboardEventType || 'keypress',
                      listener : keylistener,
                      source : source
                  });
                  el.addEventListener(options.keyboardEventType || 'keypress', keylistener);
              }else{
                  if(source.prototype && source.prototype.deviceList && source.prototype.listen){
                        var scannerInstance = new source({
                            name : 'barcode',
                            emitter: source.electronBridge()
                        });
                        source.default(scannerInstance);
                        var scannerId = localStorage.getItem('last-used-barcode-scanner');
                        if(scannerId){
                            scannerInstance.listen(scannerId, function(scan){
                                var event = {scan:scan};
                                event.upc = (parseInt(scan)+'').length == 12;
                                event.ean13 = (parseInt(scan)+'').length == 13;
                                event.upcA = event.ean13;
                                event.ean8 = (parseInt(scan)+'').length == 8;
                                event.ean = event.ean8 || event.ean13;
                                event.code128 = (scan.length == 13) &&
                                    ((parseInt(scan)+'').length !== 13)
                                event.codabar = (parseInt(scan)+'').length == 14;
                                stream.emit(options.eventType || options, event);
                            });
                        }
                  }else{
                      var barcodelistener = function(e){
                          e.stopPropagation();
                          e.preventDefault();
                          var clone = eventSimplify(e);
                          stream.emit(options.eventType || options, clone);
                      }
                      inputListeners.push({
                          type : options.keyboardEventType || 'keypress',
                          listener : barcodelistener,
                          source : source
                      });
                      source.addEventListener(options.eventType || options, barcodelistener);
                  }
              }
          }
      },
      bodyInput : function(eventType){
          setTimeout(function(){
              Route.addInputSource(document.body, (eventType || 'keypress'))
          }, 100);
      },
      clearInput : function(eventType){
          //remove all the contexts, mainly for testing teardown
          inputListeners.forEach(function(l){
              l.source.removeEventListener(l.type, l.listener)
          })
          Context.inputHeirarchy = new Heirarchy({ eventType : 'input' });
      }
  });
  var lastRoute;
  console.log('###########t#######', Route.prototype.getHeirarchyNode)
  routeModification({
      getHeirarchyNode: function(){
          console.log('GHN', this.inputHeirarchyNode);
          if(this.inputHeirarchyNode) return this.inputHeirarchyNode;
          var input = this.input?this.input():{};
          var node = new Heirarchy.Node({ eventType : 'input' });
          var route = this;
          if(inputInitialized){
              console.log('##########INIT', Route.prototype.getHeirarchyNode)
              if(input.keyboard) Object.keys(input.keyboard).forEach(function(key){
                var conditions = parseControls(key, 'keyboard');
                conditions.forEach(function(condition){
                    node.on('input', condition, function(e){
                        if(!e.key) return;
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
                        if(!e.button) return;
                        var type = input.controller;
                        if(!node.active) return; //WTF??
                        if(!route.actions[type[key]]){
                            throw new Error('no action: '+type[key]);
                        }
                        route.actions[type[key]].apply(route, [e]);
                    })
                });
              });
              if(input.cardswipe) Object.keys(input.cardswipe).forEach(function(key){
                var conditions = parseControls(key, 'cardswipe');
                conditions.forEach(function(condition){
                    node.on('input', condition, function(e){
                        if(!e.account) return;
                        var type = input.cardswipe;
                        if(!node.active) return; //WTF??
                        if(!route.actions[type[key]]){
                            throw new Error('no action: '+type[key]);
                        }
                        route.actions[type[key]].apply(route, [e]);
                    })
                });
              });
              if(input.barcodescanner) Object.keys(input.barcodescanner).forEach(function(key){
                var conditions = parseControls(key, 'barcodescanner');
                conditions.forEach(function(condition){
                    node.on('input', condition, function(e){
                        if(!e.scan) return;
                        var type = input.barcodescanner;
                        if(!node.active) return; //WTF??
                        if(!route.actions[type[key]]){
                            throw new Error('no action: '+type[key]);
                        }
                        route.actions[type[key]].apply(route, [e]);
                    })
                });
              });
              inputInitialized = true;
          }
          this.inputHeirarchyNode = node;
          Context.inputHeirarchy.add(node);
          return node;
      },
      renderTemplate: function(a, b, c){
          console.log('render template!', a, b, c)
        if(lastRoute === this) return;
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
