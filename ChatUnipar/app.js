
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const lines = [];
for(let i=0; i<30; i++){
    lines.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        vx: (Math.random()-0.5)*0.5,
        vy: (Math.random()-0.5)*0.5,
        length: 50 + Math.random()*100
    });
}

function animateLines(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    lines.forEach(l => {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x + l.length, l.y + l.length/2);
        ctx.stroke();

        l.x += l.vx;
        l.y += l.vy;

        if(l.x > canvas.width) l.x = 0;
        if(l.x < 0) l.x = canvas.width;
        if(l.y > canvas.height) l.y = 0;
        if(l.y < 0) l.y = canvas.height;
    });
    requestAnimationFrame(animateLines);
}

animateLines();

window.addEventListener('resize', ()=>{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let stompClient = null;
let username = null;

const messagesDiv = document.getElementById('messages');
const input = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

input.placeholder = "Digite seu nome";

function addMessage(sender, text) {
    const div = document.createElement('div');
    div.classList.add('message');

    if(sender === username) {
        div.classList.add('self'); // Alinha à direita
        div.innerHTML = `<span class="msg-text">${text}</span>`;
    } else if(sender === 'system') {
        div.classList.add('system');
        div.textContent = text;
    } else {
        div.classList.add('other'); 
        div.innerHTML = `<span class="msg-sender">${sender}</span><span class="msg-text">${text}</span>`;
    }

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function connect() {
    const socket = new SockJS(
        'https://583bdbfae0a5.ngrok-free.app/chat-websocket',
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
    );
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame){
        console.log("Connected! " + frame);

        stompClient.subscribe("/topic/public", function(messageOutput){
            const message = JSON.parse(messageOutput.body);

            if(message.type === "JOIN") {
                addMessage('system', `${message.sender} entrou no chat`);
            } else if(message.type === "CHAT") {
                addMessage(message.sender, message.content);
            }
        });

        if(username) {
            stompClient.send("/app/addUser", {}, JSON.stringify({sender: username, type: "JOIN"}));
        }
    });
}

sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if(!text) return;

    if(!username){
        username = text;
        addMessage('system', `${username} entrou no chat`);
        input.placeholder = "Envie uma mensagem";
        connect();
    } else {
        addMessage(username, text);

        if(stompClient && stompClient.connected){
            stompClient.send("/app/sendMessage", {}, JSON.stringify({sender: username, type:"CHAT", content:text}));
        }
    }

    input.value = '';
});

input.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendBtn.click();
});
