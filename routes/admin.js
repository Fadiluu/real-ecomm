var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProducts().then((products)=>{
    // console.log(products[0]._id)
    res.render('admin/view-products',{products,admin:true});
  })
});

router.get('/add-product',function(req,res){
  res.render('admin/add-product',{admin:true})
})

router.post('/add-product',(req,res)=>{
  // console.log(req.body)
  // console.log(req.files.Image)
  productHelper.addProduct(req.body,(id)=>{
    let image = req.files.Image
    console.log(image.mimetype)
    if(image.mimetype=='image/jpeg' || image.mimetype=='image/jpg'){
      image.mv('./public/product-image/'+id+'.jpg',(err)=>{
        if(err){
          console.log('Error while moving the image',err)
        }else{
          res.render('admin/add-product')
        }
      })
    }else if(image.mimetype=='image/png'){
      image.mv('./public/product-image/'+id+'.png',(err)=>{
        if(err){
          console.log('Error while moving the image',err)
        }else{
          res.render('admin/add-product',{admin:true})
        }
      })
    }
  })
})

router.get('/delete-product/:id', (req,res)=>{
  // let productId = req.query.id
  productId = req.params.id
  productHelper.deleteProduct(productId).then((data)=>{
    console.log("Product deleted")
    res.redirect('/admin/')
  })
})

router.get('/edit-product/:id',async (req,res)=>{
   let product= await productHelper.getProductDeatils(req.params.id)
  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id',(req,res)=>{
  productHelper.updateProductDeatils(req.params.id,req.body).then(()=>{
    console.log('Product updated successfully')
    if(req.files.Image){
      let image = req.files.Image
      id = req.params.id
      if(image.mimetype=='image/jpeg' || image.mimetype=='image/jpg'){
        image.mv('./public/product-image/'+id+'.jpg',)
      }else if(image.mimetype=='image/png'){
        image.mv('./public/product-image/'+id+'.png')
      }
    }
    res.redirect('/admin/',{admin:true})
  })
})

router.get('/all-orders',async (req,res)=>{
  let orders = await productHelper.getAllOrders()
})

router.get('/view-users',async(req,res)=>{
  let users = await productHelper.getAllUser()
  res.render('admin/view-users',{admin:true,users})
})

module.exports = router;
