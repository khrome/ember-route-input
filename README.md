ember-route-input
==============================================================================

[![NPM version](https://img.shields.io/npm/v/ember-route-input.svg)]()
[![npm](https://img.shields.io/npm/dt/ember-route-input.svg)]()

An Ember addon to set input (controls which map to a [`ember-route-action-helper`](https://github.com/dockyard/ember-route-action-helper)), allowing simple input bindings which scope only to the route they are defined in and require no other hooks or bindings.

Installation
------------------------------------------------------------------------------
Requires: [`ember-route-action-helper`](https://github.com/dockyard/ember-route-action-helper), [`ember-browserify`](https://www.npmjs.com/package/ember-browserify), [`stream-responder-heirarchy`](https://github.com/khrome/stream-responder-heirarchy), [`extended-emitter`](https://github.com/khrome/extended-emitter)

and optionally supports controllers through [`mappable-gamepad`](https://www.npmjs.com/package/mappable-gamepad) and magnetic card swipes through [`card-swipe`](https://www.npmjs.com/package/card-swipe)

```
ember install ember-route-input
```


Usage
------------------------------------------------------------------------------

In your route:

```js
export default Route.extend({
  //...
  input: function(){
    return {
      keyboard : {
        "arrowleft" : "turnLeft",
        "arrowright" : "turnRight",
      }
    };
  },
  actions : {
    turnLeft : function(e){ /* do something */ },
    turnRight : function(e){ /* do something */ }
  }
});
```

To respond to gamepad input:

```js
Route.addInputSource(require('mappable-gamepad'))
export default Route.extend({
  //...
  input: function(){
    return {
      controller : {
        "y" : "explode"
      }
    };
  },
  actions : {
    explode : function(e){ /* do something */ }
  }
});
```

To respond to input from a connected cardswipe:

```js
Route.addInputSource(require('card-swipe'))
export default Route.extend({
  //...
  input: function(){
    return {
      cardswipe : {
        "invalid+credit" : "suggestAnotherCard",
        "valid+credit" : "processTransactionIfReady",
      }
    };
  },
  actions : {
    suggestAnotherCard : function(e){ /* do something */ },
    processTransactionIfReady : function(e){ /* do something */ }
  }
});
```

Roadmap
-------

Upcoming Features
- barcode scanner support
- QR scanning support
- NFC scanner
- Support for controller actions
- make browserify optional


Contributing
------------------------------------------------------------------------------

### Installation

* `git clone <repository-url>`
* `cd ember-route-input`
* `npm install`

### Linting

* `npm run lint:js`
* `npm run lint:js -- --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `ember try:each` – Runs the test suite against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
