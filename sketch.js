ONE_OUT_OFF = 50;

class Matter {
  constructor(x_object, y_object, r_object, r, sx, sy, x_object_s, y_object_s) {
    if (x_object_s !== undefined) {
      // fake overloading
      let m = sy / sx;
      let temp = Math.sqrt(1.0 + m * m);
      if (sy > 0.0) {
        this.positionY = ((r_object + r) * Math.abs(m)) / temp + y_object;
      } else {
        this.positionY = y_object - ((r_object + r) * Math.abs(m)) / temp;
      }
      if (sx > 0.0) {
        this.positionX = (r_object + r) / temp + x_object;
      } else {
        this.positionX = x_object - (r_object + r) / temp;
      }
      this.radius = r;
      this.xspeed = sx * Math.sqrt(ONE_OUT_OFF - 1) + x_object_s;
      this.yspeed = sy * Math.sqrt(ONE_OUT_OFF - 1) + y_object_s;
      this.alive = true;
    } else {
      this.positionX = x_object;
      this.positionY = y_object;
      this.radius = r_object; // map overlaoding
      this.xspeed = r; // map overlaoding
      this.yspeed = sx; // map overlaoding
      this.alive = true;
    }
  }

  display(app, drawVector) {
    app.stroke(0, 0.0);
    app.ellipse(
      this.positionX,
      this.positionY,
      this.radius * 2.0,
      this.radius * 2.0
    );
    if (drawVector) {
      app.fill(255.0, 50.0, 255.0);
      this.drawArrow(
        app,
        this.positionX,
        this.positionY,
        this.positionX + (this.xspeed * this.radius * this.radius) / 100.0,
        this.positionY + (this.yspeed * this.radius * this.radius) / 100.0
      );
    }
  }

  drawArrow(app, x1, y1, x2, y2) {
    app.stroke(28.0, 30.0, 42.0);
    app.line(x1, y1, x2, y2);
    app.push();
    app.translate(x2, y2);
    app.rotate(Math.atan2(x1 - x2, y2 - y1));
    app.line(0.0, 0.0, -2.0, -4.0);
    app.line(0.0, 0.0, 2.0, -4.0);
    app.pop();
  }

  move() {
    this.positionX += this.xspeed / 10.0;
    this.positionY += this.yspeed / 10.0;
  }

  wall(screenWidth, screenHeight) {
    if (this.radius > this.positionX) {
      this.xspeed *= -1.0;
      this.positionX = this.radius;
    }
    if (this.positionX > screenWidth - this.radius) {
      this.xspeed *= -1.0;
      this.positionX = screenWidth - this.radius;
    }
    if (this.radius > this.positionY) {
      this.yspeed *= -1.0;
      this.positionY = this.radius;
    }
    if (this.positionY > screenHeight - this.radius) {
      this.yspeed *= -1.0;
      this.positionY = screenHeight - this.radius;
    }
  }

  distance(a) {
    return Math.sqrt(
      (this.positionX - a.positionX) * (this.positionX - a.positionX) +
        (this.positionY - a.positionY) * (this.positionY - a.positionY)
    );
  }

  accelerateFrom(xx, yy) {
    let dx = xx - this.positionX;
    let dy = yy - this.positionY;
    let dt = Math.sqrt(dx * dx + dy * dy);
    this.xspeed -= dx / dt;
    this.yspeed -= dy / dt;
    let temp = this.radius;
    this.radius =
      (this.radius * Math.sqrt(ONE_OUT_OFF - 1)) / Math.sqrt(ONE_OUT_OFF);
    return new Matter(
      this.positionX,
      this.positionY,
      this.radius,
      (temp * Math.sqrt(1.0)) / Math.sqrt(ONE_OUT_OFF),
      dx / dt,
      dy / dt,
      this.xspeed,
      this.yspeed
    );
  }

  push_to(xx, yy, s) {
    let dx = xx - this.positionX;
    let dy = yy - this.positionY;
    let dt = Math.sqrt(dx * dx + dy * dy);
    this.xspeed += ((dx / dt) * s) / 40.0;
    this.yspeed += ((dy / dt) * s) / 40.0;
  }
}

