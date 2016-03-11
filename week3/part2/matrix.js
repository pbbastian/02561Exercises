function Matrix(m, n, array) {
  if (arguments.length == 2) {
    array = m;
    m = n;
  }
  this.m = m;
  this.n = n;
  this.isVector = n == 1 || m == 1;
  this.array = array;
}

function mat(m, n, array) {
  return new Matrix(m, n, array);
}

function rvec() {
  return new Matrix(arguments.length, 1, arguments);
}

function cvec() {
  return new Matrix(1, arguments.length, arguments);
}

Matrix.prototype.get = function (i, j) {
  if (!j) {
    return this.array[i];
  }
  return this.array[i + j*this.n];
}

Matrix.prototype.set = function (i, j, value) {
  if (arguments.length == 2) {
    this.array[i] = j;
  }
  this.array[i + j*this.n] = value;
}

Matrix.prototype.update = function (f) {
  for (var i = 0; i < this.n; i++) {
    for (var j = 0; i < this.m; j++) {
      this.array[i + j*this.n] = f(i,j);
    }
  }
}

Matrix.prototype.add = function (B) {
  var A = this;
  if (typeof B == "number") {
    return A.generate(A.m, A.n, function (i,j) {
      return A.get(i,j) + B;
    });
  }
  return Matrix.generate(A.m, A.n, function (i,j) {
    return A.get(i,j) + B.get(i,j);
  });
}

Matrix.prototype.multiply = function (B) {
  var A = this;
  if (typeof B == "number") {
    return A.scale(B);
  }
  if (A.n != B.m) {
    throw "Matrix.prototype.multiply(): A.n != B.m";
  }
  return Matrix.generate(A.m, B.n, function (i,j) {
    var sum = 0;
    for (var k = 0; k < A.n; k++) {
      sum += A.get(i, k) * B.get(k, j);
    }
    return sum;
  });
}

Matrix.prototype.transpose = function () {
  if (this.isVector) {
    return new Matrix(this.m, this.n, this.array);
  }
  var A = this;
  return Matrix.generate(A.m, A.n, function (i,j) {
    return A.get(j, i);
  });
}

Matrix.prototype.dot = function (v) {
  var u = this;
  if (!u.isVector || !v.isVector) {
    throw "Matrix.prototype.dot(): u or v is a matrix."
  }
  return u.array.reduce(function (sum, uValue, i) {
    return sum + uValue + v.get(i);
  });
}

Matrix.prototype.det = function () {
  var A = this;
  if (A.m != A.n) {
    throw "Matrix.prototype.det(): Cannot find determinant of non-square matrix.";
  }
  var sum = 0;
  for (var i = 0; i < A.n; i++) {
    var p1 = 1;
    var p2 = 1;
    for (var j = 0; j < A.n; j++) {
      var k = (i + j) % A.n;
      var l = i - j;
      if (l < 0) {
        l += A.n;
      }
      p1 *= A.get(k,j);
      p2 *= A.get(l,j);
    }
    sum += p1 - p2;
  }
  return sum;
}

