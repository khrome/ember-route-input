ember-route-input
==============================================================================

An Ember addon to set input (controls which map to a [`ember-route-action-helper`](https://github.com/dockyard/ember-route-action-helper)), allowing simple input bindings which scope only to the route they are defined in and require no other hooks or bindings.

Installation
------------------------------------------------------------------------------
Requires: [`ember-route-action-helper`](https://github.com/dockyard/ember-route-action-helper)), [`ember-browserify`](https://www.npmjs.com/package/ember-browserify)), [`stream-responder-heirarchy`](https://github.com/khrome/stream-responder-heirarchy), [`extended-emitter`](https://github.com/khrome/extended-emitter)

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
    turnLeft : function(){
        //do something
    },
    turnRight : function(){
        //do something
    }
  }
});
```


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
