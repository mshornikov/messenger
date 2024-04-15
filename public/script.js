let w = new WebSocket(`ws://${window.document.location.host}`);
w.binaryType = 'blob';

w.onmessage = (m) => {
    let b = document.createElement('li');

    if (m.data instanceof Blob) {
        r = new FileReader();
        r.readAsText(m.data);
        r.onload = () => {
            b.innerText = r.result;
            document.querySelector('link').append(b);
        };
    }
};

document.querySelector('input').addEventListener('change', (e) => {
    let b = e.target;
    let m = b.value;
    if (m != '') {
        w.send(m);
        b.value = '';
    }
});
