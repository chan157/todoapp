const express = require('express');
const app = express();
const bodyParser= require('body-parser');
// const { username, password } = require('config/config.js')
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

const methodOveride = require('method-override')
app.use(methodOveride('_method'))

var db;

// var mongoConnectionCode = `mongodb+srv://${username}:${password}@cluster0.gsqxt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
// console.log(mongoConnectionCode)
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect("mongodb+srv://chan:chan@cluster0.gsqxt.mongodb.net/?retryWrites=true&w=majority",
   function(err, client){
    if(err) {
        return console.log(err);
    }

    db = client.db('todoapp');
    app.listen(8080, function() {
        console.log('listening on 8080')
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