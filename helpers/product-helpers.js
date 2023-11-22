var db=require('../config/connection')
var collection = require('../config/collections')
const { response } = require('express')
const { resolve, reject } = require('promise')
var objectID = require('mongodb').ObjectId
module.exports={

    addProduct:(product,callback)=>{
        product.Price = parseInt(product.Price)
        console.log(product.Price)
        console.log(product)
        // console.log(product);
        db.get().collection('products').insertOne(product).then((data)=>{
            // console.log(data.insertedId.toString());
            callback(data.insertedId.toString())
        })
    },

    getAllProducts:()=>{
        return new Promise (async (resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    deleteProduct:(productId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new objectID(productId)}).then((data)=>{
                // resolve(data.insertedId.toString())
                resolve(data)
            })
        })
    },

    getProductDeatils(proId){
        return new Promise((resolve, reject) =>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new objectID(proId)}).then((product)=>{
                // console.log(product)
                resolve(product)
            })
        })
    },

    updateProductDeatils:(proId,proDetails)=>{
        return new Promise ((resolve, reject) =>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:new objectID(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Description:proDetails.Description,
                    Price:proDetails.Price,
                    Category:proDetails.Category
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    getAllUser:()=>{
        return new Promise (async(resolve,reject)=>{
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            // console.log(users)
            resolve(users)
        })
    },

    getAllOrders:()=>{
        return new Promise (async(resolve,reject)=>{
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $lookup:{
                    from:collection.USER_COLLECTION,
                    localField:'UserId',
                    foreignField:'_id',
                    as:'user'
                }
            },
            {
                $project:{
                    paymentMethod:1,user:{$arrayElemAt:['$user',0]}
                }
            },
            {
                 $sort:{userId:-1}
            }]).toArray()
            console.log(orders)
        })
    }

}