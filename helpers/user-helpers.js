var db=require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt');
var objectID = require('mongodb').ObjectId

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password = await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(userData);
            })
        })
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve, reject)=>{
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log('Yes')
                        response.user = user
                        response.status = true
                        resolve(response)
                    }else{
                        resolve({status:false})
                        console.log('Incorrect')
                    }
                })
            }else{
                console.log('Incorrect')
                resolve({status:false})
            }
         })
    },
    addToCart:(proId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user: new objectID(userId)})
            if (userCart){
                db.get().collection(collection.CART_COLLECTION).updateOne({user: new objectID(userId)},
                {
                    $push:{products:new objectID(proId)}
                }).then((response)=>{
                    resolve()
                })
            }else{
                let cartObject={
                    user: new objectID(userId),
                    products:[new objectID(proId)]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObject).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectID(userId)}
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        let:{proList:'$products'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id','$$proList']
                                    }
                                }
                            }
                        ],
                        as:'cartItems'
                    }
                }
            ]).toArray();
            resolve(cartItems[0].cartItems);
        })
    },
    getCartCount:(userId)=>{
        return new Promise (async(resolve,reject)=>{
            let count=0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectID(userId)})
            if(cart){
                count = cart.products.length;
            }
            resolve(count);
        })
    }

}