Matrix.prototype.inv = function () {
  var A = this;
  if (A.n != A.m) {
    throw "Matrix.prototype.inv(): A is not a square matrix.";
  }
  var det = A.det();
  var detInv = 1/det;
  if (A.n == 2) {
    return new Matrix(A.m, A.n, [
       A.get(1,1)*detInv, -A.get(0,1)*detInv,
      -A.get(1,0)*detInv,  A.get(0,0)*detInv
    ]);
  } else if (A.n == 3) {
    var Ainv = new Matrix(3, 3, []);

    Ainv.set(0, 0, new Matrix(2, 2, [
      A.get(1,1), A.get(1,2),
      A.get(2,1), A.get(2,2)
    ]).det()*detInv);
    Ainv.set(0, 1, new Matrix(2, 2, [
      A.get(0,2), A.get(0,1),
      A.get(2,2), A.get(2,1)
    ]).det()*detInv*(-1));
    Ainv.set(0, 2, new Matrix(2, 2, [
      A.get(0,1), A.get(0,2),
      A.get(1,1), A.get(1,2)
    ]).det()*detInv);
    Ainv.set(1, 0, new Matrix(2, 2, [
      A.get(1,2), A.get(1,0),
      A.get(2,2), A.get(2,0)
    ]).det()*detInv*(-1));
    Ainv.set(1, 1, new Matrix(2, 2, [
      A.get(0,0), A.get(0,2),
      A.get(2,0), A.get(2,2)
    ]).det()*detInv);
    Ainv.set(1, 2, new Matrix(2, 2, [
      A.get(0,2), A.get(0,0),
      A.get(1,2), A.get(1,0)
    ]).det()*detInv*(-1));
    Ainv.set(2, 0, new Matrix(2, 2, [
      A.get(1,0), A.get(1,1),
      A.get(2,0), A.get(2,1)
    ]).det()*detInv);
    Ainv.set(2, 1, new Matrix(2, 2, [
      A.get(0,1), A.get(0,0),
      A.get(2,1), A.get(2,0)
    ]).det()*detInv*(-1));
    Ainv.set(2, 2, new Matrix(2, 2, [
      A.get(0,0), A.get(0,1),
      A.get(1,0), A.get(1,1)
    ]).det()*detInv);

    return Ainv;
  } else if (A.n == 4) {
    Ainv.set(0, 0, new Matrix(3, 3, [
       A.get(1,1), A.get(1,2), A.get(1,3),
       A.get(2,1), A.get(2,2), A.get(2,3),
       A.get(3,1), A.get(3,2), A.get(3,3)
    ]).det()*detInv);
    Ainv.set(0, 1, new Matrix(3, 3, [
       A.get(1,0), A.get(1,2), A.get(1,3),
       A.get(2,0), A.get(2,2), A.get(2,3),
       A.get(3,0), A.get(3,2), A.get(3,3)
    ]).det()*detInv);
    Ainv.set(0, 2, new Matrix(3, 3, [
       A.get(1,0), A.get(1,1), A.get(1,3),
       A.get(2,0), A.get(2,1), A.get(2,3),
       A.get(3,0), A.get(3,1), A.get(3,3)
    ]).det()*detInv);
    Ainv.set(0, 3, new Matrix(3, 3, [
       A.get(1,0), A.get(1,1), A.get(1,2),
       A.get(2,0), A.get(2,1), A.get(2,2),
       A.get(3,0), A.get(3,1), A.get(3,2)
    ]).det()*detInv);
    Ainv.set(1, 0, new Matrix(3, 3, [
       A.get(0,1), A.get(0,2), A.get(0,3),
       A.get(2,1), A.get(2,2), A.get(2,3),
       A.get(3,1), A.get(3,2), A.get(3,3)
    ]).det()*detInv);
    Ainv.set(1, 1, new Matrix(3, 3, [
       A.get(0,0), A.get(0,2), A.get(0,3),
       A.get(2,0), A.get(2,2), A.get(2,3),
       A.get(3,0), A.get(3,2), A.get(3,3)
    ]).det()*detInv);
    Ainv.set(1, 2, new Matrix(3, 3, [
       A.get(0,0), A.get(0,1), A.get(0,3),
       A.get(2,0), A.get(2,1), A.get(2,3),
       A.get(3,0), A.get(3,1), A.get(3,3)
    ]).det()*detInv);
    Ainv.set(1, 3, new Matrix(3, 3, [
       A.get(0,0), A.get(0,1), A.get(0,2),
       A.get(2,0), A.get(2,1), A.get(2,2),
       A.get(3,0), A.get(3,1), A.get(3,2)
    ]).det()*detInv);
    Ainv.set(2, 0, new Matrix(3, 3, [
       A.get(0,1), A.get(0,2), A.get(0,3),
       A.get(1,1), A.get(1,2), A.get(1,3),
       A.get(3,1), A.get(3,2), A.get(3,3)
    ]).det()*detInv);
    Ainv.set(2, 1, new Matrix(3, 3, [
       A.get(0,0), A.get(0,2), A.get(0,3),
       A.get(1,0), A.get(1,2), A.get(1,3),
       A.get(3,0), A.get(3,2), A.get(3,3)
    ]).det()*detInv);
    Ainv.set(2, 2, new Matrix(3, 3, [
       A.get(0,0), A.get(0,1), A.get(0,3),
       A.get(1,0), A.get(1,1), A.get(1,3),
       A.get(3,0), A.get(3,1), A.get(3,3)
    ]).det()*detInv);
    Ainv.set(2, 3, new Matrix(3, 3, [
       A.get(0,0), A.get(0,1), A.get(0,2),
       A.get(1,0), A.get(1,1), A.get(1,2),
       A.get(3,0), A.get(3,1), A.get(3,2)
    ]).det()*detInv);
    Ainv.set(3, 0, new Matrix(3, 3, [
       A.get(0,1), A.get(0,2), A.get(0,3),
       A.get(1,1), A.get(1,2), A.get(1,3),
       A.get(2,1), A.get(2,2), A.get(2,3)
    ]).det()*detInv);
    Ainv.set(3, 1, new Matrix(3, 3, [
       A.get(0,0), A.get(0,2), A.get(0,3),
       A.get(1,0), A.get(1,2), A.get(1,3),
       A.get(2,0), A.get(2,2), A.get(2,3)
    ]).det()*detInv);
    Ainv.set(3, 2, new Matrix(3, 3, [
       A.get(0,0), A.get(0,1), A.get(0,3),
       A.get(1,0), A.get(1,1), A.get(1,3),
       A.get(2,0), A.get(2,1), A.get(2,3)
    ]).det()*detInv);
    Ainv.set(3, 3, new Matrix(3, 3, [
       A.get(0,0), A.get(0,1), A.get(0,2),
       A.get(1,0), A.get(1,1), A.get(1,2),
       A.get(2,0), A.get(2,1), A.get(2,2)
    ]).det()*detInv);

    return Ainv;
  } else {
    throw "Matrix.prototype.inv(): Can't inverse matrix bigger than 4x4"
  }
}

