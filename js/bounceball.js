(function( BounceBall, undefined) {

  var FPS = 60

  BounceBall.init = function(canvasID) {
    var canvas = document.getElementById(canvasID)

    var game = new Game(canvas)

    window.addEventListener('keydown', function (e) { keyWasPressed(e.keyCode, game) }, true)
    window.addEventListener('keyup', function (e) { keyWasReleased(e.keyCode, game) }, true)

    setInterval(function () { loop(game) }, 1000 / FPS)
  }

  function loop (game) {
    game.update()
    game.draw()
  }

  function keyWasPressed (keyCode, game) {
    if (keyCode === 87) {
      game.player1.movingUp = true
    } else if (keyCode === 83) {
      game.player1.movingDown = true
    } else if (keyCode === 38) {
      game.player2.movingUp = true
    } else if (keyCode === 40) {
      game.player2.movingDown = true
    }
  }

  function keyWasReleased (keyCode, game) {

    if (keyCode === 87 || keyCode === 83) {
      game.player1.stop()
    } else if (keyCode === 38 || keyCode === 40) {
      game.player2.stop()
    }
  }

  function Player (game, maxSpeed) {
    this.width = 10
    this.height = 40

    this.x = game.player1 ? game.canvas.width - this.width * 2 : this.width * 2
    this.y = game.canvas.height / 2 - this.height / 2

    this.game = game

    this.maxSpeed = maxSpeed || 12

    this.speed = 0

    this.score = 0

    this.movingUp = false
    this.movingDown = false

    var self = this

    this.move = function () {
      if (self.movingUp) {
        if (self.y > 0) {

          self.accelerate()
          self.y -= self.speed

        }
      } else if (self.movingDown) {
        if (self.y < self.game.canvas.height - self.height) {

          self.accelerate()
          self.y += self.speed

        }
      }
    }

    this.stop = function () {
      self.movingUp = false
      self.movingDown = false
      self.speed = 0
    }

    this.accelerate = function () {
      if (self.speed < self.maxSpeed) {
        self.speed += 2
      }
    }

    this.collidedWithBall = function (ball) {

      ball.xVelocity = ball.xVelocity > 0 ? (ball.xVelocity + 0.5) * -1 : (ball.xVelocity - 0.5) * -1

      // prevent overlapping multiple collisions
      if (ball.x < ball.game.canvas.width / 2) {
        ball.x = self.x + self.width
      } else {
        ball.x = self.x - ball.width
      }

      self.affectBallYVelocity(ball)
    }

    this.affectBallYVelocity = function (ball) {

      // Ball's y speed is affected by how fast the paddle is moving on impact
      var speedModifier = self.speed / self.maxSpeed
      var newSpeed = ball.maxYVelocity * speedModifier

      ball.yVelocity = newSpeed > ball.minYVelocity ? newSpeed : ball.minYVelocity

      // Ball's y direction is affected by direction the paddle is moving on impact
      if (self.movingUp) {
        ball.yVelocity = Math.abs(ball.yVelocity) * -1
      } else if (self.movingDown) {
        ball.yVelocity = Math.abs(ball.yVelocity)
      }
    }

    this.didScore = function () {
      self.score += 1
    }

    this.reset = function () {
      self.y = self.game.canvas.height / 2 - self.height / 2
      self.score = 0
    }

    this.draw = function (ctx) {
      ctx.fillStyle = '#FF0000'
      ctx.fillRect(self.x, self.y, self.width, self.height)
    }
  }

  function Ball (game) {
    this.x = game.canvas.width / 2
    this.y = game.canvas.height / 2

    this.xVelocity = -2
    this.yVelocity = 5

    this.minYVelocity = 2
    this.maxYVelocity = 10

    this.game = game

    this.width = 10
    this.height = 10

    var self = this

    this.move = function () {
      self.checkCollisions()
      self.x += self.xVelocity
      self.y += self.yVelocity
    }

    this.reset = function () {
      self.x = 245
      self.y = 245
      self.xVelocity = -2
      self.yVelocity = 5
    }

    this.draw = function (ctx) {
      ctx.fillRect(self.x, self.y, self.width, self.height)
    }

    this.checkCollisions = function () {
      self.checkHorizontalCollision()
      self.checkVerticalCollision()

      self.checkPlayerCollision(self.game.player1)
      self.checkPlayerCollision(self.game.player2)
    }

    this.checkHorizontalCollision = function () {
      if (self.y <= 0) {
        self.yVelocity *= -1
      } else if (self.y > self.game.canvas.height) {
        self.yVelocity *= -1
      }
    }

    this.checkVerticalCollision = function () {
      if (self.x <= 0) {
        self.game.playerDidScore(self.game.player2)
      } else if (self.x >= self.game.canvas.width) {
        self.game.playerDidScore(self.game.player1)
      }
    }

    this.checkPlayerCollision = function (player) {
      if (Utils.didCollide(player, self)) {
        player.collidedWithBall(self)
      }
    }
  }

  function Game (canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')

    this.player1 = new Player(this)
    this.player2 = new Player(this)
    this.ball = new Ball(this)

    var self = this

    this.update = function () {
      self.player1.move()
      self.player2.move()
      self.ball.move()
    }

    this.draw = function () {
      self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height)

      self.player1.draw(self.ctx)
      self.player2.draw(self.ctx)
      self.ball.draw(self.ctx)
      self.drawScore()
    }

    this.drawScore = function () {
      self.ctx.font = '40px Inconsolata'
      self.ctx.fillText(self.player1.score, 200, 40)
      self.ctx.fillText(self.player2.score, 300, 40)
    }

    this.reset = function () {
      self.ball.reset()
      self.player1.reset()
      self.player2.reset()
    }

    this.playerDidScore = function (player) {
      player.didScore()
      self.ball.reset()
    }
  }

  var Utils = {
    didCollide: function (obj1, obj2) {
      return (obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.height + obj1.y > obj2.y)
    }
  }

}( window.BounceBall = window.BounceBall || {} ));
