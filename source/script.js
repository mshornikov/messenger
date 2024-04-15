const ws = new WebSocket(`ws://${window.document.location.host}`);
ws.binaryType = 'blob';

ws.addEventListener('open', () => {
    console.log('Websocket connection opened');
});

ws.addEventListener('close', () => {
    console.log('Websocket connection closed');
});

ws.onmessage = (message) => {
    const messageBlock = document.createElement('li');

    if (message.data instanceof Blob) {
        reader = new FileReader();
        reader.readAsText(message.data);
        reader.onload = () => {
            messageBlock.innerText = reader.result;
            document.querySelector('ul').appendChild(messageBlock);
        };
    }
};

const form = document.querySelector('form');

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = document.querySelector('input').value;
    if (message !== '') {
        ws.send(message);
        document.querySelector('input').value = '';
    }
});
