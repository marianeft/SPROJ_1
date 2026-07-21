import { Application, Graphics, Text, TextStyle } from 'pixi.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const app = new Application({
  view: canvas,
  width: 640,
  height: 480,
  backgroundColor: 0x1a120a,
  antialias: false,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true
});

const titleStyle = new TextStyle({
  fontFamily: 'Courier New',
  fontSize: 32,
  fill: 0xe8d5a3,
  align: 'center'
});

const title = new Text('Hello PixiJS!', titleStyle);
title.anchor.set(0.5);
title.position.set(320, 120);
app.stage.addChild(title);

const player = new Graphics();
player.beginFill(0x3b82f6);
player.drawRect(-32, -32, 64, 64);
player.endFill();
player.position.set(320, 280);
app.stage.addChild(player);

let direction = 1;
app.ticker.add(() => {
  const speed = 3 * app.ticker.deltaTime;
  player.x += speed * direction;

  if (player.x > 560 || player.x < 80) {
    direction *= -1;
  }
});
