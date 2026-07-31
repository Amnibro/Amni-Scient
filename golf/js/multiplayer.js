function createHotSeat(names){
const players=names.map((n,i)=>({id:i,name:n||`Player ${i+1}`,total:0,scores:[]}));
let turn=0,host=0;
return{
mode:"hotseat",
players,
getTurn:()=>players[turn],
getHost:()=>players[host],
nextTurn(){turn=(turn+1)%players.length;return players[turn]},
rotateHost(){host=(host+1)%players.length;return players[host]},
addScore(strokes){players[turn].scores.push(strokes);players[turn].total+=strokes},
setTurn(i){turn=i%players.length},
serialize(){return{mode:"hotseat",players,turn,host}},
apply(s){if(!s)return;turn=s.turn|0;host=s.host|0;s.players&&s.players.forEach((p,i)=>{if(players[i]){players[i].total=p.total;players[i].scores=p.scores}})}
};
}
function createOnlineStub(){
let peer=null,conn=null,roomId="",isHost=false,roster=[],localId="",onMsg=null,onRoster=null;
async function ensurePeer(){
if(peer)return peer;
if(!window.Peer)throw new Error("PeerJS not loaded");
peer=new Peer({debug:0});
await new Promise((res,rej)=>{peer.on("open",res);peer.on("error",rej)});
localId=peer.id;
peer.on("connection",c=>{wire(c);isHost=true});
return peer;
}
function wire(c){
conn=c;
c.on("data",d=>onMsg&&onMsg(d,c));
c.on("open",()=>{rosterPush(c.peer);broadcastRoster()});
c.on("close",()=>{roster=roster.filter(id=>id!==c.peer);onRoster&&onRoster(getRoster())});
}
function rosterPush(id){if(!roster.includes(id))roster.push(id);if(!roster.includes(localId))roster.unshift(localId)}
function getRoster(){return roster.slice()}
function broadcastRoster(){const msg={t:"roster",roster:getRoster(),host:roster[0]};send(msg);onRoster&&onRoster(getRoster())}
function send(msg){conn&&conn.open&&conn.send(msg)}
async function createRoom(){
await ensurePeer();
isHost=true;roomId=peer.id;roster=[localId];
onRoster&&onRoster(getRoster());
return roomId;
}
async function joinRoom(id){
await ensurePeer();
roomId=id;isHost=false;
const c=peer.connect(id,{reliable:true});
wire(c);
await new Promise((res,rej)=>{c.on("open",res);c.on("error",rej)});
rosterPush(localId);rosterPush(id);
send({t:"hello",id:localId});
return roomId;
}
function setHandlers({message,roster}){onMsg=message;onRoster=roster}
function rotateHostOnline(){
if(roster.length<2)return roster[0];
roster.push(roster.shift());
broadcastRoster();
return roster[0];
}
function amHost(){return roster[0]===localId||(isHost&&roster.length<=1)}
return{mode:"online",createRoom,joinRoom,send,setHandlers,getRoster,rotateHostOnline,amHost,get roomId(){return roomId},get localId(){return localId}};
}
export{createHotSeat,createOnlineStub};