class Game {
  constructor(app, srcWidth, srcHeight, type, difficulty) {
    this.cell = [];
    this.flag = true;
    this.mApp = app;
    this.mScreenHeight = srcHeight;
    this.mScreenWidth = srcWidth;
    this.cell.push(
      new Matter(
        app.random(15.0, srcWidth - 15),
        app.random(15.0, srcHeight - 15),
        15.0,
        0.0,
        0.0
      )
    );
    this.allocate_cell(app, difficulty * 10, 2, 30, 2);
  }

  allocate_cell(app, num_cells, min_r, max_r, max_speed) {
    for (let i = 1; i < num_cells; i++) {
      this.ran_r = app.random(min_r, max_r);
      do {
        this.flag = false;
        this.ran_x = app.random(max_r, this.mScreenWidth - max_r);
        this.ran_y = app.random(max_r, this.mScreenHeight - max_r);
        for (let j = 0; j < this.cell.length; j++) {
          const cellB = this.cell[j];
          if (
            Math.sqrt(
              (this.ran_x - cellB.positionX) * (this.ran_x - cellB.positionX) +
                (this.ran_y - cellB.positionY) * (this.ran_y - cellB.positionY)
            ) -
              this.ran_r -
              cellB.radius <
            5.0
          ) {
            this.flag = true;
          }
        }
      } while (this.flag);
      this.cell.push(
        new Matter(
          this.ran_x,
          this.ran_y,
          this.ran_r,
          app.random(-max_speed, max_speed) / (10 - num_cells * 10),
          app.random(-max_speed, max_speed) / (10 - num_cells * 10)
        )
      );
    }
  }

  begin() {
    background(220);
    this.calculate_collisions();
    if (GRAVITY != 0 && (!MENU || !nowYouCanDrawMenu)) {
      for (let i = 0; i < this.cell.length; i++) {
        for (let j = i + 1; j < this.cell.length; j++) {
          const cellA = this.cell[i];
          const cellB = this.cell[j];
          cellB.push_to(
            cellA.positionX,
            cellA.positionY,
            (gravity_force * (cellA.radius * cellA.radius)) /
              (cellA.distance(cellB) * cellA.distance(cellB))
          );
          cellA.push_to(
            cellB.positionX,
            cellB.positionY,
            (gravity_force * (cellB.radius * cellB.radius)) /
              (cellA.distance(cellB) * cellA.distance(cellB))
          );
        }
      }
    }
    for (let i2 = 0; i2 < this.cell.length; i2++) {
      if (this.cell[i2].alive && (!MENU || !nowYouCanDrawMenu)) {
        this.cell[i2].wall(this.mScreenWidth, this.mScreenHeight);
        this.cell[i2].move();
        let p = this.cell[i2].radius / this.cell[0].radius;
        if (p > 1.5) {
          p = 1.5;
        }
        if (p < 0.5) {
          p = 0.5;
        }
        let p2 = p - 0.5;
        fill(
          (183 * p2 + 100 * (1.0 - p2)) / (1.0 - p2 + p2),
          (43 * p2 + 185 * (1.0 - p2)) / (1.0 - p2 + p2),
          55.0
        );
        if (i2 == 0) {
          fill(60.0, 100.0, 250.0);
        }
        this.cell[i2].display(this.mApp, VECTOR);
      }
    }

    const distanceTuple = [];
    const me = this.cell[0];
    for (let i = 1; i < this.cell.length; i++) {
      if (this.cell[i].alive) {
        const distance = me.distance(this.cell[i]);
        distanceTuple.push([distance, this.cell[i]]);
      }
    }

    // my.size / biggest, // normalized my size

    const biggest = scrHeight > scrWidth ? scrHeight : scrWidth;
    const closest = distanceTuple.sort(([a], [b]) => a - b).splice(0, 1)
    const inputs = closest.map(([distance, from]) => {
      
      this.mApp.stroke(28.0, 30.0, 42.0);
      this.mApp.line(
        from.positionX,
        from.positionY,
        me.positionX,
        me.positionY
      );

      const normalizedRadius = from.radius / me.radius;
      const normalizedDistance = Math.max((distance - me.radius - from.radius) / from.radius, 0);

      const deltaVx = me.xspeed - from.xspeed;
      const deltaVy = me.yspeed - from.yspeed;
      const normalizedRelativeSpeedAngle = Math.atan2(deltaVy, deltaVx) / Math.PI;
      const normalizedRelativeSpeed = Math.sqrt(deltaVy * deltaVy + deltaVx * deltaVx);
      return {
        normalizedRadius,
        normalizedDistance,
        normalizedRelativeSpeedAngle,
        normalizedRelativeSpeed
      }
    })

    console.log(JSON.stringify(inputs, null, 3))
  }

