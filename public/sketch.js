let particles = [];

const PARTICLE_COUNT = 180;

let sensor = {
    ax: 0,
    ay: 0,
    az: 0,

    gx: 0,
    gy: 0,
    gz: 0
};

let socket = null;

let targetX;
let targetY;

let sensorX;
let sensorY;

let energy = 0;


// ==========================================
// SETUP
// ==========================================

function setup() {

    createCanvas(windowWidth, windowHeight);

    targetX = width / 2;
    targetY = height / 2;

    sensorX = width / 2;
    sensorY = height / 2;

    createParticles();

    setupWebSocket();

}


// ==========================================
// PARTICULES
// ==========================================

function createParticles() {

    particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {

        particles.push({

            x: random(width),
            y: random(height),

            vx: random(-1, 1),
            vy: random(-1, 1),

            size: random(2, 7),

            noiseOffset: random(1000)

        });

    }

}


// ==========================================
// DRAW
// ==========================================

function draw() {

    background(5, 5, 8);

    updateSensor();

    updateParticles();

    drawParticles();

    drawSensor();

    updateInterface();

}


// ==========================================
// SENSOR
// ==========================================

function updateSensor() {

    /*
        Pour l'instant, on utilise
        l'accéléromètre comme force
        de déplacement.

        AX → déplacement horizontal
        AY → déplacement vertical
    */

    targetX += sensor.ax * 8;
    targetY += sensor.ay * 8;

    targetX = constrain(
        targetX,
        0,
        width
    );

    targetY = constrain(
        targetY,
        0,
        height
    );


    /*
        Lissage du mouvement
    */

    sensorX = lerp(
        sensorX,
        targetX,
        0.08
    );

    sensorY = lerp(
        sensorY,
        targetY,
        0.08
    );


    /*
        Calcul d'une énergie globale
    */

    energy =

        abs(sensor.ax) +
        abs(sensor.ay) +
        abs(sensor.az) +

        abs(sensor.gx) * 0.1 +
        abs(sensor.gy) * 0.1 +
        abs(sensor.gz) * 0.1;

}


// ==========================================
// PARTICULES UPDATE
// ==========================================

function updateParticles() {

    for (let p of particles) {

        /*
            Mouvement naturel
        */

        let angle = noise(
            p.noiseOffset,
            frameCount * 0.003
        ) * TWO_PI * 2;

        p.vx += cos(angle) * 0.02;
        p.vy += sin(angle) * 0.02;


        /*
            Influence du téléphone
        */

        let dx = sensorX - p.x;
        let dy = sensorY - p.y;

        let distance = sqrt(
            dx * dx +
            dy * dy
        );

        if (distance > 1) {

            let force = 0.02;

            p.vx += dx / distance * force;
            p.vy += dy / distance * force;

        }


        /*
            Gyroscope Z :
            rotation du champ
        */

        let rotationForce = sensor.gz * 0.0005;

        p.vx += -dy * rotationForce;
        p.vy += dx * rotationForce;


        /*
            Friction
        */

        p.vx *= 0.985;
        p.vy *= 0.985;


        /*
            Position
        */

        p.x += p.vx;
        p.y += p.vy;


        /*
            Rebonds sur les bords
        */

        if (p.x < 0) {

            p.x = 0;
            p.vx *= -0.8;

        }

        if (p.x > width) {

            p.x = width;
            p.vx *= -0.8;

        }

        if (p.y < 0) {

            p.y = 0;
            p.vy *= -0.8;

        }

        if (p.y > height) {

            p.y = height;
            p.vy *= -0.8;

        }

    }

}


// ==========================================
// DRAW PARTICULES
// ==========================================

function drawParticles() {

    noStroke();

    for (let p of particles) {

        let dynamicSize =

            p.size +

            energy * 1.5;


        let alpha =

            80 +

            min(
                energy * 20,
                160
            );


        fill(
            255,
            255,
            255,
            alpha
        );


        circle(
            p.x,
            p.y,
            dynamicSize
        );

    }

}


// ==========================================
// CENTRE DU CAPTEUR
// ==========================================

