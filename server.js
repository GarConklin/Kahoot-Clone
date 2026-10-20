const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const questions = JSON.parse(fs.readFileSync(path.join(__dirname, "questions.json"), "utf8"));
app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ok:true}));
const rooms = new Map();
const code = () => String(Math.floor(1000 + Math.random() * 9000));
function pub(room) {
  return { pin:room.pin, state:room.state, index:room.index, total:questions.length,
    question: room.state === "question" || room.state === "reveal" ? {
      q:questions[room.index].q, a:questions[room.index].a,
      multi:!!questions[room.index].multi, correct:room.state==="reveal"?questions[room.index].correct:null, why:room.state==="reveal"?questions[room.index].why:null
    }:null,
    players:[...room.players.values()].map(p=>({id:p.id,name:p.name,score:p.score,connected:p.connected})).sort((a,b)=>b.score-a.score),
    answered:room.state==="question"?room.answers.size:room.answers.size,
    answerCounts:room.state==="reveal"?room.counts:null,
    winner:room.winner||null };
}
function broadcast(room) { io.to(room.pin).emit("sync", pub(room)); }
io.on("connection", socket => {
  socket.on("host:create", (_, cb) => {
    let pin=code(); while(rooms.has(pin)) pin=code();
    const room={pin,host:socket.id,state:"lobby",index:-1,players:new Map(),answers:new Map(),counts:[],winner:null};
    rooms.set(pin,room); socket.join(pin); socket.data.pin=pin; socket.data.role="host";
    cb({ok:true,pin}); broadcast(room);
  });
  socket.on("host:action", ({action}, cb=()=>{}) => {
    const room=rooms.get(socket.data.pin);
    if(!room || socket.data.role!=="host" || room.host!==socket.id) return cb({ok:false,error:"Host session not found"});
    if(action==="start") { room.index=0; room.state="question"; room.questionStarted=Date.now(); room.answers.clear(); room.counts=[]; room.winner=null; }
    if(action==="next") {
      if(room.index < questions.length-1) { room.index++; room.state="question"; room.questionStarted=Date.now(); room.answers.clear(); room.counts=[]; }
      else { room.state="finished"; room.winner=[...room.players.values()].sort((a,b)=>b.score-a.score)[0]||null; }
    }
    if(action==="reveal" && room.state==="question") {
      room.state="reveal"; const q=questions[room.index]; room.counts=Array(q.a.length).fill(0);
      for(const ans of room.answers.values()) { const vals=Array.isArray(ans.value)?ans.value:[ans.value]; vals.forEach(v=>{if(Number.isInteger(v)&&v>=0&&v<room.counts.length) room.counts[v]++;}); }
      const correct=Array.isArray(q.correct)?q.correct:[q.correct];
      for(const [pid,ans] of room.answers) {
        const vals=Array.isArray(ans.value)?ans.value:[ans.value];
        const ok=vals.length===correct.length && vals.every(v=>correct.includes(v));
        const player=room.players.get(pid);
        if(ok) player.score += 500 + Math.max(0, Math.round((1-ans.elapsed/20000)*300));
      }
    }
    if(action==="reset") {
      room.state="lobby"; room.index=-1; room.answers.clear(); room.counts=[]; room.winner=null;
      for(const p of room.players.values()) p.score=0;
    }
    broadcast(room); cb({ok:true});
  });
  socket.on("player:join", ({pin,name}, cb) => {
    pin=String(pin||"").trim(); name=String(name||"").trim().slice(0,22);
    const room=rooms.get(pin);
    if(!room) return cb({ok:false,error:"That room PIN was not found."});
    if(!name) return cb({ok:false,error:"Enter a team name."});
    if(room.players.size>=9) return cb({ok:false,error:"This game is full (9 players/teams)."});
    if(room.state!=="lobby") return cb({ok:false,error:"This game has already started."});
    const id=socket.id; room.players.set(id,{id,name,score:0,connected:true});
    socket.join(pin); socket.data.pin=pin; socket.data.role="player"; socket.data.playerId=id;
    cb({ok:true}); broadcast(room);
  });
  socket.on("player:answer", ({value}, cb=()=>{}) => {
    const room=rooms.get(socket.data.pin); const id=socket.data.playerId;
    if(!room||socket.data.role!=="player"||room.state!=="question") return cb({ok:false,error:"Question is not active."});
    const started=room.questionStarted||Date.now(); const elapsed=Math.min(20000,Date.now()-started);
    room.answers.set(id,{value,elapsed}); broadcast(room); cb({ok:true});
  });
  socket.on("disconnect", () => {
    const room=rooms.get(socket.data.pin); if(!room) return;
    if(socket.data.role==="player") { const p=room.players.get(socket.data.playerId); if(p) p.connected=false; broadcast(room); }
    if(socket.data.role==="host" && room.host===socket.id) { room.host=null; }
  });
});
const oldAction=io;
server.listen(process.env.PORT||3000,"0.0.0.0",()=>console.log("Lab Legends listening on "+(process.env.PORT||3000)));
