const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const socketio = new Server(server);
var players=[];
var proj=[];
app.get('/', (req, res) => {
  res.sendFile(__dirname+'/index.html');
});
var loop=setInterval(send,30);
function send(){
    for(var i=0;i<proj.length;i++){
        var b=proj[i];
        b.x+=Math.sin(b.d)*-10;
        b.y-=Math.cos(b.d)*-10;
        b.l--;
        if(b.l<0){proj.splice(i,1)}
        for(var j=0;j<players.length;j++){
            var p=players[j];
            if(p.id!=b.id){
                if(dist(p.x,p.y,b.x,b.y)<21){proj.splice(i,1);socketio.to(p.id).emit("hit",5)}
            }
        }
    }
    socketio.emit('projectiles',proj);
    socketio.emit('data',players);
}
socketio.on('connection',(socket)=>{
    console.log("user connnected, id:"+socket.id);
    players.push({id:socket.id,x:0,y:0,d:0,rc:0,hp:100,name:"player"+players.length});
    socket.on('disconnect', () => {
        console.log('user '+socket.id+'disconnected');
        players.splice(players.findIndex((e)=>e.id==socket.id),1);
    });
    
    socket.on('chat message', (msg) => {
        var p=players.find((e)=>e.id==socket.id);
        console.log('p.name: ' + msg);
        socketio.emit('chat receive',[msg,p.name])
    });

    socket.on('pdata', (dt) => {
        var p=players.find((e)=>e.id==socket.id);
        p.x=dt.x;
        p.y=dt.y;
        p.d=dt.d;
        p.rc=dt.rc;
        p.hp=dt.hp;

    });
    socket.on('setname', (n) => {
        var p=players.find((e)=>e.id==socket.id);
        console.log(p.name+" changed their name to "+n);
        p.name=n;
    });

    socket.on('fire', (b) => {
        proj.push({x:b.x,y:b.y,d:b.d,id:socket.id,l:100});
    });
})

server.listen(3000, () => {
  console.log('listening on *:3000');
});

function dist(x1,y1,x2,y2){
    return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
}