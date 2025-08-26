"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";

// Import shaders as text
const vertexShader = `
varying float vDistance;

uniform float time;
uniform float offsetSize;
uniform float size;
uniform float offsetGain;
uniform float amplitude;
uniform float frequency;
uniform float maxDistance;

vec3 mod289(vec3 x){
  return x-floor(x*(1./289.))*289.;
}

vec2 mod289(vec2 x){
  return x-floor(x*(1./289.))*289.;
}

vec3 permute(vec3 x){
  return mod289(((x*34.)+1.)*x);
}

float noise(vec2 v) {
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  
  vec2 i1;
  i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz;
  x12.xy-=i1;
  
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))
  +i.x+vec3(0.,i1.x,1.));
  
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
  m=m*m;
  m=m*m;
  
  vec3 x=2.*fract(p*C.www)-1.;
  vec3 h=abs(x)-.5;
  vec3 ox=floor(x+.5);
  vec3 a0=x-ox;
  
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}

vec3 curl(float x,float y,float z) {
  float eps=1.,eps2=2.*eps;
  float n1,n2,a,b;
  
  x+=time*.05;
  y+=time*.05;
  z+=time*.05;
  
  vec3 curl=vec3(0.);
  
  n1=noise(vec2(x,y+eps));
  n2=noise(vec2(x,y-eps));
  a=(n1-n2)/eps2;
  
  n1=noise(vec2(x,z+eps));
  n2=noise(vec2(x,z-eps));
  b=(n1-n2)/eps2;
  
  curl.x=a-b;
  
  n1=noise(vec2(y,z+eps));
  n2=noise(vec2(y,z-eps));
  a=(n1-n2)/eps2;
  
  n1=noise(vec2(x+eps,z));
  n2=noise(vec2(x+eps,z));
  b=(n1-n2)/eps2;
  
  curl.y=a-b;
  
  n1=noise(vec2(x+eps,y));
  n2=noise(vec2(x-eps,y));
  a=(n1-n2)/eps2;
  
  n1=noise(vec2(y+eps,z));
  n2=noise(vec2(y-eps,z));
  b=(n1-n2)/eps2;
  
  curl.z=a-b;
  
  return curl;
}

void main() {
  vec3 newpos = position;
  vec3 target = position + (normal*.1) + curl(newpos.x * frequency, newpos.y * frequency, newpos.z * frequency) * amplitude;
  
  float d = length(newpos - target) / maxDistance;
  newpos = mix(position, target, pow(d, 4.));
  newpos.z += sin(time) * (.1 * offsetGain);
  
  vec4 mvPosition = modelViewMatrix * vec4(newpos, 1.);
  gl_PointSize = size + (pow(d,3.) * offsetSize) * (1./-mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
  
  vDistance = d;
}
`;

const fragmentShader = `
varying float vDistance;

uniform vec3 startColor;
uniform vec3 endColor;

float circle(in vec2 _st,in float _radius){
  vec2 dist=_st-vec2(.5);
  return 1.-smoothstep(_radius-(_radius*.01),
  _radius+(_radius*.01),
  dot(dist,dist)*4.);
}

void main(){
  vec2 uv = vec2(gl_PointCoord.x,1.-gl_PointCoord.y);
  vec3 circ = vec3(circle(uv,1.));

  vec3 color = mix(startColor,endColor,vDistance);
  gl_FragColor=vec4(color,circ.r * vDistance);
}
`;

