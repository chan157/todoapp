var router = require('express').Router();

// Router
router.get('/shop/shirts', function(req, res) {
    res.send('셔츠 파는 page 입니다. ');
})

router.get('/shop/pants', function(req, res) {
    res.send('바지 파는 페이지 입니다. ');
})