// Dapr hat cam
// Marc Duiker, Mar 2025
// @marcduiker

let video;
const desiredFrameRate = 15;
let bodyPose;
let poses = [];
let daprImage;
let connections;
const imageW = 600;
const imageH = 350;
const minWidth = 1080;
const desiredRatio = 16/9;
const ml5Confidence = 0.3;
let scaledWidth;
let scaledHeight;
let ratio;
const ratios = [1, 4/3, 3/2, 16/9];
let oldleftEyeX = 0;
let oldleftEyeY = 0;
let oldrightEyeX = 0;
let oldrightEyeY = 0;
let oldMidX = 0;
let oldMidY = 0;

function preload() {
    bodyPose = ml5.bodyPose(options = {enableSmoothing: true});
}

function setup() {
    frameRate(desiredFrameRate);
    daprImage = loadImage('Dappy_600x350.png');
    let constraints = {
        video: {
          mandatory: {
            minWidth: minWidth,
            aspectRatio: desiredRatio
          },
          optional: [{minFrameRate: desiredFrameRate}]
        },
        audio: false
      };
    video = createCapture(constraints);
    reset();
}

function reset() {
    select('#status').show();
    poses = null;
    scaledWidth = windowWidth;
    scaledHeight = scaledWidth / desiredRatio;
    console.log(scaledWidth, scaledHeight);
    video.size(scaledWidth, scaledHeight);
    video.hide();
    bodyPose.detectStart(video, gotPoses);
    connections = bodyPose.getSkeleton();

    let canv = createCanvas(scaledWidth, scaledHeight);
    canv.parent('sketch');
}

function windowResized() {
    reset();
    //resizeCanvas(windowWidth, windowHeight);
}

function gotPoses(results) {
    // Store the model's results in a global variable
    poses = results;
    modelReady();
  }

function modelReady() {
    select('#status').hide();
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
            if (pose.left_eye.confidence > ml5Confidence && pose.right_eye.confidence > ml5Confidence) {
                let leftEyeX = pose.left_eye.x;
                let leftEyeY = pose.left_eye.y;
                //ellipse(leftEyeX, leftEyeY, 10, 10);

                let rightEyeX = pose.right_eye.x;
                let rightEyeY = pose.right_eye.y;
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
                const minEyeDist = scaledWidth/100;
                const maxEyeDist = scaledWidth/10;
                const offsetH = map(eyeDist, minEyeDist, maxEyeDist, 1.2, 1.5);
                const scaledW = eyeDist * 3.5;
                const scaledH = eyeDist * 3.5 * imageH / imageW;

                push();
                translate(midX, midY);
                const angle = atan2(leftEyeY - rightEyeY, leftEyeX - rightEyeX);
                rotate(angle);
                image(daprImage, -scaledW / 2, -scaledH * offsetH, scaledW, scaledH);
                pop();
            }
        });
}
