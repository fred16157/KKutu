var ex = require('express')();
var http = require('http').createServer(ex);
var io = require('socket.io')(http);

ex.get('/' , function(req, res)
{
   res.sendfile(__dirname + '/index.html'); 
});

io.on('connection', function(socket) {
    console.log('유저 연결됨');
})

http.listen(8080, function() {
    console.log('8080번 포트에서 웹서버 실행중');
});