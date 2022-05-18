const express = require('express');
const app = express();
const bodyParser= require('body-parser');
require('dotenv').config()

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

const methodOveride = require('method-override')
app.use(methodOveride('_method'))

var db;


const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(process.env.DB_URL,
   function(err, client){
    if(err) {
        return console.log(err);
    }

    db = client.db('todoapp');
    app.listen(process.env.PORT, function() {
        console.log('listening on http://localhost:8080')
        
    });
})


app.get('/', function(req, res) { 
  res.render('index.ejs')
})

app.get('/write', function(req, res) { 
    // res.sendFile(__dirname +'/write.html')
    res.render('write.ejs')
});

app.get('/edit/:id', function(req, res) {
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result) {
        console.log(result)
        res.render('edit.ejs', { post : result})
    })
    
})

app.post('/add', function(req, res){
  res.send('전송완료')
    db.collection('count').findOne({name:'numberOfPost'}, function(err, result){
        console.log(result)
        var totalPost = result.totalPost;
        console.log(totalPost);
        db.collection('post').insertOne({_id : totalPost + 1, title : req.body.title, date : req.body.date }, function(err, result){
            if (err) return console.log(err);
            console.log('저장완료!!');
            db.collection('count').updateOne({name : 'numberOfPost'},{ $inc : {totalPost:1}}, function(err, result){
                if (err) return console.log(err);

            });
        });
    });



});

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(err, result){
        if (err) return console.log(err);

        console.log(result);
        res.render('list.ejs', {posts:result});
    });
});

app.delete('/delete', function(req, res) {
    console.log("Delete 요청 발생", req.body);
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne(req.body, function(err, result) {
        console.log("삭제완료", result);
        res.status(200).send({ message : '삭제를 완료하였습니다.'});
    })
})

app.get('/detail/:id', function(req, res) {
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result) {
        console.log(result)
        res.render('detail.ejs', { data : result })
    })
    
})

app.put('/edit', function(req, res) {
    // put 요청이 들어오면
    // form에 담긴 제목 날짜 데이터를 가지고 온다
    // db.collection에 수정 업데이트를 진행한다.
    db.collection('post').updateOne({_id : parseInt(req.body.id)},
        { $set : { title: req.body.title, date: req.body.date} }, function(err, result) {
                if (err) {console.log(err);}
                console.log("수정 완료");
                res.redirect('/list');
    })
})



// 로그인을 위한 준비물들
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// app.use(미들웨어)  웹서버는 요청- 응답해주는 머신
app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res) {
    res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}),function(req, res) {
    res.redirect('/') 
});

// 로그인을 위한 Session 관련 내용

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,              // 로그인 후 세션을 저장할 것인지 여부
    passReqToCallback: false,   // 특수한 경우에 사용, ID/PW 외에도 test하는 경우
  }, function (inputID, inputPW, done) {
        db.collection('login').findOne({ id: inputID }, function (err, result) {
            if (err) return done(err)
            if (!result) return done(null, false, { message: '존재하지않는 아이디요' })
            if (inputPW == result.pw) {
                return done(null, result)
            } else {
                return done(null, false, { message: '비번틀렸어요' })
            } 
    })
  }));

// id를 이용해서 세션을 저장하는 코드, 로그인 성공시 발동
// 세선 데이터를 만들고  세션의 id정보를 쿠키로 보냄
passport.serializeUser(function(user, done) {
    done(null, user.id)
});

// 이 세션 데이터를 가진 사람을 DB에서 찾아주세요 요청, 마이페이지 접속시 발동
// deserializeUser : 로그인한 유저의 세션아이디를 바탕으로 개인정보를 db에서 찾는 역할
passport.deserializeUser(function(id, done) {
    db.collection('login').findOne({id: id}, function(err, result) {
        done(null, result)
    })
    
});



app.get('/mypage', isLogined, function(req, res) {
    console.log(req.user);
    res.render('mypage.ejs', {user : req.user})
});

// 미들웨어 만들기
function isLogined(req, res, next) {
    if (req.user) { 
        next() // 로그인 세션이 있으면 next
    } else {
        res.send("로그인 안하셨는데요...?")
    }
}


