import * as THREE from 'three'

/* Texture that get information of Grid */
/*
  Grid Class는 Grid 정보를 가진 Texture를 정의, 관리 해준다.
  infoTexture의 정보는 아래와 같다.
  r : 백터의 크기
  g : 백터의 각도
  b : 백터의 각속도
*/

class Grid {
  constructor(rdrr, width, height) {
    this.rdrr = rdrr;
    this.width = width == undefined ? 4 : width;
    this.height = height == undefined ? 4 : height;

    this.infoTexture = new THREE.WebGLRenderTarget(
      this.width, this.height , {
        minFilter : THREE.NearestFilter,
        magFilter : THREE.NearestFilter,
        wrapS : THREE.RepeatWrapping,
        wrapT : THREE.RepeatWrapping,
        data : THREE.FloatType
      }
    );
    this.tempTexture = new THREE.WebGLRenderTarget(
      this.width, this.height , {
        minFilter : THREE.NearestFilter,
        magFilter : THREE.NearestFilter,
        wrapS : THREE.RepeatWrapping,
        wrapT : THREE.RepeatWrapping,
        data : THREE.FloatType
      }
    );

    this.commonCamera = new THREE.Camera();

    this.tempScene = new THREE.Scene();
    this.infoScene = new THREE.Scene();

    this.uniforms = {
      unif_texture : { type : "t", value : this.infoTexture.texture },
      unif_dt : { type : "1f", value : 0.0},
      unif_isinit : { type : "1f", value : 0.0},
      unif_seed : { type : "1f", value : Math.random() }
    };
    this.tempMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 2.0),
      new THREE.ShaderMaterial({
        uniforms : this.uniforms,
        fragmentShader : `
        uniform sampler2D unif_texture;
        uniform float unif_dt;
        uniform float unif_isinit;
        uniform float unif_seed;

        varying vec2 vtex;

        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main(void) {
          vec4 retcolor = vec4(0.0);
          if(unif_isinit < 0.5) {
            retcolor = vec4(
              rand(vtex + unif_seed + 0.01),
              rand(vtex + unif_seed + 0.02),
              rand(vtex + unif_seed + 0.03),
              1.0);
          }
          else {
            vec3 data = texture2D(unif_texture, vtex).rgb;
            float rad = (data.g * 2.0);
            float rpd = (data.b * 2.0 - 1.0);
            rad += rpd * unif_dt;

            retcolor = vec4(data.r, fract(rad * 0.5 + 1.0), data.b, 1.0);
          }
          gl_FragColor = retcolor;
        }
        `,
        vertexShader : `
        varying vec2 vtex;
        void main(void) {
          vtex = uv;
          gl_Position = vec4(position, 1.0);
        }
        `
      })
    );
    this.infoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 2.0),
      new THREE.MeshBasicMaterial({map : this.tempTexture.texture})
    );

    this.tempScene.add(this.tempMesh);
    this.infoScene.add(this.infoMesh);

    this.rebuild();
  }

  rebuild() {
    this.uniforms.unif_isinit.value = 0.0;
    this.uniforms.unif_seed.value = Math.random();
    this.rdrr.render(this.tempScene, this.commonCamera, this.tempTexture);
    this.rdrr.render(this.infoScene, this.commonCamera, this.infoTexture);
  }

  update(dt) {
    this.uniforms.unif_dt.value = dt;
    this.uniforms.unif_isinit.value = 1.0;
    this.rdrr.render(this.tempScene, this.commonCamera, this.tempTexture);
    this.rdrr.render(this.infoScene, this.commonCamera, this.infoTexture);

  }

  getWidth() { return this.width; }
  getHeight() { return this.height; }
  getTexture() { return this.infoTexture.texture; }
}

export default Grid