Matrix.prototype.negate = function () {
  var A = this;
  return Matrix.generate(this.n, this.m, function (i,j) {
    return - A.get(i,j);
  });
}

Matrix.prototype.cross = function (v) {
  var u = this;
  if (!u.isVector || !v.isVector) {
    throw "Matrix.prototype.cross(): u or v is a matrix."
  }
  return new Matrix(1, 3, [
    u.get(1)*v.get(2) - u.get(2)*v.get(1),
    u.get(2)*v.get(0) - u.get(0)*v.get(2),
    u.get(0)*v.get(1) - u.get(1)*v.get(0)
  ]);
}

Matrix.prototype.length = function () {
  var u = this;
  if (!u.isVector) {
    throw "Matrix.prototype.length(): u is a matrix.";
  }
  return Math.sqrt(u.dot(u));
}

Matrix.prototype.normalize = function (excludeLast) {
  var u = this;
  if (!u.isVector) {
    throw "Matrix.prototype.normalize(): u is a matrix.";
  }
  var length = u.length();
  var w = Matrix.generate(u.n, u.m, function (i,j) {
    return u.get(i,j) / length;
  });
  if (excludeLast) {
    var lastIndex = Math.max(u.n, u.m);
    w.set(lastIndex, u.get(lastIndex));
  }
  return w;
}

Matrix.prototype.mix = function (v, s) {
  var u = this;
  if (u.n != v.n || u.m != v.m) {
    throw "Matrix.prototype.mix(): u and v has different dimensions.";
  }
  return Matrix.generate(u.n, u.m, function (i,j) {
    return (1 - s) * u.get(i,j) + s * v.get(i,j);
  });
}

Matrix.prototype.scale = function (s) {
  var u = this;
  return Matrix.generate(u.n, u.m, function (i,j) {
    return s * u.get(i,j);
  });
}

Matrix.generate = function (n, m, f) {
  var A = new Matrix(n, m, []);
  f = f || function () { return 0; }
  A.update(f);
  return A;
}

Matrix.row = function () {
  var values = arguments;
  return Matrix.generate(values.length, 1, function (i,j) {
    return values[i];
  }.bind(this));
}

Matrix.column = function () {
  var values = arguments;
  return Matrix.generate(1, values.length, function (i,j) {
    return values[j];
  }.bind(this));
}

Matrix.identity = function (n) {
  return Matrix.generate(n, n, function(i, j) {
    return i == j ? 1 : 0;
  }.bind(this));
}

Matrix.translate = function (x, y, z) {
  var M = Matrix.generate(4, 4);
  M.set(0, 3, x);
  M.set(1, 3, y);
  M.set(2, 3, z);
  return M;
}

Matrix.rotate = function (theta, axis) {
  var v = axis.normalize();

  var x = v.get(0);
  var y = v.get(1);
  var z = v.get(2);

  var radians = theta * Math.PI / 180;
  var c = Math.cos(radians);
  var omc = 1 - c;
  var s = Math.sin(radians);

  return new Matrix(4, [
    x*x*omc + c,   x*y*omc - z*s, x*z*omc + y*s, 0,
    x*y*omc + z*s, y*y*omc + c,   y*z*omc - x*s, 0,
    x*z*omc - y*s, y*z*omc + x*s, z*z*omc + c,   0,
    0,             0,             0,             0
  ]);
}

Matrix.rotateX = function (theta) {
  var radians = theta * Math.PI / 180;
  var c = Math.cos(radians);
  var s = Math.sin(radians);
  return new Matrix(4, [
    1.0,  0.0,  0.0, 0.0,
    0.0,  c,    s,   0.0,
    0.0, -s,    c,   0.0,
    0.0,  0.0,  0.0, 1.0
  ]);
}

Matrix.rotateY = function (theta) {
  var radians = theta * Math.PI / 180;
  var c = Math.cos(radians);
  var s = Math.sin(radians);
  return new Matrix(4, [
    c,   0.0, -s,   0.0,
    0.0, 1.0,  0.0, 0.0,
    s,   0.0,  c,   0.0,
    0.0, 0.0,  0.0, 1.0
  ]);
}
Matrix.rotateZ = function (theta) {
  var radians = theta * Math.PI / 180;
  var c = Math.cos(radians);
  var s = Math.sin(radians);
  return new Matrix(4, [
    c,   -s,   0.0, 0.0,
    s,    c,   0.0, 0.0,
    0.0,  0.0, 1.0, 0.0,
    0.0,  0.0, 0.0, 1.0
  ]);
}