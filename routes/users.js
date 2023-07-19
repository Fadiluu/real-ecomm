var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const userHelper = require('../helpers/user-helpers');

const verifyLogin = (req, res,next)=>{
  if(req.session.loggedIn){
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
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{loginErorr:req.session.loginErorr});
    req.session.loginErorr = false;
  }
})
router.get('/signup', function(req, res, next) {
  res.render('user/signup');
})

router.post('/signup',(req,res,next)=>{
  userHelper.doSignup(req.body).then((response)=>{
    req.session.loggedIn = true;
    req.session.user = response;
    // console.log(response)
    res.redirect('/')

  })
})
router.post('/login',(req,res,next)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true;
      req.session.user = response.user;
      res.redirect('/')
    }else{
      req.session.loginErorr = "Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req, res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res)=>{
  let products = await userHelper.getCartProducts(req.session.user._id)
  console.log(products)
  res.render('user/cart',{products,user:req.session.user})
})

router.get('/add-to-cart/:id',(req,res)=>{
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})


module.exports = router;