  calculate_collisions() {
    for (let i = 0; i < this.cell.length; i++) {
      for (let j = i + 1; j < this.cell.length; j++) {
        const cellA = this.cell[i];
        const cellB = this.cell[j];
        const [big, small] =
          cellA.radius > cellB.radius ? [cellA, cellB] : [cellB, cellA];
        if (
          big.alive &&
          small.alive &&
          big.radius + small.radius > big.distance(small)
        ) {
          let overlap =
            (big.radius + small.radius - big.distance(small)) /
            (small.radius * 2.0);
          if (overlap > 1.0) {
            overlap = 1.0;
          }
          if (overlap == 1.0) {
            small.alive = false;
          }
          big.xspeed =
            (big.xspeed * (big.radius * big.radius) +
              small.xspeed * overlap * (small.radius * small.radius)) /
            (big.radius * big.radius + small.radius * small.radius * overlap);
          big.yspeed =
            (big.yspeed * big.radius * big.radius +
              small.yspeed * overlap * small.radius * small.radius) /
            (big.radius * big.radius + small.radius * overlap * small.radius);
          big.radius = Math.sqrt(
            big.radius * big.radius + small.radius * overlap * small.radius
          );
          small.radius *= Math.sqrt(1.0 - overlap);
        }
      }
    }
  }
}

let GRAVITY = 0;
let MENU = false;
let VECTOR = false;
let change_flag = false;
let dif = 3;
let gravity_force = 1;
let nowYouCanDrawMenu;
let scrHeight = 0;
let scrWidth = 0;
let thegame;

function setup() {
  scrHeight = windowHeight;
  scrWidth = windowWidth;
  smooth();
  createCanvas(scrWidth, scrHeight);
  thegame = new Game(this, scrWidth, scrHeight, 0, dif);
  textAlign(3);
  rectMode(3);

  frameRate(1000)
}

function draw() {
  if (!MENU || !nowYouCanDrawMenu) {
    if (change_flag) {
      thegame = new Game(this, scrWidth, scrHeight, 0, dif);
    }
    change_flag = false;
    thegame.begin();
    textSize(48.0);
    fill(28.0, 30.0, 42.0);
    if (!thegame.cell[0].alive) {
      text("Game Over", 150.0, scrHeight - 40);
    }
    textSize(15.0);
    if (!thegame.cell[0].alive) {
      text("Press anywhere to continue", 150.0, scrHeight - 20);
    }
    if (MENU && !nowYouCanDrawMenu) {
      nowYouCanDrawMenu = true;
    }
  } else {
    show();
  }
  textSize(20.0);
  fill(0.0, 0.0, 0.0);
  rect(scrWidth - 30, scrHeight - 30, 30.0, 30.0);
  fill(255.0, 255.0, 255.0);
  text("M", scrWidth - 30, scrHeight - 22);
}

