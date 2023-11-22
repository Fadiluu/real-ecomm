var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const userHelper = require('../helpers/user-helpers');
const { response } = require('../app');

const verifyLogin = (req, res,next)=>{
  if(req.session.userLoggedIn ){
    next()
  }
  else{
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/',async function(req, res, next) {
  let cartCount = null
  if(req.session.user){
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }

  let user=req.session.user
  console.log(user)
  productHelper.getAllProducts().then((products)=>{
    res.render('user/view-products', { products,user,cartCount});
  })
});

router.get('/login', function(req, res, next) {
  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('user/login',{loginErorr:req.session.userLoginErorr });
    req.session.userLoginErorr  = false;
  }
})
router.get('/signup', function(req, res, next) {
  res.render('user/signup');
})

router.post('/signup',(req,res,next)=>{
  userHelper.doSignup(req.body).then((response)=>{
    req.session.userLoggedIn  = true;
    req.session.user = response;
    // console.log(response)
    res.redirect('/')

  })
})
router.post('/login',(req,res,next)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user = response.user;
      req.session.userLoggedIn =true;
      res.redirect('/')
    }else{
      req.session.userLoginErorr  = "Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req, res)=>{
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res)=>{
  let products = await userHelper.getCartProducts(req.session.user._id)
  let total = 0
  if(products.length>0){
    total = await userHelper.getTotalAmount(req.session.user._id)
  }
  console.log(total)
  res.render('user/cart',{products,user:req.session.user,total})
})

router.get('/add-to-cart/:id',(req,res)=>{
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res)=>{
  console.log(req.body)
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
    response.total = await userHelper.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/place-order',verifyLogin,async (req,res)=>{
  let total = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  let products = await userHelper.getCartProductList(req.body.userId)
  let totalPrice = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method'==='COD']){
      res.json({codSuccess:true})
    }else{
      userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)
      })
    }
  })
})

router.get('/remove-cart-item/:proId/:cartId',verifyLogin,async (req,res)=>{
  // console.log(req.params)
  userHelper.removeCartItem(req.params.proId,req.params.cartId).then((response)=>{
    res.redirect('/cart')
  })
})

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.get('/orders',async (req,res)=>{
  let orders = await userHelper.getUserOrders(req.session.user._id)
  // console.log(orders)
  res.render('user/view-order-products',{orders,user:req.session.user})
})

router.get('/view-order-products/:id',async(req,res)=>{
  let orderProducts = await userHelper.getOrderProducts(req.params.id)
  res.render('user/order-items',{user:req.session.user,orderProducts})
})

router.post('/verify-payment',(req,res)=>{
  console.log(req.body)
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changerPaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("Set payment")
      res.json({status:true})
    })
  }).catch((err)=>{
    res.json({status:false,errMsg:'Payment failed'})
  })
})

router.get('/profile/:id',(req,res)=>{
  console.log(req.session)
  res.render('user/profile',{user:req.session.user})
})

module.exports = router;
