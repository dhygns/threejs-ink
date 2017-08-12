import * as THREE from 'three'

class Flow {
  constructor(rdrr, width, height, grid) {
    this.width = width == undefined ? 128 : width;
    this.height = height == undefined ? 128 : height;

    this.rdrr = rdrr;


    this.texture = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter : THREE.LinearFilter,
      magFilter : THREE.LinearFilter,
      data : THREE.FloatType 
    });

    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();

    this.scene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 2.0),
      new THREE.ShaderMaterial({
        uniforms : {
          unif_texture : { type : "t", value : grid.getTexture()},
          unif_resolution : { type : "2f", value : [ grid.getWidth(), grid.getHeight()] }
        },
        fragmentShader : `
        #define PI ` + Math.PI + `
        uniform sampler2D unif_texture;
        uniform vec2 unif_resolution;

        varying vec2 vtex;

        void main() {

          vec2 st00 = vec2(floor(vtex.x * unif_resolution.x), floor(vtex.y * unif_resolution.y)) / unif_resolution;
          vec2 st11 = vec2(ceil(vtex.x * unif_resolution.x), ceil(vtex.y * unif_resolution.y)) / unif_resolution;

          vec4 data00 = texture2D(unif_texture, vec2(st00.x, st00.y));
          vec4 data10 = texture2D(unif_texture, vec2(st11.x, st00.y));
          vec4 data01 = texture2D(unif_texture, vec2(st00.x, st11.y));
          vec4 data11 = texture2D(unif_texture, vec2(st11.x, st11.y));

          vec2 grid00 = vec2(
            data00.x * sin(data00.y * 2.0 * PI),
            data00.x * cos(data00.y * 2.0 * PI)
          );
          vec2 grid10 = vec2(
            data10.x * sin(data10.y * 2.0 * PI),
            data10.x * cos(data10.y * 2.0 * PI)
          );
          vec2 grid01 = vec2(
            data01.x * sin(data01.y * 2.0 * PI),
            data01.x * cos(data01.y * 2.0 * PI)
          );
          vec2 grid11 = vec2(
            data11.x * sin(data11.y * 2.0 * PI),
            data11.x * cos(data11.y * 2.0 * PI)
          );
          vec2 grid = (vtex * unif_resolution - floor(vtex * unif_resolution));
          vec2 pick00 = vec2( 0.0 + grid.x , 0.0 + grid.y);
          vec2 pick10 = vec2(-1.0 + grid.x , 0.0 + grid.y);
          vec2 pick01 = vec2( 0.0 + grid.x ,-1.0 + grid.y);
          vec2 pick11 = vec2(-1.0 + grid.x ,-1.0 + grid.y);

          float a0 = dot(grid00, pick00);
          float a1 = dot(grid10, pick10);
          float a2 = dot(grid01, pick01);
          float a3 = dot(grid11, pick11);

          float A0 = a0 + smoothstep(0.0, 1.0, grid.x) * ( a1 - a0);
          float A1 = a2 + smoothstep(0.0, 1.0, grid.x) * ( a3 - a2);

          float A2 = A0 + smoothstep(0.0, 1.0, grid.y) * ( A1 - A0);


          gl_FragColor = vec4(vec3(A2 * 0.5 + 0.5), 1.0);
        }
        `,
        vertexShader : `
        varying vec2 vtex;
        void main() {
          vtex = uv;
          gl_Position = vec4(position, 1.0);
        }
        `
      })
    ));
  }

  update(dt) {
    this.rdrr.render(this.scene, this.camera, this.texture);
  }

  getTexture() { return this.texture.texture; }
}


export default Flow
