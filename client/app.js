const socket = io();

let currentPartnerId = null;

// Page Navigation Function
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// 1. Enter Lobby
function enterLobby() {
    const nickname = document.getElementById('nickname').value || 'Anonymous';
    const mood = document.getElementById('mood').value;
    const topic = document.getElementById('topic').value || 'Anything';

    socket.emit('join_lobby', { nickname, mood, topics: [topic] });
    showPage('lobby-page');
}

// 2. Listen for Lobby Updates
socket.on('update_lobby', (users) => {
    const container = document.getElementById('users-container');
    container.innerHTML = ''; // Clear old list

    users.forEach(user => {
        if (user.socketId !== socket.id) { // Don't show ourselves
            const div = document.createElement('div');
            div.className = 'user-card';
            div.innerHTML = `
                <div>
                    <strong>${user.nickname}</strong> <br>
                    <small style="color: #6366f1;">${user.mood} | ${user.topics[0]}</small>
                </div>
                <button class="btn-glow" onclick="startChat('${user.socketId}', '${user.nickname}')">Start Chat</button>
            `;
            container.appendChild(div);
        }
    });
});

// 3. Start Chat
window.startChat = function(partnerId, partnerName) {
    currentPartnerId = partnerId;
    document.getElementById('chat-partner').innerText = `Chatting with ${partnerName}`;
    showPage('chat-page');
}

// 4. Send Message
window.sendMessage = function() {
    const input = document.getElementById('message-input');
    const text = input.value;
    
    if (text.trim() === '') return;

    // Show my message on my screen
    addMessageToBox(text, 'my-msg');

    // Send to server
    socket.emit('send_message', { receiverId: currentPartnerId, message: text });
    input.value = ''; // clear input
}

// 5. Receive Message
socket.on('receive_message', (data) => {
    // If we receive a message, make sure we go to the chat page!
    if (document.getElementById('chat-page').classList.contains('hidden') || !currentPartnerId) {
        currentPartnerId = data.senderId;
        showPage('chat-page');
    }
    addMessageToBox(data.message, 'their-msg');
});

// Helper: Add text to chat box
function addMessageToBox(text, className) {
    const box = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${className}`;
    msgDiv.innerText = text;
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight; // Auto-scroll down
}

// 6. Leave Chat
window.leaveChat = function() {
    currentPartnerId = null;
    document.getElementById('chat-box').innerHTML = ''; // Clear history
    showPage('lobby-page');
}