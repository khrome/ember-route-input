import Route from '@ember/routing/route';

export default Route.extend({
  model : function(){
    return new Promise(function(resolve){
      resolve({});
    });
  }
});
