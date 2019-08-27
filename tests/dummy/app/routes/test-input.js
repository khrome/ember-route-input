import Route from '@ember/routing/route';

var controls = {
  keyboard : {
    "arrowleft" : "reactLeft"
  }
}

export default Route.extend({
  model : function(){
    return new Promise(function(resolve){
      resolve({});
    });
  },
  input: function(){
    return controls;
  },
  actions : {
    reactLeft : function(){
        window.pushLeftSeen++;
        console.log('4!!')
    }
  }
});
