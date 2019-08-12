/* eslint-disable no-console */
//서버에서 동작하는 코드
//클라이언트에서 동작하는 코드는 index.html의 script 태그로
var blacklist = [];
var ex = require('express')();
var http = require('http').createServer(ex);
var io = require('socket.io')(http);
//const opn = require('opn');
//var fs = require('fs');
var userlist = [];
var answerlist = [];
var currentChar = '';
var timeout;
var idx;

// fs.readFile('blacklist.txt', 'utf8', function(err, data) {
//     if (err) throw err;
//     console.log('블랙리스트 목록 로딩 완료');
//     blacklist = data.split('/n');
//   });

ex.set('trust proxy', true);
ex.get('/', function (req, res) {
    res.set({Connection: 'Keep-Alive'});
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('유저 ' + socket.id + ' 연결됨');
    io.emit('msg', "유저 " + socket.id + '가 연결되었습니다.', '#000000');
    socket.username = socket.id;
    socket.color = '#' + (function co(lor) {
        return (lor +=
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'][Math.floor(Math.random() * 16)])
            && (lor.length == 6) ? lor : co(lor);
    })('');
    console.log(socket.username + '에 색 코드 ' + socket.color + '가 부여됨');
    userlist.push(socket);
    updateUsersList();
    socket.on('update', function (username) {
        console.log("유저 " + socket.username + "의 닉네임이 " + username + "로 변경됨");
        io.emit('msg', "유저 " + socket.username + "의 닉네임이 " + username + "로 변경되었습니다.", '#000000');
        userlist[userlist.indexOf(socket)].username = username;
        updateUsersList();
    });
    socket.on('disconnect', function () {
        console.log(socket.username + ' 의 연결 끊김');
        io.emit('msg', "유저 " + socket.username + '의 연결이 끊겼습니다.', '#000000');
        userlist.splice(userlist.indexOf(socket));
        updateUsersList();
    });
    socket.on('msg', function (msg) {
        io.emit('msg', socket.username + ': ' + msg, socket.color);
        console.log(socket.username + ': ' + msg);
        if (currentChar === '' && msg.split(' ')[0] === '/시작') {
            currentChar = msg.split(' ')[1].charAt(msg.split(' ')[1].length - 1);
            startGame();
        }
        else if (msg.split(' ')[0].charAt(0) === currentChar && currentChar !== '' && userlist[idx].id === socket.id) {
            raiseAnswered(socket, msg.split(' ')[0]);
        }
        else if (msg.split(' ')[0].charAt(0) !== currentChar && currentChar !== '' && userlist[idx].id === socket.id) {
            io.emit('alert', socket.username + '님의 단어 ' + msg.split(' ')[0] + '는 사용할 수 없는 단어입니다.');
        }
    });
});

function startGame() {
    idx = 0;
    answerlist = [];
    updateTurn();
    io.emit('success', userlist[idx].username + '님이 10초 이내로 ' + currentChar + '로 시작하는 시작할 단어를 입력해주세요.');
    timeout = setTimeout(() => {
        raiseTimeout()
    }, 10000);
}

function raiseAnswered(socket, answer) {
    if (blacklist.includes(answer)) {
        io.emit('alert', socket.username + '님의 단어 ' + answer + '는 사용할 수 없는 단어입니다.');
        return;
    }
    else if (answerlist.includes(answer)) {
        io.emit('alert', socket.username + '님의 단어 ' + answer + '는 이미 사용된 단어입니다.');
        return;
    }
    clearTimeout(timeout);
    answerlist.push(answer);
    io.emit('success', socket.username + '님의 단어 ' + answer + '가 인정되었습니다.');
    console.log(socket.username + '님의 단어 ' + answer + '가 인정되었습니다.');
    currentChar = answer.charAt(answer.length - 1);
    if (++idx === userlist.length) {
        idx = 0;
    }
    updateTurn(answer);
    io.emit('success', userlist[idx].username + '님이 10초 이내로 ' + currentChar + "로 시직하는 단어를 입력해주세요.");
    timeout = setTimeout(() => {
        raiseTimeout()
    }, 10000);
}

function updateUsersList() {
    io.emit('userListUpdate', userlist.map(function (i) {
        return {
            username: i.username,
            color: i.color
        }
    }));
}

function updateTurn(answer) {
    io.emit('turn', idx, currentChar, answer);
}

function raiseTimeout() { //시간초과
    io.emit('alert', '시간이 다 되었습니다. 게임이 종료됩니다.');
    io.emit('gameEnd');
    currentChar = '';
}

http.listen(8080, function () {
    console.log('8080번 포트에서 웹서버 실행중');
});