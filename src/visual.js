import * as THREE from "three"
import Perlin from "./perlin/perlin.js"


class Visual {
    constructor() {

        //Set Renderer
        this.rdrr = new THREE.WebGLRenderer({alpha : false, antialias : true});
        this.rdrr.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.rdrr.domElement);

        this.perlin = new Perlin({ rdrr : this.rdrr , width : 16, height : 16});

        this.seedtex = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            minFilter : THREE.LinearFilter,
            magFilter : THREE.LinearFilter,
            data : THREE.FloatType
        });
        
        this.spreadidx = 0;
        this.spreadtex = [];
        this.spreadtex.push(new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            minFilter : THREE.LinearFilter,
            magFilter : THREE.LinearFilter,
            data : THREE.FloatType
        }));
        this.spreadtex.push(new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            minFilter : THREE.LinearFilter,
            magFilter : THREE.LinearFilter,
            data : THREE.FloatType
        }));
        
        this.camera = new THREE.Camera();
        

        this.seedscn = new THREE.Scene();
        this.seedscn.add(new THREE.Mesh(
            new THREE.PlaneGeometry(2.0, 2.0),
            new THREE.ShaderMaterial({
                uniforms : {
                    uResolution : { type : "2f", value : [window.innerWidth, window.innerHeight]}
                },
                transparent : true,
                vertexShader : `
                varying vec2 vtex;
                void main(void) {
                    vtex = uv;
                    gl_Position = vec4(position, 1.0);
                }
                `,
                fragmentShader : `
                uniform vec2 uResolution;
                varying vec2 vtex;

                float drawCircle(vec2 uv, vec2 ps, float len) {
                    return smoothstep(len, 0.0, length(ps - uv));
                }

                void main(void) {
                    vec2 st = (vtex - 0.5) * uResolution / max(uResolution.x, uResolution.y);
                    float alpha = 0.0;
                    alpha += drawCircle(st, vec2( 0.0,  0.0), 0.05);
                    alpha += drawCircle(st, vec2( 0.1,  0.2), 0.05);
                    alpha += drawCircle(st, vec2(-0.2,  0.1), 0.05);
                    alpha += drawCircle(st, vec2( 0.0, -0.2), 0.05);

                    gl_FragColor = vec4(1.0, 0.5, 0.5, alpha);
                }
                `
            })
        ));

        this.spreadunif = {
            uPerlin : { type : "t", value : this.perlin.texture},
            uSpread : { type : "t", value : this.spreadtex[0].texture},
            uSeed : { type : "t", value : this.seedtex.texture},
            uResolution : { type : "2f", value : [window.innerWidth, window.innerHeight]},
            uTime : { type : "1f", value : 0.0 }
        };
        this.spreadscn = new THREE.Scene();
        this.spreadscn.add(new THREE.Mesh(
            new THREE.PlaneGeometry(2.0, 2.0),
            new THREE.ShaderMaterial({
                uniforms : this.spreadunif,
                transparent : true,
                vertexShader : `
                varying vec2 vtex;
                void main(void) {
                    vtex = uv;
                    gl_Position = vec4(position, 1.0);
                }
                `,
                fragmentShader : `
                #define PI `+ Math.PI + `
                uniform sampler2D uSeed;
                uniform sampler2D uSpread;
                uniform sampler2D uPerlin;
                uniform vec2 uResolution;

                uniform float uTime;

                varying vec2 vtex;

                void main(void) {
                    float radian = texture2D(uPerlin, vtex).g * PI * 4.0;

                    vec2 flowed = 1.0 * vec2( sin(radian), cos(radian)) / uResolution;
                    float spread = uTime* 0.02;

                    vec2 st = (vtex - 0.5) * (1.0 - spread) + 0.5 + flowed;
                    vec4 oldcolor = texture2D(uSpread, st);
                    oldcolor = oldcolor * (1.0 - uTime * oldcolor.a * 2.0);
                    vec4 newcolor = texture2D(uSeed, vtex);

                    vec4 color = oldcolor + newcolor;//max(newcolor, oldcolor);
                    color.rgb = vec3(1.0);
                    gl_FragColor = color;
                }
                `
            })
        ))

    }

    update(t, dt) {
        this.perlin.update(dt);
        // this.perlin.renderForDebug();
        this.rdrr.render(this.seedscn, this.camera, this.seedtex);


        this.spreadunif.uPerlin.value = this.perlin.texture;
        this.spreadunif.uSpread.value = this.spreadtex[this.spreadidx].texture;
        this.spreadunif.uSeed.value = this.seedtex.texture;
        this.spreadunif.uTime.value = dt;

        this.spreadidx = (this.spreadidx + 1) % 2;
        this.rdrr.render(this.spreadscn, this.camera, this.spreadtex[this.spreadidx]);

        this.rdrr.render(this.spreadscn, this.camera);
    }
}


export default Visual;