//서버에서 동작하는 코드
//클라이언트에서 동작하는 코드는 index.html의 script 태그로

var ex = require('express')();
var http = require('http').createServer(ex);
var io = require('socket.io')(http);
const opn = require('opn');
var userlist = [];

ex.set('trust proxy', true);
var ip;
ex.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    userlist.push(socket);
    console.log('유저 ' + socket.id + ' 연결됨');
    io.emit('msg', "유저 " + socket.id + '가 연결되었습니다.');
    socket.username = socket.id;
    socket.on('update', function(username) {
        console.log("유저 " + socket.username + "의 닉네임이 " + username + "로 변경됨");
        io.emit('msg', "유저 " + socket.username + "의 닉네임이 " + username + "로 변경되었습니다.");
        socket.username = username;
    });
    socket.on('disconnect', function () {
        console.log(socket.username + ' 의 연결 끊김');
        io.emit('msg', "유저 " + socket.username + '의 연결이 끊겼습니다.');
    });
    socket.on('msg', function(msg) {
        io.emit('msg', socket.username + ': ' +msg);
        console.log(socket.username + ': ' + msg);
    });
})

http.listen(8080, function () {
    console.log('8080번 포트에서 웹서버 실행중');
    opn("http://localhost:8080");
});