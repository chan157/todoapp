var router = require('express').Router();

router.get('/sports', function(req, res) {
    res.send('sport 게시판')
})

router.get('/game', function(req, res) {
    res.send('game 게시판')
})

module.exports = router;