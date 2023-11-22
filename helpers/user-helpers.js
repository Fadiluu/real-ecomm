var db=require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt');
const { reject, resolve } = require('promise');
const { response } = require('../app');
var objectID = require('mongodb').ObjectId
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_rnKQtd4bsvRchX',
    key_secret: 'xyooO2OjKLc45vfbnB11kMjo',
});

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
        let proObj={
            item:new objectID(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user: new objectID(userId)})
            if (userCart){
                let proExist = userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist);
                if(proExist != -1){
                    db.get().collection(collection.CART_COLLECTION).updateOne(
                        {user:new objectID(userId),'products.item':new objectID(proId)},
                        {
                            $inc:{'products.$.quantity':1}
                        }).then(()=>{
                            resolve()
                        })
                }else{
                    db.get().collection(collection.CART_COLLECTION).updateOne({user: new objectID(userId)},
                    {
                        $push:{products:proObj},
                    }).then((response)=>{
                        resolve()
                    })
                }
            }else{
                let cartObject={
                    user: new objectID(userId),
                    products:[proObj]
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
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'

                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{proList:'$products'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id','$$proList']
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }
            ]).toArray();
            // console.log(cartItems[0].products)
            resolve(cartItems);
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
    },
    changeProductQuantity:(details)=>{
        count = parseInt(details.count)
        return new Promise (async(resolve,reject)=>{
            if(details.quantity == 1 && count == -1){
                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id:new objectID(details.cart)},
                    {
                        $pull:{products:{item:new objectID(details.product)}}
                    }).then((response)=>{
                        resolve({removeProduct:true})
                    })
            }else{
                db.get().collection(collection.CART_COLLECTION).updateOne(
                    {_id:new objectID(details.cart), 'products.item':new objectID(details.product)},
                    {
                        $inc:{'products.$.quantity':count}
                    }).then((response)=>{
                        resolve({status:true})
                    })
            }
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectID(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'

                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group :{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    }
                }
            ]).toArray();
            // console.log(total[0].total)
            resolve(total[0].total);
        })
    },
    removeCartItem(proId,cartId){
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({
                _id:new objectID(cartId)},
                {
                    $pull:{products:{item:new objectID(proId)}}
                }).then((response)=>{
                    resolve(response)
                })
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user: new objectID(userId)})
            resolve(cart.products)
        })
    },
    placeOrder:(order,products,totalPrice)=>{
        return new Promise((resolve,reject)=>{
            // console.log(order,products,totalPrice)
            let status = order['payment-method']=='COD'?'palced':'pending'
            let orderObj ={
                delivery:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId: new objectID(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                price:totalPrice,
                status:status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user: new objectID(order.userId)})
                // console.log(response.insertedId.toString())
                resolve(response.insertedId.toString())
            })
        })
    },
    getUserOrders:(userId)=>{
        return new Promise (async(resolve,reject)=>{
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).find({userId: new objectID(userId)}).toArray()
            // console.log(orderItems)
            resolve(orderItems)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise (async(resolve,reject)=>{
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:new objectID(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'

                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray();
            // console.log(orderItems)
            resolve(orderItems)
        })
    },
    generateRazorpay:(orderId,totalPrice)=>{
        return new Promise ((resolve,reject)=>{
            var options = {
                amount: totalPrice*100,
                currency: "INR",
                receipt: orderId
            }
            instance.orders.create(options,function(err,order){
                //  console.log(order)
                 resolve(order)
            })
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto') 
            let hmac = crypto.createHmac('sha256', 'xyooO2OjKLc45vfbnB11kMjo');
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changerPaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:new objectID(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    }

}