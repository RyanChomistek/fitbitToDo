export function dumpObject(obj) {
    let jobject = {name: null, attributes: [], methods: []};
    for(const key in obj) {
      var v = '<not working>';
      var tn = '<unknown>';
      try{
        var v = obj[key];
        var tn = typeof v;
        if (tn === 'function') {
          jobject.methods.push(key);
        }
        else {
          jobject.attributes.push({name: key, type: tn, value: v});
        }
      }
      catch(e) {
        v = e.message;
        console.log('key:' + key + ', type:' + tn +' =' + v);
      }
    }
    
    if (!obj) {
      jobject.name = obj;
    }
    
    if (obj && typeof obj.constructor === 'function')
      jobject.name = obj.constructor.name;
    
    console.log('* object dump *');
    console.log(`name:${jobject.name}`);
    console.log('** methods **');
    jobject.methods.forEach((name) => {
      console.log(name);
    });
    console.log('** attributes **');
    jobject.attributes.forEach((def) => {
      console.log(JSON.stringify(def));
    });
    return jobject;
    
  }