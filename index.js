var ex = require('express')();
var http = require('http').createServer(ex);
var io = require('socket.io')(http);

ex.get('/' , function(req, res)
{
   res.sendfile(__dirname + '/index.html'); 
});

io.on('connection', function(socket) {
    console.log('유저' + socket.id + '연결됨');
    socket.on('disconnect', function() {
        console.log(socket.id + '의 연결 끊김');
    })
})

http.listen(8080, function() {
    console.log('8080번 포트에서 웹서버 실행중');
});