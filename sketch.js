// Dapr hat cam
// Marc Duiker, July 2023
// @marcduiker

let video;
let poseNet;
let poses = [];
let daprImage;
const imageW = 600;
const imageH = 350;

function setup() {
    frameRate(15);
    let canv = createCanvas(640, 480);
    canv.parent('sketch')
    daprImage = loadImage('Dappy_600x350.png');
    video = createCapture(VIDEO);
    video.size(width, height);

    poseNet = ml5.poseNet(video, modelReady);
    poseNet.on('pose', function (results) {
        poses = results;
    });
    video.hide();
}

function modelReady() {
    select('#status').remove();
}

function draw() {
    image(video, 0, 0, width, height);
    drawLine();
}

function drawLine() {
    poses.forEach(
        pose => {
            //console.log(pose);
            if (pose.pose.leftEye.confidence > 0.9 && pose.pose.rightEye.confidence > 0.9) {
                const leftEyeX = pose.pose.leftEye.x;
                const leftEyeY = pose.pose.leftEye.y;

                const rightEyeX = pose.pose.rightEye.x;
                const rightEyeY = pose.pose.rightEye.y;

                const midX = rightEyeX + (leftEyeX - rightEyeX) / 2;
                const midY = rightEyeY + (leftEyeY - rightEyeY) / 2;

                const eyeDist = dist(leftEyeX, leftEyeY, rightEyeX, rightEyeY);
                //console.log(leftEyeX, rightEyeX, eyeDist);
                const factor = map(eyeDist, 0, 100, 6, 1);
                const scaledW = imageW / factor;
                const scaledH = imageH / factor;

                push();
                translate(midX, midY);
                const angle = atan2(leftEyeY - rightEyeY, leftEyeX - rightEyeX);
                rotate(angle);
                image(daprImage, -scaledW / 2, -scaledH * 1.2, scaledW, scaledH);
                pop();
            }
        });

}
