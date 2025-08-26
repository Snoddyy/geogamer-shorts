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
uniform float glowIntensity;

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
  
  // Enhanced glow effect controlled by glowIntensity uniform
  float glow = circ.r * (1.0 + vDistance * 0.5) * glowIntensity;
  float alpha = glow * (0.8 + vDistance * 0.4);
  
  // Boost color brightness based on glow intensity
  vec3 finalColor = color * (1.0 + glow * glowIntensity);
  
  gl_FragColor=vec4(finalColor, alpha);
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
  // Removed lighting refs since they don't affect background video

  // Color sampling refs
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const colorSamplingRef = useRef({ enabled: false, intensity: 0.7 }); // Disabled by default

  // Sound event reaction refs
  const soundEventRef = useRef(null);
  const eventAnimationRef = useRef({
    isActive: false,
    startTime: 0,
    duration: 1000, // 1 second duration
    type: null,
  });
  const rotationBoostRef = useRef(0); // For rotation speed boost during events

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

    renderer.setClearColor(0x000000, 0);
    renderer.setSize(1080, 1080);
    renderer.autoClear = false;
    mountRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(70, 1080 / 1080, 0.1, 10000);
    camera.position.z = 4;
    camera.frustumCulled = false;

    const scene = new THREE.Scene();
    scene.add(camera);

    // Removed lighting setup since it doesn't affect the background video

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
        offsetSize: { value: 2.5 },
        size: { value: 2 }, // Updated default size
        frequency: { value: 2.5 }, // Updated default frequency
        amplitude: { value: 0.2 }, // Moderate amplitude for visible but controlled displacement
        offsetGain: { value: 0.1 }, // Slight Z oscillation for depth
        maxDistance: { value: 0.4 }, // Lower value for more visible displacement
        startColor: { value: new THREE.Color(0xffffff) }, // Pure white
        endColor: { value: new THREE.Color(0xcccccc) }, // Light gray for subtle variation
        glowIntensity: { value: 1.0 }, // Default glow intensity
      },
    });

    // Initialize userData to store original GUI values
    material.userData = {
      originalAmplitude: 0.2,
      originalFrequency: 4, // Updated to match new default
    };

    materialRef.current = material;

    // Create cube function
    const createCube = () => {
      let widthSeg = 80; // Default to 80 instead of random
      let heightSeg = 80; // Default to 80 instead of random
      let depthSeg = 80; // Default to 80 instead of random

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
      autoRandom: false, // Match GUI settings (unchecked)
      rotationSpeed: {
        x: -0.005, // Match GUI settings
        y: -0.005, // Match GUI settings
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
    shaderFolder
      .add(material.uniforms.glowIntensity, "value", 0, 10)
      .step(0.1)
      .name("Glow Intensity");

    // Color sampling controls
    const colorFolder = gui.addFolder("Background Colors");
    colorFolder
      .add(colorSamplingRef.current, "enabled")
      .name("Enable Background Sampling")
      .onChange((value) => {
        if (!value) {
          // Reset to white colors
          material.uniforms.startColor.value.setHex(0xffffff);
          material.uniforms.endColor.value.setHex(0xcccccc);
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

        // Apply intensity factor and mix with original white colors
        const originalStart = 0xffffff;
        const originalEnd = 0xcccccc;
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

          // Set colors and rotation boost based on event type
          switch (eventAnimationRef.current.type) {
            case "wrong":
              eventColors = { start: 0xff0000, end: 0x800000 }; // Red colors
              rotationBoostRef.current = eventIntensity * 2; // Much faster rotation (10x boost)
              break;
            case "correct":
              eventColors = { start: 0xffff00, end: 0x808000 }; // Yellow colors
              rotationBoostRef.current = eventIntensity * 2; // Much faster rotation (10x boost)
              break;
            case "pass":
              // No color effects for pass, but add rotation boost
              rotationBoostRef.current = eventIntensity * 2; // Same fast rotation as correct/wrong
              break;
          }
        }
      } else {
        // No active event - ensure clean reset
        rotationBoostRef.current = 0;
        eventIntensity = 0;
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
                : eventIntensity * 1.5; // Reduced from 2
            const eventFreqBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventIntensity * 2; // Reduced from 3

            // Clamp final values to prevent extreme deformation
            material.uniforms.amplitude.value = Math.min(
              material.userData.originalAmplitude +
                intensity * 0.4 +
                eventBoost, // Reduced audio multiplier
              0.8 // Maximum amplitude cap
            );
            material.uniforms.frequency.value = Math.min(
              material.userData.originalFrequency +
                intensity * 1.2 +
                eventFreqBoost, // Reduced audio multiplier
              4.0 // Maximum frequency cap
            );
          } else {
            // When no audio, return to GUI slider values with event enhancement only
            if (material.userData.originalAmplitude !== undefined) {
              const eventBoost =
                eventAnimationRef.current.type === "pass"
                  ? 0
                  : eventIntensity * 2;
              const eventFreqBoost =
                eventAnimationRef.current.type === "pass"
                  ? 0
                  : eventIntensity * 3;

              material.uniforms.amplitude.value =
                material.userData.originalAmplitude + eventBoost;
              material.uniforms.frequency.value =
                material.userData.originalFrequency + eventFreqBoost;
            }
          }
        } catch (error) {
          // If audio context isn't ready or available, use GUI values with event enhancement
          if (material.userData.originalAmplitude !== undefined) {
            const eventBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventIntensity * 2;
            const eventFreqBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventIntensity * 3;

            material.uniforms.amplitude.value =
              material.userData.originalAmplitude + eventBoost;
            material.uniforms.frequency.value =
              material.userData.originalFrequency + eventFreqBoost;
          } else {
            // Fallback to default values
            const eventBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventIntensity * 2;
            const eventFreqBoost =
              eventAnimationRef.current.type === "pass"
                ? 0
                : eventIntensity * 3;

            material.uniforms.amplitude.value = 0.2 + eventBoost;
            material.uniforms.frequency.value = 4 + eventFreqBoost; // Updated default
          }
        }
      } else {
        // Fallback animation when no analyser - use GUI values with event enhancement
        if (material.userData.originalAmplitude !== undefined) {
          const eventBoost =
            eventAnimationRef.current.type === "pass" ? 0 : eventIntensity * 2;
          const eventFreqBoost =
            eventAnimationRef.current.type === "pass" ? 0 : eventIntensity * 3;

          material.uniforms.amplitude.value =
            material.userData.originalAmplitude + eventBoost;
          material.uniforms.frequency.value =
            material.userData.originalFrequency + eventFreqBoost;
        } else {
          // Fallback to default values
          const eventBoost =
            eventAnimationRef.current.type === "pass" ? 0 : eventIntensity * 2;
          const eventFreqBoost =
            eventAnimationRef.current.type === "pass" ? 0 : eventIntensity * 3;

          material.uniforms.amplitude.value = 0.2 + eventBoost;
          material.uniforms.frequency.value = 4 + eventFreqBoost; // Updated default
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

      // Sample background colors (every few frames for performance)
      if (timeRef.current % 0.5 < 0.1) {
        sampleBackgroundColors();
      }

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
      } else if (!colorSamplingRef.current.enabled) {
        // Return to default white colors when no event is active and no background sampling
        const defaultStart = new THREE.Color(0xffffff);
        const defaultEnd = new THREE.Color(0xcccccc);
        material.uniforms.startColor.value.lerp(defaultStart, 0.1);
        material.uniforms.endColor.value.lerp(defaultEnd, 0.1);

        // Removed lighting code since it doesn't affect background video
      }

      // Update time (always continue)
      timeRef.current += 0.1;
      material.uniforms.time.value = timeRef.current;

      // Render (always continue)
      renderer.render(scene, camera);

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
      // Removed lighting cleanup since we removed the lighting system
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
        duration: soundEvent.type === "wrong" ? 1500 : 1000, // Longer duration for wrong
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
