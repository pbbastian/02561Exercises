var gl;

window.onload = function init() {
  var canvas = document.getElementById( "gl-canvas" );
  
  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );

  render();
};

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT );
}