const AudioVisualizer = ({ audioRef, isPlaying }) => {
  const mountRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  // Three.js refs
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const holderRef = useRef(null);
  const materialRef = useRef(null);
  const pointsMeshRef = useRef(null);
  const geometryRef = useRef(null);
  const guiRef = useRef(null);
  const timeRef = useRef(0);

  // Color sampling refs
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const colorSamplingRef = useRef({ enabled: true, intensity: 0.7 });

  // GUI properties
  const guiPropertiesRef = useRef(null);
  const segmentsFolderRef = useRef(null);

  useEffect(() => {
    if (!audioRef?.current || !mountRef.current) return;

    // Setup Three.js scene
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setSize(800, 600);
    renderer.autoClear = false;
    mountRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(70, 800 / 600, 0.1, 10000);
    camera.position.z = 2;
    camera.frustumCulled = false;

    const scene = new THREE.Scene();
    scene.add(camera);

    const holder = new THREE.Object3D();
    holder.sortObjects = false;
    scene.add(holder);

    // Store refs
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    holderRef.current = holder;

    // Setup color sampling canvas
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const context = canvas.getContext("2d");
    canvasRef.current = canvas;
    contextRef.current = context;

    // Setup GUI
    const gui = new GUI();
    guiRef.current = gui;

    // Setup material with shaders
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        offsetSize: { value: 2 },
        size: { value: 2 },
        frequency: { value: 2 },
        amplitude: { value: 0.8 },
        offsetGain: { value: 0.5 },
        maxDistance: { value: 1.8 },
        startColor: { value: new THREE.Color(0xe21b4d) },
        endColor: { value: new THREE.Color(0x004c6c) },
      },
    });
    materialRef.current = material;

    // Setup audio context
    const setupAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();

        const source = audioContextRef.current.createMediaElementSource(
          audioRef.current
        );
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);

        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      }
    };

    // Create cube function
    const createCube = () => {
      let widthSeg = Math.floor(THREE.MathUtils.randInt(5, 20));
      let heightSeg = Math.floor(THREE.MathUtils.randInt(1, 40));
      let depthSeg = Math.floor(THREE.MathUtils.randInt(5, 80));

      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      if (pointsMeshRef.current) {
        holder.remove(pointsMeshRef.current);
      }

      const geometry = new THREE.BoxGeometry(
        1,
        1,
        1,
        widthSeg,
        heightSeg,
        depthSeg
      );
      geometryRef.current = geometry;

      const pointsMesh = new THREE.Points(geometry, material);
      pointsMeshRef.current = pointsMesh;
      holder.add(pointsMesh);

      // Update GUI
      if (segmentsFolderRef.current) {
        segmentsFolderRef.current.destroy();
      }

      const segmentsFolder = gui.addFolder("Segments");
      segmentsFolderRef.current = segmentsFolder;

      guiPropertiesRef.current.segments = {
        width: widthSeg,
        height: heightSeg,
        depth: depthSeg,
      };

      segmentsFolder
        .add(guiPropertiesRef.current.segments, "width", 5, 20)
        .step(1);
      segmentsFolder
        .add(guiPropertiesRef.current.segments, "height", 1, 40)
        .step(1);
      segmentsFolder
        .add(guiPropertiesRef.current.segments, "depth", 5, 80)
        .step(1);
      segmentsFolder
        .add(guiPropertiesRef.current, "randomizeSegments")
        .name("Randomize Segments");

      segmentsFolder.onChange(() => {
        if (geometryRef.current) {
          geometryRef.current.dispose();
        }
        if (pointsMeshRef.current) {
          holder.remove(pointsMeshRef.current);
        }

        const newGeometry = new THREE.BoxGeometry(
          1,
          1,
          1,
          guiPropertiesRef.current.segments.width,
          guiPropertiesRef.current.segments.height,
          guiPropertiesRef.current.segments.depth
        );
        geometryRef.current = newGeometry;

        const newPointsMesh = new THREE.Points(newGeometry, material);
        pointsMeshRef.current = newPointsMesh;
        holder.add(newPointsMesh);
      });
    };

    // Setup GUI properties
    guiPropertiesRef.current = {
      segments: {},
      mesh: "Cube",
      autoRotate: true,
      autoRandom: false,
      rotationSpeed: {
        x: 0.01,
        y: 0.01,
      },
      randomizeSegments: () => {
        createCube();
      },
      randomizeMeshes: () => {
        createCube();
      },
    };

    // Setup GUI controls
    gui.add(guiPropertiesRef.current, "autoRotate").name("Auto Rotate");
    gui.add(guiPropertiesRef.current, "autoRandom").name("Auto Randomize");
    gui
      .add(guiPropertiesRef.current, "randomizeMeshes")
      .name("Randomize Meshes");

    // Rotation controls folder
    const rotationFolder = gui.addFolder("Rotation");
    rotationFolder
      .add(guiPropertiesRef.current.rotationSpeed, "x", -0.1, 0.1)
      .step(0.001)
      .name("Speed X");
    rotationFolder
      .add(guiPropertiesRef.current.rotationSpeed, "y", -0.1, 0.1)
      .step(0.001)
      .name("Speed Y");

    const shaderFolder = gui.addFolder("Shader");
    shaderFolder
      .add(material.uniforms.frequency, "value", 0, 5)
      .name("Frequency");
    shaderFolder
      .add(material.uniforms.amplitude, "value", 0, 5)
      .name("Amplitude");
    shaderFolder.add(material.uniforms.size, "value", 0, 10).name("Size");
    shaderFolder
      .add(material.uniforms.offsetSize, "value", 0, 10)
      .name("Offset Size");
    shaderFolder
      .add(material.uniforms.offsetGain, "value", 0, 2)
      .name("Offset Gain");
    shaderFolder
      .add(material.uniforms.maxDistance, "value", 0, 5)
      .name("Max Distance");

    // Color sampling controls
    const colorFolder = gui.addFolder("Background Colors");
    colorFolder
      .add(colorSamplingRef.current, "enabled")
      .name("Enable Background Sampling")
      .onChange((value) => {
        if (!value) {
          // Reset to original Red Bull colors
          material.uniforms.startColor.value.setHex(0xe21b4d);
          material.uniforms.endColor.value.setHex(0x004c6c);
        }
      });
    colorFolder
      .add(colorSamplingRef.current, "intensity", 0, 1)
      .step(0.1)
      .name("Sampling Intensity");

    gui.close();

    // Auto randomization interval
    const randomInterval = setInterval(() => {
      if (guiPropertiesRef.current?.autoRandom) {
        guiPropertiesRef.current.randomizeMeshes();
      }
    }, 3000);

    // Color sampling function
    const sampleBackgroundColors = () => {
      if (!colorSamplingRef.current.enabled) return;

      // Find the background video element
      const videoElement = document.querySelector(
        'video[src*="main-loop.webm"]'
      );
      if (!videoElement || !contextRef.current || !canvasRef.current) return;

      try {
        // Draw video frame to canvas
        contextRef.current.drawImage(videoElement, 0, 0, 100, 100);

        // Sample colors from different regions
        const topColor = contextRef.current.getImageData(50, 20, 1, 1).data; // Top center
        const bottomColor = contextRef.current.getImageData(50, 80, 1, 1).data; // Bottom center

        // Convert RGB to hex for Three.js
        const rgbToHex = (r, g, b) => {
          return (r << 16) | (g << 8) | b;
        };

        const sampledStartColor = rgbToHex(
          topColor[0],
          topColor[1],
          topColor[2]
        );
        const sampledEndColor = rgbToHex(
          bottomColor[0],
          bottomColor[1],
          bottomColor[2]
        );

        // Apply intensity factor and mix with original Red Bull colors
        const originalStart = 0xe21b4d;
        const originalEnd = 0x004c6c;
        const intensity = colorSamplingRef.current.intensity;

        // Blend sampled colors with original colors
        const blendColors = (original, sampled, factor) => {
          const origR = (original >> 16) & 0xff;
          const origG = (original >> 8) & 0xff;
          const origB = original & 0xff;

          const sampR = (sampled >> 16) & 0xff;
          const sampG = (sampled >> 8) & 0xff;
          const sampB = sampled & 0xff;

          const r = Math.round(origR * (1 - factor) + sampR * factor);
          const g = Math.round(origG * (1 - factor) + sampG * factor);
          const b = Math.round(origB * (1 - factor) + sampB * factor);

          return (r << 16) | (g << 8) | b;
        };

        const finalStartColor = blendColors(
          originalStart,
          sampledStartColor,
          intensity
        );
        const finalEndColor = blendColors(
          originalEnd,
          sampledEndColor,
          intensity
        );

        // Update shader uniforms
        if (materialRef.current) {
          materialRef.current.uniforms.startColor.value.setHex(finalStartColor);
          materialRef.current.uniforms.endColor.value.setHex(finalEndColor);
        }
      } catch (error) {
        // Silently handle CORS or other canvas errors
        console.warn("Color sampling failed:", error.message);
      }
    };

    // Create initial cube
    createCube();

    // Animation loop
    const animate = () => {
      if (!isPlaying) return;

      // Audio reactive updates
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Calculate audio intensity
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        const average = sum / dataArrayRef.current.length;
        const intensity = average / 255;

        // Update shader uniforms based on audio
        material.uniforms.amplitude.value = 0.8 + intensity * 2;
        material.uniforms.frequency.value = 2 + intensity * 3;
      }

      // Auto rotation
      if (guiPropertiesRef.current?.autoRotate) {
        holder.rotation.x += guiPropertiesRef.current.rotationSpeed.x;
        holder.rotation.y += guiPropertiesRef.current.rotationSpeed.y;
      }

      // Sample background colors (every few frames for performance)
      if (timeRef.current % 0.5 < 0.1) {
        sampleBackgroundColors();
      }

      // Update time
      timeRef.current += 0.1;
      material.uniforms.time.value = timeRef.current;

      // Render
      renderer.render(scene, camera);

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying && audioRef.current) {
      setupAudioContext();
      animate();
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (randomInterval) {
        clearInterval(randomInterval);
      }
      if (gui) {
        gui.destroy();
      }
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      if (material) {
        material.dispose();
      }
      if (renderer && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [audioRef, isPlaying]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-screen bg-transparent">
      {/* Three.js Mount Point */}
      <div
        ref={mountRef}
        style={{
          zIndex: 10,
          width: "800px",
          height: "600px",
        }}
      />
    </div>
  );
};

export default AudioVisualizer;
