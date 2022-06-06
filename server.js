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

var multer = require('multer');
var storage = multer.diskStorage({

    destination : function(req, file, cb){
      cb(null, './public/image');
    },
    filename : function(req, file, cb){
      cb(null, file.originalname );
    }
  
  });

var upload = multer({storage : storage});


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

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(err, result){
        if (err) return console.log(err);

        console.log(result);
        res.render('list.ejs', {posts:result});
    });
});


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


app.get('/search', (req, res) => {
    var searchCondition = [
        {
            $search: {
                index: 'titleSearch',
                text: {
                    query: req.query.value,
                    path: 'title'
                }
            }
        },
        // { $sort : { _id : 1} },
        { $limit : 10 },
        { $project : { title: 1, _id: 0, score: { $meta: "searchScore" } } }
    ]
    console.log(req.query)
    db.collection('post').aggregate(searchCondition).toArray((err, result) => {
        console.log(result)
        res.render('search.ejs', { data : result})
    })
});

app.get('/upload', function(req, res) {
    res.render('upload.ejs')
});

app.post('/upload', upload.single('profile'), function(req, res){
    res.send('업로드완료')
});

app.get('/image/:imageName', function(req, res){
    res.sendFile(__dirname + '/public/image/' + req.params.imageName)
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

app.post('/register', function(req, res) {
    db.collection('login').insertOne({ id : req.body.id, pw : req.body.pw }, function(err, result) {
        res.redirect('/')
    })
})

app.post('/add', function(req, res){
    console.log(req.user._id)
    res.send('전송완료')
      db.collection('count').findOne({name:'numberOfPost'}, function(err, result){
          console.log(result)
          var totalPost = result.totalPost;
          var post = {_id : totalPost + 1, writer : req.user._id, title : req.body.title, date : req.body.date}
  
          db.collection('post').insertOne(post, function(err, result){
              if (err) return console.log(err);
              console.log('저장완료!!');
              db.collection('count').updateOne({name : 'numberOfPost'},{ $inc : {totalPost:1}}, function(err, result){
                  if (err) return console.log(err);
  
              });
          });
      });
  });

  
app.delete('/delete', function(req, res) {
    console.log("Delete 요청 발생", req.body);
    console.log(req.body)

    req.body._id = parseInt(req.body._id);
    var deletePost = { _id : req.body._id, writer : req.user._id }

    
    db.collection('post').deleteOne(deletePost, function(err, result) {
        console.log("삭제완료", result);
        if (err) { console.log(err) };
        if (result) {console.log(result)};
        res.status(200).send({ message : '삭제를 완료하였습니다.'});
    })
})

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


//Router
app.use('/shop', require('./routes/shop')); // '/shop'경로에 접속하면 router/shop에 등록해줌
app.use('/board/sub', require('./routes/board'));