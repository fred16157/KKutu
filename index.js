//서버에서 동작하는 코드
//클라이언트에서 동작하는 코드는 index.html의 script 태그로

var ex = require('express')();
var http = require('http').createServer(ex);
var io = require('socket.io')(http);
const opn = require('opn');
var userlist = [];
var currentChar = '';
var timeout;
var idx;

ex.set('trust proxy', true);
var ip;
ex.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('유저 ' + socket.id + ' 연결됨');
    io.emit('msg', "유저 " + socket.id + '가 연결되었습니다.');
    socket.username = socket.id;
    userlist.push(socket);
    socket.on('update', function(username) {
        console.log("유저 " + socket.username + "의 닉네임이 " + username + "로 변경됨");
        io.emit('msg', "유저 " + socket.username + "의 닉네임이 " + username + "로 변경되었습니다.");
        userlist[userlist.indexOf(socket)].username = username;
    });
    socket.on('disconnect', function() {
        console.log(socket.username + ' 의 연결 끊김');
        io.emit('msg', "유저 " + socket.username + '의 연결이 끊겼습니다.');
        userlist.splice(userlist.indexOf(socket));
    });
    socket.on('msg', function(msg) {
        io.emit('msg', socket.username + ': ' +msg);
        console.log(socket.username + ': ' + msg);
        if(currentChar === '' && msg.split(' ')[0] === '시작')
        {
            startGame();
            currentChar = msg.split(' ')[1];
        }
        else if(msg.split(' ')[0].charAt(0) === currentChar && currentChar !== '' && userlist[idx].id === socket.id)
        {
            raiseAnswered(socket, msg.split(' ')[0]);   
        }
        else if(msg.split(' ')[0].charAt(0) !== currentChar && currentChar !== '' && userlist[idx].id === socket.id )
        {
            raiseWrong(socket, msg.split(' ')[0]);
        }
    });
});

function startGame() {
    idx = 0;
    timeout = setTimeout(() => {
        raiseTimeout()
    }, 7500);
    io.emit('success', userlist[idx].username + '님이 7.5초 이내로 시작할 단어를 입력해주세요.');
}

function raiseAnswered(socket, answer) {
    clearTimeout(timeout);
    io.emit('success', socket.username + '님의 단어 ' + answer + '가 인정되었습니다.');
    console.log(socket.username + '님의 단어 ' + answer + '가 인정되었습니다.');
    currentChar = answer.charAt(answer.length - 1);
    if(++idx === userlist.length)
    {
        idx = 0;
    }
    io.emit('success', userlist[idx].username + '님이 7.5초 이내로 ' + currentChar + "로 시직하는 단어를 입력해주세요.");
    timeout = setTimeout(() => {
        raiseTimeout()
    }, 7500);
}

function raiseTimeout() { //시간초과
    io.emit('alert', '시간이 다 되었습니다. 게임이 종료됩니다.');
    currentChar = '';
}

http.listen(8080, function () {
    console.log('8080번 포트에서 웹서버 실행중');
});