class MathHelper {
    randomInteger(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min);
    }

    lerp(a, b, n) {
        return a + ((b - a) * n);
    }

    scaleVector(v, s) {
        v.x *= s;
        v.y *= s;
    }

    normalizeVector(v) {
        const m = Math.sqrt(v.x * v.x + v.y * v.y);
        this.scaleVector(v, 1 / m);
    }

    dist(x1, y1, x2, y2) {
      const dx = x1 - x2;
      const dy = y1 - y2;
      return Math.sqrt(dx*dx+dy*dy);
    }
}
