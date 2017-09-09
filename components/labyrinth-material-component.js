export {labyrinthMaterial};

const vertexShader = `

varying vec2 vUv;
varying vec4 worldPosition;
varying vec3 u_cameraPos;

void main() {
  vUv = uv;
  worldPosition = modelMatrix * vec4(position, 1.0);
  vec4 v = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = v;
}
`;

const fragmentShader = `

#define PI 3.1415926538

uniform vec3 color;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_controllerPos;
uniform vec3 u_controllerLookDir;
uniform bool u_controllerActive;
uniform float u_triggerDuration;

varying vec2 vUv;
varying vec4 worldPosition;

void main(void)
{
  vec3 controllerDir = u_controllerPos - worldPosition.xyz;
  float dist = length(controllerDir);
	// vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  

  controllerDir = normalize(controllerDir);
  float dot = dot(u_controllerLookDir, controllerDir);
  float angle = acos(dot) / PI;
  
  float normDist = min(dist, 1.0);
  if(u_controllerActive == true) {
    float triggerDurSecs = u_triggerDuration / 1000.0;
    float durOpacity = max(0.3, 1.0 - triggerDurSecs * 0.4);
    float angleOpacity = angle * 10.0;
    float opacity = max(min(normDist, 0.4),  durOpacity * angleOpacity);
    gl_FragColor = vec4(color, opacity);
  } else {
    gl_FragColor = vec4(color, 1.0);
  }
  
}
`;

let labyrinthMaterial = AFRAME.registerComponent('labyrinth-material', {
  schema: {
    // Add properties.
  },
  init: function () {
    this.sceneEl = document.querySelector('a-scene');
    this.gameState = this.sceneEl.systems['game-state'];
    // this.el.object3D.renderOrder = 1;
    const data = this.data;
    this.material  = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0.0 },
        color: { value: new THREE.Color(data.color) },
        u_controllerPos: {value: this.gameState.magicLight.object3D.position},
        u_controllerLookDir: {value: this.gameState.magicLight.object3D.getWorldDirection()},
        u_controllerActive: {value: this.gameState.magicLight.triggerPressed},
        u_triggerDuration: {value: this.gameState.time - this.gameState.magicLight.triggerTime}


      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });
    this.applyToMesh();
    this.el.addEventListener('model-loaded', () => this.applyToMesh());
    
  },
  update: function () {
    this.material.uniforms.color.value.set(this.data.color);
  },
  applyToMesh: function() {
    const mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.material = this.material;
    }
  },
  tick: function (t, timeDelta) {
    // console.log(JSON.stringify(this.camera.object3D.position));
    
    this.material.uniforms.u_time.value = t / 1000;
    this.material.uniforms.u_controllerPos.value = this.gameState.magicLight.object3D.position;
    this.material.uniforms.u_controllerLookDir.value = this.gameState.magicLight.object3D.getWorldDirection();
    
    let triggerPressed = this.gameState.magicLight.components['magic-light'].triggerPressed;
    this.material.uniforms.u_controllerActive.value = triggerPressed;
    this.material.transparent = true;
    if(triggerPressed) {
      this.material.transparent = true;
      this.material.uniforms.u_triggerDuration.value = this.gameState.time - this.gameState.magicLight.components['magic-light'].triggerTime;
    }
  

  
    
    

    // add more uniforms like magic light dir and pos
  }
});
