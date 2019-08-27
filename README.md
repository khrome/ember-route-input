ember-route-input
==============================================================================

[![NPM version](https://img.shields.io/npm/v/ember-route-input.svg)]()
[![npm](https://img.shields.io/npm/dt/ember-route-input.svg)]()

An Ember addon to set input (controls which map to a [`ember-route-action-helper`](https://github.com/dockyard/ember-route-action-helper)), allowing simple input bindings which scope only to the route they are defined in and require no other hooks or bindings.

Installation
------------------------------------------------------------------------------
Requires: [`ember-route-action-helper`](https://github.com/dockyard/ember-route-action-helper), [`ember-browserify`](https://www.npmjs.com/package/ember-browserify), [`stream-responder-heirarchy`](https://github.com/khrome/stream-responder-heirarchy), [`extended-emitter`](https://github.com/khrome/extended-emitter)

and optionally supports:
- controllers through [`mappable-gamepad`](https://www.npmjs.com/package/mappable-gamepad)
- magnetic card swipes through [`card-swipe`](https://www.npmjs.com/package/card-swipe)
- barcodes through [`barcode-scanner`](https://www.npmjs.com/package/barcode-scanner)

```
ember install ember-route-input
```
you'll also want an initializer to customize your bindings

```
ember g initializer input-init
```

Usage
------------------------------------------------------------------------------
There are a few different supported input types:

<h2>Keyboard</h2>

- **Main Field** : `.key`
- **Supported Modifiers** :
    - `shift`
    - `ctrl`/`control`
    - `alt`/`alternate`/`option`
- **Input Identifier** : 'keyboard'

**Initialize**

```js
import Route from '@ember/routing/route';
//...
//bind to keypress on document.body
Route.bodyInput();
```
**In the Route**

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

<h2>Controllers</h2>
- **Main Field** : `.button`
- **Supported Modifiers** :
    - all other keys are supported : each button-up event that triggers an event will have all other pressed keys as available modifiers
- **Input Identifier** : 'controller'

**Initialize**
```js
import Route from '@ember/routing/route';
//...
//bind to gamepad through the Web API
Route.addInputSource(require('mappable-gamepad'))
```
**In the Route**

```js
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

<h2>Card Swipe</h2>

- **Main Field** : `.account`
- **Supported Modifiers** :
    - `visa`
    - `mastercard`
    - `valid`/`invalid`
- **Input Identifier** : 'cardswipe'

**Initialize**

```js
import Route from '@ember/routing/route';
//...
//bind to keypress on document.body (same as the keyboard)
Route.bodyInput();
```
**In the Route**

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

<h2>Barcode Scanner</h2>
Barcode scanner support is only designed for [`ember-electron`](https://ember-electron.js.org/), other setups might work, but no guarantees (and definitely not the browser).

- **Main Field** : `.scan`
- **Supported Modifiers** :
    - `upc`, `upcA`
    - `ean`, `ean8`, `ean13`
    - `code128`
    - `codabar`
- **Input Identifier** : 'barcodescanner'

**Initialize**

```js
import Route from '@ember/routing/route';
const Scanner = requireNode('barcode-scanner/event-adapter/client.js');

Route.addInputSource(Scanner)
```

**electron main**

```js
const BarcodeScanner = require('barcode-scanner');
const Scanner = require('barcode-scanner/event-adapter/server.js');
const { ipcMain } = require('electron');

var scanner = new Scanner({
    name : 'barcode',
    scanner : BarcodeScanner,
    emitter: ipcMain,
    transformEmitterFn :(emitter, event) => event.sender
});
scanner.listenForDeviceListRequest();
scanner.listenForDeviceListenerRequest();
```

**In the Route**

```js
export default Route.extend({
  //...
  input: function(){
    return {
      barcodescanner : {
        "ean+barcode" : "lookupOnAmazon",
        "code128+barcode" : "lookupInInventory",
      }
    };
  },
  actions : {
    lookupOnAmazon : function(e){ /* do something */ },
    lookupInInventory : function(e){ /* do something */ }
  }
});
```

Roadmap
-------

Upcoming Features (PRs Welcome!)
- config interfaces for supported inputs
- QR scanning support
- NFC scanner
- Support for controller actions, too
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
