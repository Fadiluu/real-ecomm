var db=require('../config/connection')
var collection = require('../config/collections')
const { response } = require('express')
var objectID = require('mongodb').ObjectId
module.exports={

    addProduct:(product,callback)=>{
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
    }

}