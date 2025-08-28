"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
} from "postprocessing";

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
  vec3 displacement = curl(newpos.x * frequency, newpos.y * frequency, newpos.z * frequency) * amplitude;
  
  // Limit displacement to maintain cube shape
  float maxDisplacement = 0.3; // Prevent extreme deformation
  displacement = clamp(displacement, -maxDisplacement, maxDisplacement);
  
  vec3 target = position + (normal * 0.1) + displacement;
  
  float d = length(newpos - target) / maxDistance;
  d = clamp(d, 0.0, 1.0); // Ensure d stays within bounds
  
  newpos = mix(position, target, pow(d, 2.)); // Reduced power for smoother blending
  newpos.z += sin(time) * (0.05 * offsetGain); // Reduced Z oscillation
  
  vec4 mvPosition = modelViewMatrix * vec4(newpos, 1.);
  gl_PointSize = size + (pow(d,2.) * offsetSize) * (1./-mvPosition.z); // Reduced power
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
  
  // Boost particle brightness to ensure bloom threshold is exceeded
  // Extra boost for red colors (wrong answers) since they have lower luminance
  float baseIntensity = 1.16; // Default cube intensity as requested
  float redBoost = (color.r > 0.8 && color.g < 0.3 && color.b < 0.3) ? 4.0 : 3.0;
  vec3 brightColor = color * baseIntensity * redBoost;
  float alpha = circ.r * (0.8 + vDistance * 0.4);
  
  gl_FragColor=vec4(brightColor, alpha);
}
`;

const AudioVisualizer = ({ audioRef, isPlaying, soundEvent = null }) => {
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
  const composerRef = useRef(null);
  const bloomPassRef = useRef(null);
  const backgroundMeshRef = useRef(null);

  // Removed lighting refs since they don't affect background video

  // Background sampling removed - using default colors only

  // Sound event reaction refs
  const soundEventRef = useRef(null);
  const eventAnimationRef = useRef({
    isActive: false,
    startTime: 0,
    duration: 1000, // 1 second duration
    type: null,
  });
  const rotationBoostRef = useRef(0); // For rotation speed boost during events

  // Random amplitude and intensity variation refs
  const randomAmplitudeRef = useRef({
    lastUpdate: 0,
    interval: 533, // Much more frequent changes (average 0.53 seconds)
    variation: 0.25, // Current random amplitude (start with base amplitude)
    targetVariation: 0.25, // Target amplitude for smooth interpolation
    intensityVariation: 1.12, // Current random intensity (start with base frequency)
    targetIntensityVariation: 1.12, // Target intensity for smooth interpolation
    lerpSpeed: 0.05, // Smooth interpolation speed
  });

  // GUI properties
  const guiPropertiesRef = useRef(null);
  const segmentsFolderRef = useRef(null);

  // Setup Three.js scene (runs once)
  useEffect(() => {
    if (!audioRef?.current || !mountRef.current) return;

    // Setup Three.js scene
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setClearColor(0x000000, 1);
    renderer.setSize(1080, 1080);
    renderer.autoClear = true;
    mountRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(70, 1080 / 1080, 0.1, 10000);
    camera.position.z = 4;
    camera.frustumCulled = false;

    const scene = new THREE.Scene();
    scene.add(camera);

    // Setup layers for selective bloom
    const BLOOM_LAYER = 1;
    camera.layers.enable(BLOOM_LAYER);

    // Create video texture background using direct URL with optimization
    const videoElement = document.createElement("video");
    videoElement.src =
      "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/gg_shorts_loop_bg_sound.webm";
    videoElement.crossOrigin = "anonymous";
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.autoplay = true;
    videoElement.preload = "auto"; // Preload video for smoother playback

    // Additional performance optimizations
    videoElement.playbackRate = 1.0; // Ensure normal playback speed
    videoElement.defaultMuted = true; // Ensure muted for autoplay

    // Optimize video element for performance and quality
    videoElement.style.objectFit = "cover";
    videoElement.width = 1080;
    videoElement.height = 1080;

    // Prevent video processing that might add filters
    videoElement.style.filter = "none";
    videoElement.style.imageRendering = "optimizeQuality";

    const videoTexture = new THREE.VideoTexture(videoElement);
    // Optimize texture settings for high-quality video
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;
    videoTexture.type = THREE.UnsignedByteType;
    videoTexture.generateMipmaps = false; // Disable mipmaps for better performance
    videoTexture.flipY = false; // Prevent unnecessary flipping
    videoTexture.wrapS = THREE.ClampToEdgeWrapping;
    videoTexture.wrapT = THREE.ClampToEdgeWrapping;
    videoTexture.colorSpace = THREE.SRGBColorSpace; // Correct color space for video
    videoTexture.premultiplyAlpha = false; // Prevent alpha premultiplication issues

    // Ensure video starts playing and texture updates
    const startVideo = () => {
      videoElement.play().catch(console.warn);
      videoTexture.needsUpdate = true;
    };

    // Start video when it's loaded
    if (videoElement.readyState >= 2) {
      startVideo();
    } else {
      videoElement.addEventListener("canplay", startVideo, { once: true });
    }

    // Create background plane that fills the full 1080x1080 canvas
    // Use a larger plane to ensure complete coverage
    const backgroundGeometry = new THREE.PlaneGeometry(20, 20); // Much larger to guarantee full coverage
    const backgroundMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
      depthTest: false,
      depthWrite: false,
      transparent: false, // Video is opaque
      alphaTest: 0, // No alpha testing needed
      side: THREE.FrontSide, // Only render front face
      toneMapped: false, // Prevent tone mapping that might cause white filter
    });

    const backgroundMesh = new THREE.Mesh(
      backgroundGeometry,
      backgroundMaterial
    );
    backgroundMesh.position.z = -10; // Place further back to avoid clipping
    scene.add(backgroundMesh); // Background stays dark, won't bloom
    backgroundMeshRef.current = backgroundMesh;

    // Setup post-processing with pmndrs/postprocessing library
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // Create BloomEffect with selective layer rendering
    const bloomEffect = new BloomEffect({
      intensity: 0.6, // Default glow intensity as requested
      radius: 5, // Large radius (may not work without mipmapBlur)
      luminanceThreshold: 0.6, // Lower threshold to include more particles in bloom
      luminanceSmoothing: 0.3, // Higher smoothing for more diffuse effect
      mipmapBlur: false, // Keep false as requested
      resolutionScale: 1.0, // Full resolution for maximum quality
    });

    // Configure selective bloom using EffectPass selection
    // Note: Selection is handled at the EffectPass level, not BloomEffect level

    // Add bloom effect via EffectPass for better performance
    const effectPass = new EffectPass(camera, bloomEffect);

    // Try to configure selective bloom if the API supports it
    try {
      if (effectPass.selection && effectPass.selection.set) {
        effectPass.selection.set([BLOOM_LAYER]);
      } else if (bloomEffect.selection && bloomEffect.selection.set) {
        bloomEffect.selection.set([BLOOM_LAYER]);
      }
    } catch (error) {
      console.warn(
        "Selective bloom not available in this version, using threshold-based approach"
      );
    }

    composer.addPass(effectPass);

    composerRef.current = composer;
    bloomPassRef.current = bloomEffect;

    const holder = new THREE.Object3D();
    holder.sortObjects = false;
    scene.add(holder);

    // Store refs
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    holderRef.current = holder;

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
        offsetSize: { value: 2.5 }, // Offset Size from GUI
        size: { value: 2.38 }, // Size from GUI
        baseSize: { value: 2.38 }, // Store original size for sinusoidal variation
        frequency: { value: 1.12 }, // Frequency from GUI
        amplitude: { value: 0.25 }, // Amplitude from GUI
        offsetGain: { value: 0 }, // Offset Gain from GUI
        maxDistance: { value: 0.82 }, // Max Distance from GUI
        startColor: { value: new THREE.Color(0xffffff) }, // Pure white
        endColor: { value: new THREE.Color(0xcccccc) }, // Light gray for subtle variation
      },
    });

    // Initialize userData to store original GUI values
    material.userData = {
      originalAmplitude: 0.25, // Match GUI default
      originalFrequency: 1.12, // Match GUI default
      originalMaxDistance: 0.82, // Match GUI default
    };

    materialRef.current = material;

    // Create cube function
    const createCube = () => {
      let widthSeg = 30;
      let heightSeg = 30;
      let depthSeg = 30;

      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      if (pointsMeshRef.current) {
        holder.remove(pointsMeshRef.current);
      }

      const geometry = new THREE.BoxGeometry(
        1.2, // 20% bigger width
        1.2, // 20% bigger height
        1.2, // 20% bigger depth
        widthSeg,
        heightSeg,
        depthSeg
      );
      geometryRef.current = geometry;

      const pointsMesh = new THREE.Points(geometry, material);
      pointsMesh.layers.enable(BLOOM_LAYER); // Add particles to bloom layer
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
        .add(guiPropertiesRef.current.segments, "width", 5, 100)
        .step(1);
      segmentsFolder
        .add(guiPropertiesRef.current.segments, "height", 5, 100)
        .step(1);
      segmentsFolder
        .add(guiPropertiesRef.current.segments, "depth", 5, 100)
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
          1.2, // 20% bigger width
          1.2, // 20% bigger height
          1.2, // 20% bigger depth
          guiPropertiesRef.current.segments.width,
          guiPropertiesRef.current.segments.height,
          guiPropertiesRef.current.segments.depth
        );
        geometryRef.current = newGeometry;

        const newPointsMesh = new THREE.Points(newGeometry, material);
        newPointsMesh.layers.enable(BLOOM_LAYER); // Add particles to bloom layer
        pointsMeshRef.current = newPointsMesh;
        holder.add(newPointsMesh);
      });
    };

    // Setup GUI properties
    guiPropertiesRef.current = {
      segments: {},
      mesh: "Cube",
      autoRotate: true, // Auto Rotate checked
      autoRandom: false, // Auto Randomize unchecked
      rotationSpeed: {
        x: 0.002, // Speed X from GUI
        y: 0.004, // Speed Y from GUI
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
      .name("Frequency")
      .onChange((value) => {
        // Update the stored original value when GUI changes
        material.userData.originalFrequency = value;
      });
    shaderFolder
      .add(material.uniforms.amplitude, "value", 0, 0.5)
      .name("Amplitude")
      .onChange((value) => {
        // Update the stored original value when GUI changes
        material.userData.originalAmplitude = value;
      });
    shaderFolder
      .add(material.uniforms.size, "value", 0, 10)
      .name("Size")
      .onChange((value) => {
        // Update the base size for sinusoidal variation
        material.uniforms.baseSize.value = value;
      });
    shaderFolder
      .add(material.uniforms.offsetSize, "value", 0, 10)
      .name("Offset Size");
    shaderFolder
      .add(material.uniforms.offsetGain, "value", 0, 2)
      .name("Offset Gain");
    shaderFolder
      .add(material.uniforms.maxDistance, "value", 0, 5)
      .name("Max Distance");

    // Bloom controls - using proxy object for pmndrs/postprocessing compatibility
    const bloomFolder = gui.addFolder("Bloom");

    // Create proxy object for GUI controls since BloomEffect properties may not be directly accessible
    const bloomControls = {
      intensity: 0.6,
      radius: 5,
      threshold: 0.6,
      smoothing: 0.3,
    };

    bloomFolder
      .add(bloomControls, "intensity", 0, 3)
      .step(0.1)
      .name("Intensity")
      .onChange((value) => {
        // Update bloom effect if possible
        if (bloomEffect.intensity !== undefined) {
          bloomEffect.intensity = value;
        }
      });

    bloomFolder
      .add(bloomControls, "radius", 0, 10)
      .step(0.1)
      .name("Radius")
      .onChange((value) => {
        // Update bloom effect if possible
        if (bloomEffect.radius !== undefined) {
          bloomEffect.radius = value;
        }
      });

    bloomFolder
      .add(bloomControls, "threshold", 0, 1)
      .step(0.01)
      .name("Threshold")
      .onChange((value) => {
        // Update bloom effect if possible
        if (bloomEffect.luminanceThreshold !== undefined) {
          bloomEffect.luminanceThreshold = value;
        }
      });

    bloomFolder
      .add(bloomControls, "smoothing", 0, 1.0)
      .step(0.01)
      .name("Smoothing")
      .onChange((value) => {
        // Update bloom effect if possible
        if (bloomEffect.luminanceSmoothing !== undefined) {
          bloomEffect.luminanceSmoothing = value;
        }
      });

    // Background sampling removed - colors will use default white/gray

    gui.close();

    // Auto randomization interval
    const randomInterval = setInterval(() => {
      if (guiPropertiesRef.current?.autoRandom) {
        guiPropertiesRef.current.randomizeMeshes();
      }
    }, 3000);

    // Color sampling function removed - using default colors only

    // Create initial cube
    createCube();

    // Animation loop
    const animate = () => {
      // Check for active sound event animation
      let eventIntensity = 0;
      let eventColors = { start: 0xffffff, end: 0xcccccc };

      if (eventAnimationRef.current.isActive) {
        const elapsed = Date.now() - eventAnimationRef.current.startTime;
        const progress = Math.min(
          elapsed / eventAnimationRef.current.duration,
          1
        );

        if (progress >= 1) {
          // Animation finished - ensure clean reset
          eventAnimationRef.current.isActive = false;
          rotationBoostRef.current = 0; // Reset rotation boost
          eventAnimationRef.current.type = null; // Clear event type
        } else {
          // Calculate animation intensity (fade in/out)
          const fadeInOut =
            progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
          eventIntensity = fadeInOut;

          // Set colors, rotation boost, and bloom intensity based on event type
          switch (eventAnimationRef.current.type) {
            case "wrong":
              eventColors = { start: 0xff0000, end: 0x800000 }; // Red colors
              rotationBoostRef.current = -0.1; // Stop rotation completely (multiplier becomes 0)
              // Keep default bloom intensity for wrong answers
              if (
                bloomPassRef.current &&
                bloomPassRef.current.intensity !== undefined
              ) {
                bloomPassRef.current.intensity = 0.6; // Default intensity
              }
              break;
            case "correct":
              eventColors = { start: 0xff7400, end: 0xff7400 }; // Pure gold to orange gradient
              rotationBoostRef.current = eventIntensity * 2; // Much faster rotation (10x boost)
              // Increase bloom intensity for correct answers (yellow)
              if (
                bloomPassRef.current &&
                bloomPassRef.current.intensity !== undefined
              ) {
                bloomPassRef.current.intensity = 3.0; // High intensity for yellow glow
              }
              break;
            case "pass":
              // No color effects for pass, but add rotation boost and bloom intensity
              rotationBoostRef.current = eventIntensity * 2; // Same fast rotation as correct/wrong
              // Medium bloom intensity for pass events
              if (
                bloomPassRef.current &&
                bloomPassRef.current.intensity !== undefined
              ) {
                bloomPassRef.current.intensity = 1.5; // Medium intensity for pass
              }
              break;
          }
        }
      } else {
        // No active event - ensure clean reset
        rotationBoostRef.current = 0;
        eventIntensity = 0;
        // Reset bloom intensity to default when no event is active
        if (
          bloomPassRef.current &&
          bloomPassRef.current.intensity !== undefined
        ) {
          bloomPassRef.current.intensity = 0.6; // Default intensity
        }
        // Reset maxDistance to original value when no event is active
        if (materialRef.current) {
          materialRef.current.uniforms.maxDistance.value =
            materialRef.current.userData.originalMaxDistance || 0.82;
        }
      }

      // Audio reactive updates (check current playing state)
      if (analyserRef.current && dataArrayRef.current) {
        try {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          // Calculate audio intensity
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const average = sum / dataArrayRef.current.length;

          // Only use audio data if there's actual signal (audio is playing)
          if (average > 0) {
            const intensity = average / 255;

            // Random amplitude variation only when sound is playing
            const now = Date.now();
            if (
              now - randomAmplitudeRef.current.lastUpdate >
              randomAmplitudeRef.current.interval
            ) {
              // Generate new target amplitude between 0.25 and 0.5
              const oldTarget = randomAmplitudeRef.current.targetVariation;
              const oldIntensity =
                randomAmplitudeRef.current.targetIntensityVariation;

              randomAmplitudeRef.current.targetVariation =
                0.25 + Math.random() * 0.25; // Random between 0.25 and 0.5
              randomAmplitudeRef.current.targetIntensityVariation =
                1.12 + Math.random() * 0.68; // Random between 1.12 and 1.8

              randomAmplitudeRef.current.lastUpdate = now;
              // Much more frequent intervals between 0.33-0.8 seconds (50% more often)
              randomAmplitudeRef.current.interval = 333 + Math.random() * 467;

              // Log amplitude and intensity changes
              console.log(
                `Amplitude: ${oldTarget.toFixed(
                  4
                )} → ${randomAmplitudeRef.current.targetVariation.toFixed(
                  4
                )} | Intensity: ${oldIntensity.toFixed(
                  4
                )} → ${randomAmplitudeRef.current.targetIntensityVariation.toFixed(
                  4
                )} (next change in ${(
                  randomAmplitudeRef.current.interval / 1000
                ).toFixed(1)}s)`
              );
            }

            // Smooth interpolation towards target variations
            randomAmplitudeRef.current.variation = THREE.MathUtils.lerp(
              randomAmplitudeRef.current.variation,
              randomAmplitudeRef.current.targetVariation,
              randomAmplitudeRef.current.lerpSpeed
            );
            randomAmplitudeRef.current.intensityVariation =
              THREE.MathUtils.lerp(
                randomAmplitudeRef.current.intensityVariation,
                randomAmplitudeRef.current.targetIntensityVariation,
                randomAmplitudeRef.current.lerpSpeed
              );

            // Removed lighting code since it doesn't affect background video
            // Add audio reactivity to the current GUI slider values (don't override them)
            const currentAmplitude = material.uniforms.amplitude.value;
            const currentFrequency = material.uniforms.frequency.value;

            // Store original values if not already stored
            if (!material.userData.originalAmplitude) {
              material.userData.originalAmplitude = currentAmplitude;
              material.userData.originalFrequency = currentFrequency;
            }

            // Apply event enhancement only for correct/wrong, not pass
            const eventBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventAnimationRef.current.type === "wrong"
                ? eventIntensity * 3.0 // Much stronger boost for wrong answers
                : eventIntensity * 1.5; // Normal boost for correct answers
            const eventFreqBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventAnimationRef.current.type === "wrong"
                ? eventIntensity * 4.0 // Much stronger frequency boost for wrong answers
                : eventIntensity * 2; // Normal frequency boost for correct answers

            // Use random amplitude value (0.25-0.5) plus audio intensity and event boost
            material.uniforms.amplitude.value = Math.min(
              randomAmplitudeRef.current.variation + // Use random amplitude (0.25-0.5)
                intensity * 0.4 +
                eventBoost,
              0.8 // Maximum amplitude cap
            );
            material.uniforms.frequency.value = Math.min(
              randomAmplitudeRef.current.intensityVariation + // Use random intensity (1.12-2.8)
                intensity * 1.2 +
                eventFreqBoost, // Reduced audio multiplier
              4.0 // Maximum frequency cap
            );
            // Set maxDistance based on event type
            material.uniforms.maxDistance.value =
              eventAnimationRef.current.type === "wrong"
                ? 0.8 // Lower maxDistance for wrong answers
                : material.userData.originalMaxDistance;
          } else {
            // When no sound is playing, smoothly transition to GUI defaults
            // Set targets to GUI defaults and let lerp handle smooth transition
            randomAmplitudeRef.current.targetVariation =
              material.userData.originalAmplitude || 0.25;
            randomAmplitudeRef.current.targetIntensityVariation =
              material.userData.originalFrequency || 1.12;

            // Continue smooth interpolation towards GUI defaults (much slower)
            const slowLerpSpeed = 0.008; // Very slow transition when audio stops
            randomAmplitudeRef.current.variation = THREE.MathUtils.lerp(
              randomAmplitudeRef.current.variation,
              randomAmplitudeRef.current.targetVariation,
              slowLerpSpeed
            );
            randomAmplitudeRef.current.intensityVariation =
              THREE.MathUtils.lerp(
                randomAmplitudeRef.current.intensityVariation,
                randomAmplitudeRef.current.targetIntensityVariation,
                slowLerpSpeed
              );

            // When no audio, return to GUI slider values with event enhancement only
            if (material.userData.originalAmplitude !== undefined) {
              const eventBoost =
                eventAnimationRef.current.type === "pass"
                  ? 0
                  : eventAnimationRef.current.type === "wrong"
                  ? eventIntensity * 3.0 // Much stronger boost for wrong answers
                  : eventIntensity * 2; // Normal boost for correct answers
              const eventFreqBoost =
                eventAnimationRef.current.type === "pass"
                  ? 0
                  : eventAnimationRef.current.type === "wrong"
                  ? eventIntensity * 4.0 // Much stronger frequency boost for wrong answers
                  : eventIntensity * 3; // Normal frequency boost for correct answers

              material.uniforms.amplitude.value =
                material.userData.originalAmplitude + eventBoost;
              material.uniforms.frequency.value =
                material.userData.originalFrequency + eventFreqBoost;
              // Set maxDistance based on event type
              material.uniforms.maxDistance.value =
                eventAnimationRef.current.type === "wrong"
                  ? 0.8 // Lower maxDistance for wrong answers
                  : material.userData.originalMaxDistance;
            }
          }
        } catch (error) {
          // Smoothly transition to GUI defaults when no audio analysis is available
          randomAmplitudeRef.current.targetVariation =
            material.userData.originalAmplitude || 0.25;
          randomAmplitudeRef.current.targetIntensityVariation =
            material.userData.originalFrequency || 1.12;

          // Continue smooth interpolation towards GUI defaults (much slower)
          const slowLerpSpeed = 0.008; // Very slow transition when audio stops
          randomAmplitudeRef.current.variation = THREE.MathUtils.lerp(
            randomAmplitudeRef.current.variation,
            randomAmplitudeRef.current.targetVariation,
            slowLerpSpeed
          );
          randomAmplitudeRef.current.intensityVariation = THREE.MathUtils.lerp(
            randomAmplitudeRef.current.intensityVariation,
            randomAmplitudeRef.current.targetIntensityVariation,
            slowLerpSpeed
          );

          // If audio context isn't ready or available, use GUI values with event enhancement
          if (material.userData.originalAmplitude !== undefined) {
            const eventBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventAnimationRef.current.type === "wrong"
                ? eventIntensity * 3.0 // Much stronger boost for wrong answers
                : eventIntensity * 2; // Normal boost for correct answers
            const eventFreqBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventAnimationRef.current.type === "wrong"
                ? eventIntensity * 4.0 // Much stronger frequency boost for wrong answers
                : eventIntensity * 3; // Normal frequency boost for correct answers

            material.uniforms.amplitude.value =
              material.userData.originalAmplitude + eventBoost;
            material.uniforms.frequency.value =
              material.userData.originalFrequency + eventFreqBoost;
            // Set maxDistance based on event type
            material.uniforms.maxDistance.value =
              eventAnimationRef.current.type === "wrong"
                ? 0.8 // Lower maxDistance for wrong answers
                : material.userData.originalMaxDistance;
          } else {
            // Fallback to default values
            const eventBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventAnimationRef.current.type === "wrong"
                ? eventIntensity * 3.0 // Much stronger boost for wrong answers
                : eventIntensity * 2; // Normal boost for correct answers
            const eventFreqBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventAnimationRef.current.type === "wrong"
                ? eventIntensity * 4.0 // Much stronger frequency boost for wrong answers
                : eventIntensity * 3; // Normal frequency boost for correct answers

            material.uniforms.amplitude.value = 0.25 + eventBoost; // Match GUI default
            material.uniforms.frequency.value = 1.12 + eventFreqBoost; // Match GUI default
            // Set maxDistance based on event type
            material.uniforms.maxDistance.value =
              eventAnimationRef.current.type === "wrong"
                ? 0.8 // Lower maxDistance for wrong answers
                : 0.82; // Default maxDistance
          }
        }
      } else {
        // Smoothly transition to GUI defaults when no analyser is available
        randomAmplitudeRef.current.targetVariation =
          materialRef.current?.userData.originalAmplitude || 0.25;
        randomAmplitudeRef.current.targetIntensityVariation =
          materialRef.current?.userData.originalFrequency || 1.12;

        // Continue smooth interpolation towards GUI defaults (much slower)
        const slowLerpSpeed = 0.008; // Very slow transition when audio stops
        randomAmplitudeRef.current.variation = THREE.MathUtils.lerp(
          randomAmplitudeRef.current.variation,
          randomAmplitudeRef.current.targetVariation,
          slowLerpSpeed
        );
        randomAmplitudeRef.current.intensityVariation = THREE.MathUtils.lerp(
          randomAmplitudeRef.current.intensityVariation,
          randomAmplitudeRef.current.targetIntensityVariation,
          slowLerpSpeed
        );

        // Fallback animation when no analyser - use GUI values with event enhancement
        if (material.userData.originalAmplitude !== undefined) {
          const eventBoost =
            eventAnimationRef.current.type === "pass"
              ? 0
              : eventAnimationRef.current.type === "wrong"
              ? eventIntensity * 3.0 // Much stronger boost for wrong answers
              : eventIntensity * 2; // Normal boost for correct answers
          const eventFreqBoost =
            eventAnimationRef.current.type === "pass"
              ? 0
              : eventAnimationRef.current.type === "wrong"
              ? eventIntensity * 4.0 // Much stronger frequency boost for wrong answers
              : eventIntensity * 3; // Normal frequency boost for correct answers

          material.uniforms.amplitude.value =
            material.userData.originalAmplitude + eventBoost;
          material.uniforms.frequency.value =
            material.userData.originalFrequency + eventFreqBoost;
          // Set maxDistance based on event type
          material.uniforms.maxDistance.value =
            eventAnimationRef.current.type === "wrong"
              ? 0.4 // Lower maxDistance for wrong answers
              : material.userData.originalMaxDistance;
        } else {
          // Fallback to default values
          const eventBoost =
            eventAnimationRef.current.type === "pass"
              ? 0
              : eventAnimationRef.current.type === "wrong"
              ? eventIntensity * 3.0 // Much stronger boost for wrong answers
              : eventIntensity * 2; // Normal boost for correct answers
          const eventFreqBoost =
            eventAnimationRef.current.type === "pass"
              ? 0
              : eventAnimationRef.current.type === "wrong"
              ? eventIntensity * 4.0 // Much stronger frequency boost for wrong answers
              : eventIntensity * 3; // Normal frequency boost for correct answers

          material.uniforms.amplitude.value = 0.25 + eventBoost; // Match GUI default
          material.uniforms.frequency.value = 1.36 + eventFreqBoost; // Match GUI default
          // Set maxDistance based on event type
          material.uniforms.maxDistance.value =
            eventAnimationRef.current.type === "wrong"
              ? 0.4 // Lower maxDistance for wrong answers
              : 1.15; // Default maxDistance
        }
      }

      // Auto rotation (always continue) with event boost
      if (guiPropertiesRef.current?.autoRotate) {
        const rotationMultiplier = Math.min(
          1 + rotationBoostRef.current * 10,
          5
        ); // Cap at 5x max speed
        const deltaX =
          guiPropertiesRef.current.rotationSpeed.x * rotationMultiplier;
        const deltaY =
          guiPropertiesRef.current.rotationSpeed.y * rotationMultiplier;

        holder.rotation.x += deltaX;
        holder.rotation.y += deltaY;

        // Normalize rotation to prevent accumulation issues
        holder.rotation.x = holder.rotation.x % (Math.PI * 2);
        holder.rotation.y = holder.rotation.y % (Math.PI * 2);
      }

      // Background sampling removed - using default colors only

      // Apply event colors if active and not a pass event, otherwise use default colors
      if (
        eventAnimationRef.current.isActive &&
        eventIntensity > 0 &&
        eventAnimationRef.current.type !== "pass"
      ) {
        // Blend event colors with current colors
        const currentStart = material.uniforms.startColor.value;
        const currentEnd = material.uniforms.endColor.value;

        // Create target colors
        const targetStart = new THREE.Color(eventColors.start);
        const targetEnd = new THREE.Color(eventColors.end);

        // Lerp between current and target colors based on event intensity
        material.uniforms.startColor.value.lerp(
          targetStart,
          eventIntensity * 0.8
        );
        material.uniforms.endColor.value.lerp(targetEnd, eventIntensity * 0.8);

        // Removed lighting code since it doesn't affect background video
      } else {
        // Return to default white colors when no event is active
        const defaultStart = new THREE.Color(0xffffff);
        const defaultEnd = new THREE.Color(0xcccccc);
        material.uniforms.startColor.value.lerp(defaultStart, 0.1);
        material.uniforms.endColor.value.lerp(defaultEnd, 0.1);
      }

      // Update video texture for smooth playback
      if (
        videoTexture &&
        videoElement &&
        videoElement.readyState >= videoElement.HAVE_CURRENT_DATA
      ) {
        videoTexture.needsUpdate = true;
      }

      // Update time (always continue)
      timeRef.current += 0.1;
      material.uniforms.time.value = timeRef.current;

      // Apply sinusoidal size variation (±0.5 of current value)
      const baseSize = material.uniforms.baseSize.value;
      const sizeVariation = Math.sin(timeRef.current * 0.125) * 0.5;
      material.uniforms.size.value = baseSize + baseSize * sizeVariation;

      // Render with bloom post-processing (always continue)
      composer.render();

      animationRef.current = requestAnimationFrame(animate);
    };

    // Always start animation immediately
    animate();

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
      if (composerRef.current) {
        composerRef.current.dispose();
      }

      // Clean up video element
      if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
        videoElement.load();
      }
      if (videoTexture) {
        videoTexture.dispose();
      }
      if (renderer && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [audioRef]); // Only depend on audioRef, not isPlaying!

  // Setup audio context (runs when isPlaying changes)
  useEffect(() => {
    if (!isPlaying || !audioRef?.current) return;

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

    setupAudioContext();
  }, [isPlaying, audioRef]);

  // Handle sound events
  useEffect(() => {
    if (soundEvent && soundEvent !== soundEventRef.current) {
      soundEventRef.current = soundEvent;

      // Reset any existing event to prevent overlap/accumulation
      rotationBoostRef.current = 0;

      // Trigger visual reaction based on sound event type
      eventAnimationRef.current = {
        isActive: true,
        startTime: Date.now(),
        duration: soundEvent.type === "wrong" ? 750 : 1000, // 50% shorter duration for wrong
        type: soundEvent.type,
      };

      console.log("Sound event triggered:", soundEvent);
    }
  }, [soundEvent]);

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
          width: "1080px",
          height: "1080px",
        }}
      />
    </div>
  );
};

export default AudioVisualizer;
