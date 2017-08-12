import * as THREE from 'three'
import Grid from './grid.js'
import Flow from './flow.js'


export default class Perlin {
  constructor(option) {
    option = option || {};

    if(option.rdrr == undefined) {
      this.rdrr = new THREE.WebGLRenderer({alpha : false});
      this.rdrr.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(this.rdrr.domElement);
    } else { this.rdrr = option.rdrr; }
    // console.log(THREE);

    this.grid = new Grid(this.rdrr, option.width, option.height);
    this.flow = new Flow(this.rdrr, 1024, 1024, this.grid);

    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 2.0),
      new THREE.MeshBasicMaterial({ map : this.flow.getTexture() })
    ));

    this.target = new THREE.WebGLRenderTarget(window.innerHeight, window.innerHeight, {
      minFilter : THREE.LinearFilter,
      magFilter : THREE.LinearFilter,
      data : THREE.FloatType
    });
  }

  update(dt) {
    this.grid.update(dt);
    this.flow.update(dt);
    this.rdrr.render(this.scene, this.camera, this.target);
    
  }

  renderForDebug() {
    this.rdrr.render(this.scene, this.camera);
  }

  get texture() { return this.target.texture; }
}

