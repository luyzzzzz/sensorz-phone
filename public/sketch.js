let sensor;
let particles = [];

let interactionActive = false;
let interactionAmount = 0;

let socket = null;


// ==========================================
// SETUP
// ==========================================

function setup() {

    createCanvas(
        windowWidth,
        windowHeight
    );


    sensor = {

        x: width / 2,
        y: height / 2,

        vx: 0,
        vy: 0,

        ax: 0,
        ay: 0,
        az: 0,

        gx: 0,
        gy: 0,
        gz: 0
    };


    // ======================================
    // Création du nuage
    // ======================================

    for (let i = 0; i < 120; i++) {

        particles.push({

            angle:
                random(TWO_PI),

            radius:
                random(8, 22) +
                randomGaussian() * 3,

            noiseX:
                random(1000),

            noiseY:
                random(1000),

            size:
                random(1.2, 3),

            alpha:
                random(40, 90)

        });

    }


    noStroke();


    // ======================================
    // WebSocket
    // ======================================

    setupWebSocket();


    // ======================================
    // Interaction
    // ======================================

    setupInteraction();
}


// ==========================================
// DRAW
// ==========================================

function draw() {

    // ======================================
    // Transition douce ON / OFF
    // ======================================

    if (interactionActive) {

        interactionAmount = lerp(
            interactionAmount,
            1,
            0.05
        );

    } else {

        interactionAmount = lerp(
            interactionAmount,
            0,
            0.05
        );

    }


    // ======================================
    // Fond
    // ======================================

    const activeAlpha =
        lerp(45, 18, interactionAmount);

    const activeRed =
        lerp(5, 10, interactionAmount);

    const activeGreen =
        lerp(5, 20, interactionAmount);

    const activeBlue =
        lerp(8, 60, interactionAmount);


    background(
        activeRed,
        activeGreen,
        activeBlue,
        activeAlpha
    );


    // ======================================
    // Mise à jour du capteur
    // ======================================

    updateSensor();


    // ======================================
    // Nuage
    // ======================================

    drawSensor();


    // ======================================
    // Interface
    // ======================================

    updateInterface();
}


// ==========================================
// SENSOR
// ==========================================

function updateSensor() {

    const easing = 0.08;


    /*
        Quand l'interaction est OFF :
        le téléphone peut continuer à envoyer
        des données, mais elles ne déplacent
        pas le nuage.
    */

    if (!interactionActive) {

        sensor.vx = 0;
        sensor.vy = 0;

        return;
    }


    // ======================================
    // Position cible
    // ======================================

    const targetX =
        width / 2 +
        sensor.ax *
        width *
        0.08;


    const targetY =
        height / 2 +
        sensor.ay *
        height *
        0.08;


    // ======================================
    // Lissage
    // ======================================

    sensor.vx =
        (targetX - sensor.x) *
        easing;

    sensor.vy =
        (targetY - sensor.y) *
        easing;


    sensor.x +=
        sensor.vx *
        interactionAmount;

    sensor.y +=
        sensor.vy *
        interactionAmount;


    // ======================================
    // Limites
    // ======================================

    sensor.x = constrain(
        sensor.x,
        0,
        width
    );

    sensor.y = constrain(
        sensor.y,
        0,
        height
    );
}


// ==========================================
// DRAW SENSOR / PARTICULES
// ==========================================

function drawSensor() {

    const t =
        millis() * 0.0004;


    for (let p of particles) {


        // ==================================
        // Micro-frémissement
        // ==================================

        const driftX = map(

            noise(
                p.noiseX + t
            ),

            0,
            1,

            -4,
            4
        );


        const driftY = map(

            noise(
                p.noiseY + t
            ),

            0,
            1,

            -4,
            4
        );


        // ==================================
        // Rotation gyroscope
        // ==================================

        const rotation =
            sensor.gz *
            0.002 *
            interactionAmount;


        const currentAngle =
            p.angle +
            rotation;


        // ==================================
        // Position
        // ==================================

        const x =
            sensor.x +
            cos(currentAngle) *
            p.radius +
            driftX;


        const y =
            sensor.y +
            sin(currentAngle) *
            p.radius +
            driftY;


        // ==================================
        // Couleur / intensité
        // ==================================

        const onRed =
            lerp(
                220,
                255,
                interactionAmount
            );

        const onGreen =
            lerp(
                225,
                220,
                interactionAmount
            );

        const onBlue =
            lerp(
                230,
                170,
                interactionAmount
            );


        const particleAlpha =
            lerp(
                p.alpha * 0.6,
                p.alpha * 3,
                interactionAmount
            );


        fill(
            onRed,
            onGreen,
            onBlue,
            particleAlpha
        );


        circle(
            x,
            y,
            p.size
        );
    }
}


// ==========================================
// INTERACTION ON / OFF
// ==========================================

function setupInteraction() {

    const button =
        document.getElementById(
            "interactionButton"
        );


    button.addEventListener(
        "click",
        function() {

            interactionActive =
                !interactionActive;


            updateInteractionButton();

        }
    );
}


// ==========================================
// BOUTON INTERACTION
// ==========================================

function updateInteractionButton() {

    const button =
        document.getElementById(
            "interactionButton"
        );


    if (interactionActive) {

        button.textContent = "ON";

        button.className =
            "interaction-on";

    } else {

        button.textContent = "OFF";

        button.className =
            "interaction-off";
    }
}


// ==========================================
// WEBSOCKET
// ==========================================

function setupWebSocket() {

    const input =
        document.getElementById(
            "wsUrl"
        );

    const button =
        document.getElementById(
            "connectButton"
        );


    input.value =
        `ws://${window.location.hostname}:8080`;


    button.addEventListener(
        "click",
        connectWebSocket
    );
}


// ==========================================
// CONNEXION WEBSOCKET
// ==========================================

function connectWebSocket() {

    const input =
        document.getElementById(
            "wsUrl"
        );


    const url =
        input.value.trim();


    if (!url) {

        console.error(
            "Adresse WebSocket vide."
        );

        return;
    }


    if (socket) {

        socket.close();

    }


    console.log(
        "Connexion WebSocket :",
        url
    );


    socket =
        new WebSocket(url);


    socket.onopen =
        function() {

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

    } catch (error) {

        console.log(
            "Message non JSON :",
            message
        );

        return;
    }


    // ======================================
    // Accéléromètre
    // ======================================

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


    // ======================================
    // Gyroscope
    // ======================================

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


    // ======================================
    // Format plat accélération
    // ======================================

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


    // ======================================
    // Format plat gyroscope
    // ======================================

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
// INTERFACE CAPTEURS
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

    } else {

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