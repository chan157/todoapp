var router = require('express').Router();

// 미들웨어 만들기
function isLogined(req, res, next) {
    if (req.user) { 
        next() // 로그인 세션이 있으면 next
    } else {
        res.send("로그인 안하셨는데요...?")
    }
}

// 라우터 전체에 적용활 수 있는 미들웨어
router.use(isLogined);

// Router
router.get('/shirts', function(req, res) { 
    res.send('셔츠 파는 page 입니다. ');
})

router.get('/pants', function(req, res) {
    res.send('바지 파는 페이지 입니다. ');
})

module.exports = router;