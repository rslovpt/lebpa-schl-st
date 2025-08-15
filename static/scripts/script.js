const socket = io();
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let userID = null

function float32ToInt16(float32Array) {
const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}

async function getMicrophoneAccess() {
try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(8192, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination); // Keeps it alive

    processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const int16 = float32ToInt16(input);
        socket.emit('client_audio', int16.buffer);
    };
} catch (err) {
    console.error('Mic access error:', err);
}
}

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('server_message', (msg) => {
    console.log('Server message:', msg);
});

socket.on('establishUserCredential', (user) => {
    userID = user;
    document.getElementById('UserID').innerText = 'User ' + userID;
});

socket.on('audio_data', async (data) => {
    const int16 = new Int16Array(data);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 0x7FFF;
    }

    const audioBuffer = audioContext.createBuffer(1, float32.length, audioContext.sampleRate);
    audioBuffer.getChannelData(0).set(float32);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
 });

socket.on('update', (jsonData) => {
    const data = JSON.parse(jsonData);
    for (let i = 0; i < data.length; i++) {
        if (i == 0) {
            continue;
        } else {
            data[i] = " " + data[i];
        }
    }
    document.getElementById('users').innerText = 'Users: ' + data;
})


document.getElementById('micbutton').addEventListener('click', () => {
    audioContext.resume().then(() => {
        getMicrophoneAccess();
        document.getElementById('clicktoactive').innerText = 'ACTIVE'
    });
});


document.getElementById('setUsername').addEventListener('click', () => {
    console.log('Username set');
    const username = document.getElementById('username').value;

    socket.emit('client-control', JSON.stringify({
        type: 'setUsername',
        in: {username}
    }));
})