import * as THREE from "three"
import Perlin from "./perlin/perlin.js"


class Visual {
    constructor() {

        //Set Renderer
        this.rdrr = new THREE.WebGLRenderer({alpha : false, antialias : true});
        this.rdrr.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.rdrr.domElement);

        this.perlin = [];
        this.perlin.push(new Perlin({ rdrr : this.rdrr , width : 16, height : 16}));
        this.perlin.push(new Perlin({ rdrr : this.rdrr , width : 16, height : 16}));

        this.seedtex = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            minFilter : THREE.LinearFilter,
            magFilter : THREE.LinearFilter,
            wrapS : THREE.ClampToEdgeWrapping,
            wrapT : THREE.ClampToEdgeWrapping,
            data : THREE.FloatType
        });
        
        this.spreadidx = 0;
        this.spreadtex = [];
        this.spreadtex.push(new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            minFilter : THREE.LinearFilter,
            magFilter : THREE.LinearFilter,
            wrapS : THREE.ClampToEdgeWrapping,
            wrapT : THREE.ClampToEdgeWrapping,
            data : THREE.FloatType
        }));
        this.spreadtex.push(new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            minFilter : THREE.LinearFilter,
            magFilter : THREE.LinearFilter,
            wrapS : THREE.ClampToEdgeWrapping,
            wrapT : THREE.ClampToEdgeWrapping,
            data : THREE.FloatType
        }));
        
        this.camera = new THREE.Camera();
        
        this.seedunif = {
            uResolution : { type : "2f", value : [window.innerWidth, window.innerHeight]},
            uTime : { type : "1f", value : 0.0}
        };
        this.seedscn = new THREE.Scene();
        this.seedscn.add(new THREE.Mesh(
            new THREE.PlaneGeometry(2.0, 2.0),
            new THREE.ShaderMaterial({
                uniforms : this.seedunif,
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
                uniform float uTime;

                varying vec2 vtex;

                float drawCircle(vec2 uv, vec2 ps, float len) {
                    return smoothstep(len, 0.0, length(ps - uv));
                }

                void main(void) {
                    vec2 st = (vtex - 0.5) * uResolution / max(uResolution.x, uResolution.y);
                    float alpha = 0.0;
                    alpha += drawCircle(st, vec2( 0.10 * sin(uTime * 0.10),  0.10 * cos(uTime * 0.10)), 0.05);
                    alpha += drawCircle(st, vec2( 0.20 * sin(uTime * 0.12),  0.20 * cos(uTime * 0.12)), 0.02);
                    alpha += drawCircle(st, vec2( 0.15 * sin(uTime * 0.08),  0.15 * cos(uTime * 0.12)), 0.03);
                    alpha += drawCircle(st, vec2( 0.10 * sin(uTime * 0.13),  0.05 * cos(uTime * 0.30)), 0.01);
                    

                    gl_FragColor = vec4(1.0, 0.5, 0.5, alpha);
                }
                `
            })
        ));

        this.spreadunif = {
            uPerlinX : { type : "t", value : this.perlin[0].texture},
            uPerlinY : { type : "t", value : this.perlin[1].texture},
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
                
                uniform sampler2D uPerlinX;
                uniform sampler2D uPerlinY;

                uniform vec2 uResolution;

                uniform float uTime;

                varying vec2 vtex;

                float blur(vec2 st) {
                    vec3 offset = vec3(-1.0, 0.0, 1.0);
                    vec2 res = 1.5/uResolution;
                    float color = 0.0;

                    color += texture2D(uSpread, st + offset.yy * res).a * 4.0;

                    color += texture2D(uSpread, st + offset.yx * res).a * 2.0;
                    color += texture2D(uSpread, st + offset.yz * res).a * 2.0;
                    color += texture2D(uSpread, st + offset.xy * res).a * 2.0;
                    color += texture2D(uSpread, st + offset.zy * res).a * 2.0;

                    color += texture2D(uSpread, st + offset.xz * res).a * 1.0;
                    color += texture2D(uSpread, st + offset.zx * res).a * 1.0;
                    color += texture2D(uSpread, st + offset.xx * res).a * 1.0;
                    color += texture2D(uSpread, st + offset.zz * res).a * 1.0;

                    return color / 16.0;
                }

                void main(void) {
                    vec2 flowed = vec2(
                        texture2D(uPerlinX, vtex).g - 0.5,
                        texture2D(uPerlinY, vtex).g - 0.5
                    );
                    flowed = 1.0 * flowed / uResolution;
                    vec2 st = vtex + flowed;
                    
                    float oldcolor = blur(st);
                    oldcolor = oldcolor - (max(0.0005, uTime * oldcolor * 0.1));
                    float newcolor = texture2D(uSeed, vtex).a;

                    vec4 color = vec4(1.0 ,1.0, 1.0, oldcolor + newcolor);
                    gl_FragColor = color;
                }
                `
            })
        ))

    }

    update(t, dt) {
        this.perlin[0].update(dt);
        this.perlin[1].update(dt);
        // this.perlin.renderForDebug();

        this.seedunif.uTime.value = t;
        this.rdrr.render(this.seedscn, this.camera, this.seedtex);


        // this.spreadunif.uPerlin.value = this.perlin.texture;
        this.spreadunif.uSpread.value = this.spreadtex[this.spreadidx].texture;
        this.spreadunif.uSeed.value = this.seedtex.texture;
        this.spreadunif.uTime.value = dt;

        this.spreadidx = (this.spreadidx + 1) % 2;
        this.rdrr.render(this.spreadscn, this.camera, this.spreadtex[this.spreadidx]);

        this.rdrr.render(this.spreadscn, this.camera);
    }
}


export default Visual;