function drawSensor() {

    /*
        Cercle central représentant
        la position du téléphone.
    */

    let radius =

        20 +

        energy * 5;

    noFill();

    stroke(
        255,
        255,
        255,
        80
    );

    strokeWeight(1);

    circle(
        sensorX,
        sensorY,
        radius
    );


    /*
        Point central
    */

    noStroke();

    fill(
        255,
        255,
        255,
        180
    );

    circle(
        sensorX,
        sensorY,
        5
    );

}


// ==========================================
// WEBSOCKET
// ==========================================

function setupWebSocket() {

    const input =
        document.getElementById("wsUrl");

    const button =
        document.getElementById("connectButton");


    /*
        Adresse par défaut
    */

    input.value =
        `ws://${window.location.hostname}:8080`;


    button.addEventListener(
        "click",
        connectWebSocket
    );

}


// ==========================================
// CONNEXION
// ==========================================

function connectWebSocket() {

    const input =
        document.getElementById("wsUrl");

    const url =
        input.value.trim();


    if (socket) {

        socket.close();

    }


    console.log(
        "Connexion WebSocket :",
        url
    );


    socket =
        new WebSocket(url);


    socket.onopen = function() {

        console.log(
            "WebSocket connecté"
        );

        setConnectionStatus(
            true
        );

    };


    socket.onmessage =
        function(event) {

            console.log(
                "Message reçu :",
                event.data
            );

            receiveCoMote(
                event.data
            );

        };


    socket.onerror =
        function(error) {

            console.error(
                "Erreur WebSocket :",
                error
            );

            setConnectionStatus(
                false
            );

        };


    socket.onclose =
        function() {

            console.log(
                "WebSocket déconnecté"
            );

            setConnectionStatus(
                false
            );

        };

}


// ==========================================
// RECEPTION COMOTE
// ==========================================

function receiveCoMote(message) {

    let data;

    try {

        data =
            JSON.parse(message);

    }

    catch (error) {

        console.log(
            "Message non JSON :",
            message
        );

        return;

    }


    /*
        Format accélération
    */

    if (data.accelerometer) {

        sensor.ax =
            Number(
                data.accelerometer.x || 0
            );

        sensor.ay =
            Number(
                data.accelerometer.y || 0
            );

        sensor.az =
            Number(
                data.accelerometer.z || 0
            );

    }


    /*
        Format gyroscope
    */

    if (data.gyroscope) {

        sensor.gx =
            Number(
                data.gyroscope.x || 0
            );

        sensor.gy =
            Number(
                data.gyroscope.y || 0
            );

        sensor.gz =
            Number(
                data.gyroscope.z || 0
            );

    }


    /*
        Format plat
    */

    if (
        data.ax !== undefined ||
        data.ay !== undefined ||
        data.az !== undefined
    ) {

        sensor.ax =
            Number(data.ax || 0);

        sensor.ay =
            Number(data.ay || 0);

        sensor.az =
            Number(data.az || 0);

    }


    if (
        data.gx !== undefined ||
        data.gy !== undefined ||
        data.gz !== undefined
    ) {

        sensor.gx =
            Number(data.gx || 0);

        sensor.gy =
            Number(data.gy || 0);

        sensor.gz =
            Number(data.gz || 0);

    }

}


// ==========================================
// INTERFACE
// ==========================================

function updateInterface() {

    document.getElementById("ax")
        .textContent =
        sensor.ax.toFixed(3);

    document.getElementById("ay")
        .textContent =
        sensor.ay.toFixed(3);

    document.getElementById("az")
        .textContent =
        sensor.az.toFixed(3);


    document.getElementById("gx")
        .textContent =
        sensor.gx.toFixed(3);

    document.getElementById("gy")
        .textContent =
        sensor.gy.toFixed(3);

    document.getElementById("gz")
        .textContent =
        sensor.gz.toFixed(3);

}


// ==========================================
// STATUT
// ==========================================

function setConnectionStatus(
    connected
) {

    const element =
        document.getElementById(
            "connectionStatus"
        );


    if (connected) {

        element.textContent =
            "● CONNECTÉ";

        element.className =
            "connected";

    }

    else {

        element.textContent =
            "○ DÉCONNECTÉ";

        element.className =
            "disconnected";

    }

}


// ==========================================
// RESIZE
// ==========================================

function windowResized() {

    resizeCanvas(
        windowWidth,
        windowHeight
    );

}
