window.onload = () => {
    const roomName = JSON.parse(document.getElementById('room_name').textContent);
    const control = JSON.parse(document.getElementById('control').textContent);
    const ready_button = document.getElementById("readiness");
    const white_ready = document.getElementById("white_ready");
    const black_ready = document.getElementById("black_ready");
    const countdown_display = document.getElementById("countdown");
    const ready_text = "Gotowy";
    const unready_text = "Nie gotowy";

    let ready_state = false;
    let countdown_number = -1;

    let chatSocket;

    connect = function() {
        chatSocket = new WebSocket(
            'ws://'
            + window.location.host
            + '/ws/lobby/'
            + roomName
            + '/'
        );
    }
    connect();

    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        console.log(data);

        if (data.hasOwnProperty("countdown")) {
            if (data["countdown"]) {
                start_countdown();
            } else {
                stop_countdown();
            }
            return;
        }

        if (data["player"] == "white") {
            white_ready.innerText = data["ready"] ? ready_text : unready_text;
        } else {
            black_ready.innerText = data["ready"] ? ready_text : unready_text;
        }
        if (data["player"] == control) {
            if (data["ready"]) {
                ready();
            }
            else {
                unready();
            }
        }
    };

    chatSocket.onclose = function(e) {
        console.error('Chat socket closed unexpectedly');
        setTimeout(function() {connect();}, 1000);
    };

    ready = function() {          
            ready_button.value = "Nie gotowy";
            ready_state = true;
    }

    send_ready = function () {
        if (!ready_state) {
            chatSocket.send(JSON.stringify({
                'ready': true
            }));
            ready();
        }
    }

    unready = function () {
        ready_button.value = ready_text;
        ready_state = false;
    }

    send_unready = function () {
        if (ready_state) {
            chatSocket.send(JSON.stringify({
                'ready': false
            }));
            unready();
        }
    }

    start_countdown = function () {
        
        let countdown = () => {
            if (countdown_number == -1) {
                countdown_display.innerText = "";
                return;
            }
            else if (countdown_number == 0) {
                window.location.href = window.location.protocol
                                     + "//"
                                     + window.location.host 
                                     + "/online/room/"
                                     + roomName
                                     + "/play/";
            }
            else {
                countdown_number -= 1;
                countdown_display.innerText = countdown_number;
            }
        };
        countdown_number = 6;
        setInterval(countdown, 1000);
    }

    stop_countdown = function() {
        countdown_number = -1;
    }

    ready_button.onclick = () => {
        if (ready_state) {
            send_unready();
        }
        else {
            send_ready();
        }
        
    }
}