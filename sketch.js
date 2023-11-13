// Dapr hat cam
// Marc Duiker, July 2023
// @marcduiker

let video;
let poseNet;
let poses = [];
let daprImage;
const imageW = 600;
const imageH = 350;
const minWidth = 1080;
const ml5Confidence = 0.9;
let scaledWidth;
let scaledHeight;
let ratio;
const ratios = [1, 3/2, 16/9];
let oldleftEyeX = 0;
let oldleftEyeY = 0;
let oldrightEyeX = 0;
let oldrightEyeY = 0;
let oldMidX = 0;
let oldMidY = 0;

function setup() {
    frameRate(30);
    radio = createRadio();
    radio.option(0, '1:1');
    radio.option(1, '3:2');
    radio.option(2, '16:9');
    radio.style('width', '140px');
    radio.style('font-family', 'Space Grotesk');
    radio.style('font-size', '16px');
    radio.style('color', '#fff');
    radio.style('padding', '8px');
    radio.changed(() => {
        ratioChanged();
    });
    radio.position(windowWidth / 2 - 70, 10);
    radio.hide();
    
    daprImage = loadImage('Dappy_600x350.png');
    let constraints = {
        video: {
          mandatory: {
            minWidth: minWidth
          },
          optional: [{ maxFrameRate: 15 }]
        },
        audio: false
      };
    video = createCapture(constraints, VIDEO);
    //console.log(video.width, video.height);

    ratio = video.width / video.height;
    reset();
}

function reset() {
    select('#status').show();
    radio.hide();
    poses = null;
    scaledWidth = windowWidth;
    scaledHeight = scaledWidth / ratio;
    if (scaledHeight > windowHeight) {
        scaledHeight = windowHeight;
        scaledWidth = scaledHeight * ratio;
    }
    console.log(scaledWidth, scaledHeight);
    video.size(scaledWidth, scaledHeight);

    poseNet = ml5.poseNet(video, modelReady);
    poseNet.on('pose', function (results) {
        poses = results;
    });
    video.hide();

    let canv = createCanvas(scaledWidth, scaledHeight);
    canv.parent('sketch');
}

function ratioChanged() {
    clear();
    ratio = ratios[radio.value()];
    reset();
}

function modelReady() {
    select('#status').hide();
    radio.show();
}

function draw() {
    image(video, 0, 0, scaledWidth, scaledHeight);
    drawLine();
    drawText();
}

function drawText() {
    fill(255);
    noStroke();
    textFont('Space Grotesk');
    textSize(18);
    textAlign(LEFT, BOTTOM);
    text('Dapr: APIs for Building Secure and Reliable Microservices | dapr.io', 10, height - 10);
}

function drawLine() {
    if (poses == null) return;
    poses.forEach(
        pose => {
            //console.log(pose);
            if (pose.pose.leftEye.confidence > ml5Confidence && pose.pose.rightEye.confidence > ml5Confidence) {
                let leftEyeX = pose.pose.leftEye.x;
                let leftEyeY = pose.pose.leftEye.y;
                //ellipse(leftEyeX, leftEyeY, 10, 10);

                let rightEyeX = pose.pose.rightEye.x;
                let rightEyeY = pose.pose.rightEye.y;
                //ellipse(rightEyeX, rightEyeY, 10, 10);

                const midX = rightEyeX + (leftEyeX - rightEyeX) / 2;
                const midY = rightEyeY + (leftEyeY - rightEyeY) / 2;

                let threshold = 15;
                if (Math.abs(midX - oldMidX) > threshold || Math.abs(midY - oldMidY) > threshold) {
                    eyeDist = dist(leftEyeX, leftEyeY, rightEyeX, rightEyeY);
                    oldleftEyeX = leftEyeX;
                    oldleftEyeY = leftEyeY;
                    oldrightEyeX = rightEyeX;
                    oldrightEyeY = rightEyeY;
                    oldMidX = midX;
                    oldMidY = midY;
                } else {
                    // reuse old values
                    eyeDist = dist(oldleftEyeX, oldleftEyeY, oldrightEyeX, oldrightEyeY);
                    leftEyeX = oldleftEyeX;
                    leftEyeY = oldleftEyeY;
                    rightEyeX = oldrightEyeX;
                    rightEyeY = oldrightEyeY;
                }

                const factor = map(eyeDist, 15, 150, 6, 0.25);
                const offsetH = map(eyeDist, 15, 150, 1.5, 1.9);
                const scaledW = imageW / factor;
                const scaledH = imageH / factor;

                push();
                translate(midX, midY);
                const angle = atan2(leftEyeY - rightEyeY, leftEyeX - rightEyeX);
                rotate(angle);
                image(daprImage, -scaledW / 2, -scaledH * offsetH, scaledW, scaledH);
                pop();
            }
        });
}
