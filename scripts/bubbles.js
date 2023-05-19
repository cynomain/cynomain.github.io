class bubble {
    constructor(canvasWidth, canvasHeight) {
      this.maxHeight = canvasHeight;
      this.maxWidth = canvasWidth;
      this.randomise();
    }
  
    generateDecimalBetween(min, max) {
      return (Math.random() * (min - max) + max).toFixed(2);
    }
  
    update() {
      this.posX = this.posX - this.movementX;
      this.posY = this.posY - this.movementY;
  
      if (this.posY < -10 || this.posX < -10 || this.posX > this.maxWidth + 10) {
        this.randomise();
        this.posY = this.maxHeight + 10;
      }
    }
  
    randomise() {
      this.colour = Math.random() * 360;
      this.size = this.generateDecimalBetween(25, 45);
      this.movementX = this.generateDecimalBetween(-0.1, 0.4);
      this.movementY = this.generateDecimalBetween(0.5, 1.5);
      this.posX = this.generateDecimalBetween(0, this.maxWidth);
      this.posY = this.generateDecimalBetween(0, this.maxHeight);
    }
  }
  
  class background {
    constructor() {
      this.canvas = document.getElementById("floatingBubbles");
      this.ctx = this.canvas.getContext("2d");
      this.canvas.height = window.innerHeight;
      this.canvas.width = window.innerWidth;
      this.bubblesList = [];
      this.generateBubbles();
      this.animate();
    }


    animate() {
      let self = this;
      self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
      self.bubblesList.forEach(function(bubble) {
        bubble.update();
        self.ctx.beginPath();
        self.ctx.arc(bubble.posX, bubble.posY, bubble.size, 0, 2 * Math.PI);
        self.ctx.fillStyle = "hsl(" + bubble.colour + ", 100%, 64%)";
        self.ctx.fill();
        self.ctx.strokeStyle = "hsl(" + bubble.colour + ", 100%, 64%)";
        self.ctx.stroke();
      });
  
      requestAnimationFrame(this.animate.bind(this));
    }
  
    addBubble(bubble) {
      return this.bubblesList.push(bubble);
    }
  
    generateBubbles() {
      let self = this;
      for (let i = 0; i < self.bubbleDensity(); i++) {
        self.addBubble(new bubble(self.canvas.width, self.canvas.height));
      }
    }
  
    bubbleDensity() {
      return Math.sqrt((this.canvas.height, this.canvas.width) * 2);
    }
  }
  

  var bg;

addEventListener("load", () => {
    bg = new background();
});

/*
addEventListener("resize", () => {
    bg.canvas.height = window.innerHeight;
    bg.canvas.width = window.innerWidth;
    console.log(window.innerWidth);
    console.log(bg.canvas.width);
});
*/
  
  window.requestAnimFrame = (function() {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      }
    );
  })();