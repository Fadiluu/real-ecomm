// const  MongoClient  = require('mongodb').MongoClient
// const state={
//     db:null
// }

// module.exports.connect = function(done){
//     url='mongodb://127.0.0.1:27017/'
//     const dbname = 'Shipping'
//     console.log('done connecting')
//     new MongoClient.connect(url,(err,data)=>{
//         if(err) return done(err)
//         state.db = data.db(dbname)
//         console.log('ok')
//         done()
//     })
//     // MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
//     //     if(err) return done(err)
//     //     state.db = data.db(dbname)
//     //     console.log('ok')
//     //     done()
//     //   });
      
// }

// module.exports.get = function(){
//     return state.db
// }

const { MongoClient } = require('mongodb');
const url = "mongodb://127.0.0.1/"
const dbname = 'shopping'
const client = new MongoClient(url)
const state = {
  db: null
}

module.exports.connect = async () => {
  await client.connect()
  const db = client.db(dbname)
  state.db = db
  console.log("Database connected")
}

module.exports.get = function(){
    return state.db
}