function show() {
  MENU = true;
  push();
  translate(scrWidth / 2, scrHeight / 2);
  //let img = loadImage("logo.png");
  //image(img, ((-img.width) / 2), -180.0);
  stroke(0, 0.0);
  textSize(20.0);
  fill(28.0, 30.0, 42.0);
  rect(0.0, -110.0, 280.0, 40.0);
  fill(255.0, 255.0, 255.0);
  text("Resume Game", 0.0, -103.0);
  fill(28.0, 30.0, 42.0);
  rect(0.0, -65.0, 280.0, 40.0);
  fill(255.0, 255.0, 255.0);
  text("New Game", 0.0, -58.0);
  fill(28.0, 30.0, 42.0);
  rect(0.0, -20.0, 280.0, 40.0);
  fill(255.0, 255.0, 255.0);
  text("Difficulty", -10.0, -13.0);
  text(dif, 50.0, -13.0);
  if (GRAVITY == 1) {
    fill(97.0, 183.0, 48.0);
  } else if (GRAVITY == -1) {
    fill(0.0, 0.0, 128.0);
  } else {
    fill(192.0, 52.0, 51.0);
  }
  rect(0.0, 25.0, 280.0, 40.0);
  fill(255.0, 255.0, 255.0);
  if (GRAVITY == 1) {
    text("Gravitation", 0.0, 32.0);
  } else if (GRAVITY == -1) {
    text("Anti-Gravitation", 0.0, 32.0);
  } else {
    text("Gravitation", 0.0, 32.0);
  }
  if (VECTOR) {
    fill(97.0, 183.0, 48.0);
  } else {
    fill(192.0, 52.0, 51.0);
  }
  rect(0.0, 70.0, 280.0, 40.0);
  fill(255.0, 255.0, 255.0);
  text("Momentum's Vector", 0.0, 77.0);
  if (GRAVITY != 0) {
    fill(28.0, 30.0, 42.0);
    rect(0.0, 115.0, 280.0, 40.0);
    fill(255.0, 255.0, 255.0);
    text("Gravity X" + gravity_force, 0.0, 122.0);
  }
  pop();
  textSize(15.0);
  fill(255.0, 255.0, 255.0, 12.0);
  text("© kirill Kulakov", 60.0, 25.0);
  textSize(15.0);
  fill(255.0, 255.0, 255.0, 12.0);
  text("Version 0.4", scrWidth - 50, 25.0);
}

function mousePressed(event) {
  if (event.type === "mousedown") {
    if (!MENU) {
      matterArr = thegame.cell;
      game = thegame;
      matterArr.push(thegame.cell[0].accelerateFrom(this.mouseX, this.mouseY));
    }
    if (!thegame.cell[0].alive) {
      thegame = new Game(this, scrWidth, scrHeight, 0, dif);
    }
    menucheck();
  }
}

function menucheck() {
  if (overRect(0, -110, 280, 40) && MENU) {
    MENU = false;
  }
  if (overRect(0, -65, 280, 40) && MENU) {
    MENU = false;
    thegame = new Game(this, scrWidth, scrHeight, 0, dif);
  }
  if (overRect(0, -20, 280, 40) && MENU) {
    dif++;
    if (dif == 10) {
      dif = 1;
    }
    change_flag = true;
  }
  if (overRect(0, 25, 280, 40) && MENU) {
    if (GRAVITY == 1) {
      GRAVITY = -1;
      gravity_force *= -1;
    } else if (GRAVITY == -1) {
      GRAVITY = 0;
      gravity_force *= -1;
    } else {
      GRAVITY = 1;
    }
    nowYouCanDrawMenu = false;
  }
  if (overRect(0, 70, 280, 40) && MENU) {
    VECTOR = !VECTOR;
  }
  if (GRAVITY != 0) {
    if (overRect(0, 115, 280, 40) && MENU) {
      gravity_force *= 2;
    }
    if (gravity_force > 256) {
      gravity_force /= PConstants.OVERLAY;
    }
  }
  if (overRectN(scrWidth - 30, scrHeight - 30, 30, 30)) {
    MENU = !MENU;
  }
}

function overRect(x, y, width, height) {
  if (
    this.mouseX < scrWidth / 2 + x - width / 2 ||
    this.mouseX > scrWidth / 2 + x + width / 2 ||
    this.mouseY < scrHeight / 2 + y - height / 2 ||
    this.mouseY > scrHeight / 2 + y + height / 2
  ) {
    return false;
  }
  return true;
}

function overRectN(x, y, width, height) {
  if (
    this.mouseX < x - width / 2 ||
    this.mouseX > width / 2 + x ||
    this.mouseY < y - height / 2 ||
    this.mouseY > height / 2 + y
  ) {
    return false;
  }
  return true;
}
