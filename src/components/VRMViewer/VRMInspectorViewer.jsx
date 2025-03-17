/// src/components/VRMViewer/VRMInspectorViewer.jsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { SkeletonHelper } from 'three';
import { useI18n } from '@/lib/i18n';

export const VRMInspectorViewer = ({ url, onMetadataLoad }) => {
  const { t } = useI18n();
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const vrmRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const loadingIndicatorRef = useRef(null);
  const frameIdRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isDraggingAvatarRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const skeletonHelperRef = useRef(null);
  const prevUrlRef = useRef(null);
  const contextLostRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [skeletonMode, setSkeletonMode] = useState(false);

  // Modify the initialization effect to not depend on t
  useEffect(() => {
    if (!canvasRef.current) return;
  
    console.log('Initializing 3D scene');
    let isActive = true;
    const canvas = canvasRef.current;
  
    try {
      // Initialize renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;

      // IMPORTANT: Only set these after the renderer is created
      const gl = renderer.getContext();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      // Set up texture loader with correct settings
      const textureLoader = new THREE.TextureLoader();
      textureLoader.manager.onLoad = () => {
        const gl = renderer.getContext();
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      };

      rendererRef.current = renderer;
      
      // Handle resizing
      const handleResize = () => {
        if (!canvas.parentElement) return;
        
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight;
        const aspectRatio = width / height;
        
        if (cameraRef.current) {
          cameraRef.current.aspect = aspectRatio;
          cameraRef.current.updateProjectionMatrix();
        }
        
        renderer.setSize(width, height, false);
      };
  
      handleResize();
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(canvas.parentElement);

      // Create scene
      const scene = new THREE.Scene();
      
      // Create background
      scene.background = new THREE.Color("#e6f3f9");
      
      // Enhanced fog effect
      const fogColor = new THREE.Color("#d1ebf7");
      scene.fog = new THREE.Fog(fogColor, 7, 18);
      sceneRef.current = scene;

      // Setup camera
      const camera = new THREE.PerspectiveCamera(
        45.0,
        (canvas.clientWidth || 800) / (canvas.clientHeight || 600),
        0.1,
        100.0
      );
      camera.position.set(0, 1.5, 3);
      camera.lookAt(0, 1, 0);
      cameraRef.current = camera;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1);
      mainLight.position.set(1, 2, 1);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
      fillLight.position.set(-1, 1, -1);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffcc88, 0.5);
      rimLight.position.set(0, 0, -5);
      scene.add(rimLight);
      
      // Add floor
      const floorGeometry = new THREE.PlaneGeometry(30, 30);
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.05,
        roughness: 0.8,
        transparent: true,
        opacity: 0.5
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.receiveShadow = true;
      scene.add(floor);
      
      // Add grid
      const gridSize = 30;
      const divisions = 60;
      const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x888888, 0xaaaaaa);
      gridHelper.position.y = 0.01;
      
      // Apply vertex colors to create fade-out effect for grid
      const gridColors = gridHelper.geometry.attributes.color;
      const positionAttribute = gridHelper.geometry.attributes.position;
      const maxDistance = gridSize / 2 * 0.8;
      
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);
        const distance = Math.sqrt(x * x + z * z);
        
        // Calculate opacity based on distance from center
        const opacity = Math.max(0, 1 - (distance / maxDistance));
        
        // Apply to color alpha (preserve existing RGB values)
        const r = gridColors.getX(i);
        const g = gridColors.getY(i);
        const b = gridColors.getZ(i);
        
        // Lower alpha value for points farther from center
        gridColors.setXYZ(i, r * opacity, g * opacity, b * opacity);
      }
      
      // Mark attributes as needing update
      gridColors.needsUpdate = true;
      
      // Set grid material to use vertex colors
      gridHelper.material.vertexColors = true;
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.7;
      
      scene.add(gridHelper);
      
      // Create loading indicator - from original VRMViewer
      const loadingCanvas = document.createElement('canvas');
      loadingCanvas.width = 256;
      loadingCanvas.height = 256;
      const ctx = loadingCanvas.getContext('2d');
      ctx.font = 'bold 180px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText('⏳', 128, 128);
      
      const loadingTexture = new THREE.CanvasTexture(loadingCanvas);
      const loadingMaterial = new THREE.SpriteMaterial({
        map: loadingTexture,
        transparent: true,
        depthTest: false
      });
      
      const loadingSprite = new THREE.Sprite(loadingMaterial);
      loadingSprite.scale.set(0.5, 0.5, 1);
      loadingSprite.position.set(0, 1.0, 0);
      loadingSprite.visible = false; // Initially hidden
      scene.add(loadingSprite);
      loadingIndicatorRef.current = loadingSprite;
      
      // Setup controls
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      // Use same controls settings as original VRMViewer
      controls.maxPolarAngle = Math.PI / 1.8;
      controls.minPolarAngle = 0;
      controls.enableZoom = true;
      controls.minDistance = 1;
      controls.maxDistance = 5;
      controls.target.set(0, 1, 0);
      
      // Make sure we enable all needed controls
      controls.enableRotate = true;
      controls.enablePan = true;
      
      // Additional controls settings to ensure they work properly
      controls.rotateSpeed = 0.7;
      controls.zoomSpeed = 1.0;
      controls.panSpeed = 0.7;
      
      // Prevent orbitcontrols from capturing keyboard
      controls.enableKeys = false;
      
      // Make sure touch controls work on mobile
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
      
      // Ensure controls are properly set up
      controls.update();
      controlsRef.current = controls;

      // Create helpers for basic model
      const axesHelper = new THREE.AxesHelper(1);
      axesHelper.position.set(0, 0.001, 0);
      scene.add(axesHelper);

      // Avatar direct rotation controls from original VRMViewer
      const handleMouseDown = (event) => {
        if (!vrmRef.current) return;
        
        // Get canvas-relative mouse coordinates
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        mouseRef.current.set(x, y);
        
        // Ensure raycaster is initialized
        if (!raycasterRef.current) {
          raycasterRef.current = new THREE.Raycaster();
        }
        
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        
        // Check if we're clicking on the avatar
        const intersects = raycasterRef.current.intersectObject(vrmRef.current.scene, true);
        
        if (intersects.length > 0) {
          // We clicked on the avatar
          isDraggingAvatarRef.current = true;
          previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
          
          // Disable orbit controls while dragging the avatar
          if (controlsRef.current) {
            controlsRef.current.enabled = false;
          }
        }
      };
      
      const handleMouseMove = (event) => {
        if (isDraggingAvatarRef.current && vrmRef.current) {
          // Calculate rotation based on mouse movement
          const deltaX = event.clientX - previousMousePositionRef.current.x;
          
          // Rotate the avatar around its Y-axis
          vrmRef.current.scene.rotation.y += deltaX * 0.01;
          
          // Update previous position
          previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
        }
      };
      
      const handleMouseUp = () => {
        if (isDraggingAvatarRef.current) {
          isDraggingAvatarRef.current = false;
          
          // Re-enable orbit controls
          if (controlsRef.current) {
            controlsRef.current.enabled = true;
          }
        }
      };
      
      // Add event listeners for avatar rotation
      canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      // Animation loop
      const animate = () => {
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          const delta = clockRef.current.getDelta();
          
          // Update VRM animations
          if (vrmRef.current) {
            // If there's a mixer with animations, update it
            if (mixerRef.current) {
              mixerRef.current.update(delta);
            }
            
            // Update VRM with proper delta time for smooth animations
            if (typeof vrmRef.current.update === 'function') {
              vrmRef.current.update(delta);
            }
          }
          
          // Update controls
          if (controlsRef.current) {
            controlsRef.current.update();
          }
          
          // Render scene
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        
        // Continue animation loop only if component is still mounted
        if (isActive) {
          frameIdRef.current = requestAnimationFrame(animate);
        }
      };
      
      // Start animation loop
      animate();

      // Cleanup function
      return () => {
        isActive = false;
        if (frameIdRef.current) {
          cancelAnimationFrame(frameIdRef.current);
        }
        
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        
        // Remove event listeners
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }

        if (vrmRef.current) {
          VRMUtils.deepDispose(vrmRef.current.scene);
        }
      };
    } catch (err) {
      console.error('Error initializing scene:', err);
      setError('Failed to initialize 3D scene');
    }
  }, []); // Remove t from dependencies

  // Add separate effect for error message translation
  useEffect(() => {
    if (error) {
      setError(t('vrmviewer.errors.initializationFailed'));
    }
  }, [t, error]);

  // Handle URL changes to load the VRM model
  useEffect(() => {
    if (!url || !sceneRef.current || !loadingIndicatorRef.current) return;
    
    // FIXED: Check for repeated loading of the same URL using the ref properly
    if (prevUrlRef.current === url) {
      console.log('🔍 DEBUG - Preventing reload of the same URL:', url);
      return;
    }
    
    // Update the stored URL
    prevUrlRef.current = url;
    
    // Show loading indicator
    console.log('🔍 DEBUG - Loading process starting with URL:', url);
    loadingIndicatorRef.current.visible = true;
    setIsLoading(true);
    setError(null);
    
    // Clean up previous VRM and its expressions
    if (vrmRef.current) {
      console.log('🔍 DEBUG - Cleaning up previous VRM model');
      // Clean up expressions
      if (vrmRef.current.expressionManager) {
        Object.values(vrmRef.current.expressionManager.expressions).forEach(expression => {
          if (expression) {
            expression.weight = 0;
            if (typeof expression.applyWeight === 'function') {
              expression.applyWeight();
            }
          }
        });
      }
      // Clean up morph targets
      vrmRef.current.scene.traverse((node) => {
        if (node.isMesh && node.morphTargetInfluences) {
          node.morphTargetInfluences.fill(0);
          if (typeof node.updateMorphTargets === 'function') {
            node.updateMorphTargets();
          }
        }
      });
      // Dispose VRM
      VRMUtils.deepDispose(vrmRef.current.scene);
      sceneRef.current.remove(vrmRef.current.scene);
      vrmRef.current = null;
    }
    
    // Remove skeleton helper if it exists
    if (skeletonHelperRef.current) {
      sceneRef.current.remove(skeletonHelperRef.current);
      skeletonHelperRef.current = null;
    }
    
    // Create GLTFLoader
    const loader = new GLTFLoader();
    
    // Register VRM plugin - specialized for VRM Inspector
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });
    
    console.log('🔍 DEBUG - GLTFLoader created, about to load VRM');
    
    // Load the VRM
    loader.load(
      url,
      async (gltf) => {
        console.log('🔍 DEBUG - GLTF loaded successfully, processing data');
        try {
          // Get VRM instance from userData
          const vrm = gltf.userData.vrm;
          
          console.log('🔍 DEBUG - VRM data from GLTF:', vrm ? 'Found' : 'Not found');
          
          if (!vrm) {
            console.error('No VRM data found in the GLTF');
            setError(t('vrmviewer.errors.noVrmData'));
            hideLoadingIndicator();
            setIsLoading(false);
            return;
          }
          
          // Save reference to VRM and initialize expressions
          vrmRef.current = vrm;
          vrm.updateExpression = updateExpression;
          
          // Initialize expression manager if available
          if (vrm.expressionManager) {
            console.log('🔍 DEBUG - Initializing expression manager');
            if (typeof vrm.expressionManager.setup === 'function') {
              vrm.expressionManager.setup();
            }
            
            // Reset all expressions to 0
            Object.values(vrm.expressionManager.expressions).forEach(expression => {
              if (expression) {
                expression.weight = 0;
                if (typeof expression.applyWeight === 'function') {
                  expression.applyWeight();
                }
              }
            });
            
            // Force expression manager update
            if (typeof vrm.expressionManager.update === 'function') {
              vrm.expressionManager.update();
            }
          }

          // Extract and send metadata
          console.log('🔍 DEBUG - Extracting VRM metadata');
          const metadata = extractVRMMetadata(vrm, gltf);
          console.log('🔍 DEBUG - Extracted metadata:', metadata);
          
          if (metadata && onMetadataLoad) {
            console.log('🔍 DEBUG - Calling onMetadataLoad with metadata and VRM instance');
            onMetadataLoad({
              ...metadata,
              vrm,
              gltf
            });
          }
          
          // Setup the scene
          vrm.scene.traverse((object) => {
            if (object.isMesh) {
              object.castShadow = true;
              object.receiveShadow = true;
              
              // Update materials when wireframe mode changes
              if (wireframeMode) {
                object.material.wireframe = true;
              }
            }
          });
          
          // Rotate the VRM model 180 degrees so it faces the camera
          vrm.scene.rotation.y = Math.PI;
          
          // Add VRM to scene
          sceneRef.current.add(vrm.scene);
          console.log('🔍 DEBUG - VRM added to scene');
          
          // Setup skeleton helper if needed
          if (skeletonMode) {
            createSkeletonVisualization(vrm);
          }
          
          // Reset camera position if needed
          if (cameraRef.current && controlsRef.current) {
            // Only reset if significantly off-center
            if (controlsRef.current.target.distanceTo(new THREE.Vector3(0, 1, 0)) > 1) {
              controlsRef.current.target.set(0, 1, 0);
              cameraRef.current.position.set(0, 1.5, 3);
              controlsRef.current.update();
            }
          }
          
          // Hide loading indicator after everything is done
          hideLoadingIndicator();
          setIsLoading(false);
          
        } catch (error) {
          console.error('Error setting up VRM:', error);
          setError(t('vrmviewer.errors.setupFailed', { error: error.message }));
          hideLoadingIndicator();
          setIsLoading(false);
        }
      },
      (progress) => {
        const percent = Math.floor((progress.loaded / progress.total) * 100);
        console.log(`Loading VRM: ${percent}%`);
      },
      (error) => {
        console.error('Error loading VRM:', error);
        setError(t('vrmviewer.errors.loadFailed', { error: error.message }));
        
        // Make sure we hide the loading indicator on error
        if (loadingIndicatorRef.current) {
          loadingIndicatorRef.current.visible = false;
        }
        setIsLoading(false);
      }
    );
    
    // Safety net: force hide loading indicator after 30 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      console.log('🔍 DEBUG - Safety timeout reached, forcing loading indicator off');
      if (loadingIndicatorRef.current) {
        loadingIndicatorRef.current.visible = false;
      }
      setIsLoading(false);
    }, 30000);
    
    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [url, onMetadataLoad, wireframeMode, skeletonMode, t]);

  // Add separate effects to handle wireframe and skeleton mode changes
  useEffect(() => {
    if (!vrmRef.current) return;
    
    // Update wireframe mode on existing model
    vrmRef.current.scene.traverse((object) => {
      if (object.isMesh && object.material) {
        object.material.wireframe = wireframeMode;
      }
    });
  }, [wireframeMode]);

  useEffect(() => {
    try {
      if (!vrmRef.current || !sceneRef.current) return;
      
      // Handle skeleton helper visibility
      if (skeletonMode && !skeletonHelperRef.current) {
        console.log('🔍 DEBUG - Creating skeleton in useEffect');
        createSkeletonVisualization(vrmRef.current);
      } else if (!skeletonMode && skeletonHelperRef.current) {
        console.log('🔍 DEBUG - Removing skeleton in useEffect');
        sceneRef.current.remove(skeletonHelperRef.current);
        skeletonHelperRef.current = null;
        
        // Remove any spring bone visualization markers
        if (vrmRef.current) {
          vrmRef.current.scene.traverse((obj) => {
            if (obj.isMesh && obj.material && obj.material.color && obj.material.color.equals(new THREE.Color(0xff00ff))) {
              if (obj.parent) {
                obj.parent.remove(obj);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in skeletonMode useEffect:', error);
    }
  }, [skeletonMode]);

  // Extract VRM metadata - specialized for Inspector
  const extractVRMMetadata = (vrm, gltf) => {
    try {
      console.log('🔍 DEBUG - Extracting metadata from VRM');
      
      // Get raw metadata from VRM instance
      const rawMetadata = vrm.meta;
      
      if (!rawMetadata) {
        console.error('No metadata found in VRM');
        return null;
      }

      // Detect VRM version
      let vrmVersion;
      if (gltf.parser?.json?.extensions?.VRM) {
        vrmVersion = 'VRM 0.x';
      } else if (gltf.parser?.json?.extensions?.VRMC_vrm) {
        vrmVersion = 'VRM 1.0';
      } else if (rawMetadata.metaVersion === 0) {
        vrmVersion = 'VRM 0.x';
      } else if (rawMetadata.specVersion) {
        vrmVersion = `VRM ${rawMetadata.specVersion}`;
      } else {
        vrmVersion = 'Unknown';
      }
      
      // Basic model stats
      let triangleCount = 0;
      let materialCount = 0;
      let avatarHeight = 0;
      const materials = new Set();
      
      // Calculate avatar height using bounding box
      const bbox = new THREE.Box3().setFromObject(vrm.scene);
      avatarHeight = bbox.max.y - bbox.min.y;
      console.log('🔍 DEBUG - Calculated avatar height:', avatarHeight.toFixed(2), 'units');
      
      vrm.scene.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) {
            if (obj.geometry.index) {
              triangleCount += obj.geometry.index.count / 3;
            } else if (obj.geometry.attributes.position) {
              triangleCount += obj.geometry.attributes.position.count / 3;
            }
          }
          
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => materials.add(mat));
            } else {
              materials.add(obj.material);
            }
          }
        }
      });
      
      materialCount = materials.size;
      
      // Create metadata object to return
      const metadata = {
        ...rawMetadata,
        triangleCount,
        materialCount,
        avatarHeight,
        vrmVersion, // Add the detected version
        vrm, // Pass the VRM instance
        gltf // Pass the GLTF instance
      };
      
      console.log('🔍 DEBUG - Extracted metadata:', metadata);
      return metadata;
    } catch (err) {
      console.error('Error extracting VRM metadata:', err);
      return null;
    }
  };

  // Toggle wireframe mode
  const toggleWireframeMode = () => {
    const newMode = !wireframeMode;
    setWireframeMode(newMode);
    
    if (vrmRef.current) {
      vrmRef.current.scene.traverse((object) => {
        if (object.isMesh) {
          object.material.wireframe = newMode;
        }
      });
    }
  };

  // Toggle skeleton mode
  const toggleSkeletonMode = () => {
    try {
      const newMode = !skeletonMode;
      setSkeletonMode(newMode);
      
      if (newMode && vrmRef.current && !skeletonHelperRef.current) {
        console.log('🔍 DEBUG - Creating skeleton in toggleSkeletonMode');
        createSkeletonVisualization(vrmRef.current);
      } else if (!newMode && skeletonHelperRef.current && sceneRef.current) {
        console.log('🔍 DEBUG - Removing skeleton in toggleSkeletonMode');
        sceneRef.current.remove(skeletonHelperRef.current);
        skeletonHelperRef.current = null;
        
        // Remove any spring bone visualization markers
        if (vrmRef.current) {
          vrmRef.current.scene.traverse((obj) => {
            if (obj.isMesh && obj.material && obj.material.color && obj.material.color.equals(new THREE.Color(0xff00ff))) {
              if (obj.parent) {
                obj.parent.remove(obj);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in toggleSkeletonMode:', error);
    }
  };

  // Create skeleton visualization - safer approach that works with different VRM versions
  const createSkeletonVisualization = (vrm) => {
    // Clean up existing skeleton helper if it exists
    if (skeletonHelperRef.current && sceneRef.current) {
      sceneRef.current.remove(skeletonHelperRef.current);
      skeletonHelperRef.current = null;
    }
    
    if (!vrm || !sceneRef.current) {
      console.log('🔍 DEBUG - No VRM or scene available for skeleton visualization');
      return;
    }
    
    console.log('🔍 DEBUG - Creating skeleton visualization');
    
    try {
      // Use the entire scene as the skeleton root for simplicity and safety
      const skeletonRoot = vrm.scene;
      
      // Create a safer skeleton helper that doesn't depend on the humanoid structure
      const helper = new THREE.SkeletonHelper(skeletonRoot);
      helper.material.linewidth = 3;
      helper.visible = true;
      helper.material.color = new THREE.Color(0x00ffff); // Bright cyan
      sceneRef.current.add(helper);
      skeletonHelperRef.current = helper;
      
      console.log('🔍 DEBUG - Skeleton helper created successfully');
      
      // Also check for spring bones if this is a VRM with that feature
      if (vrm.springBoneManager || vrm.springBone) {
        console.log('🔍 DEBUG - Spring bones detected, visualizing spring bones');
        
        // Simple spring bone visualization
        const springBones = vrm.springBoneManager?.springBones || vrm.springBone?.springBones;
        if (springBones && springBones.length > 0) {
          console.log('🔍 DEBUG - Total spring bones found:', springBones.length);
          
          // Add a visual marker for each spring bone joint
          springBones.forEach((springBone, index) => {
            try {
              // For VRM 0.x
              if (springBone.joints) {
                springBone.joints.forEach((joint, jointIndex) => {
                  if (joint.node) {
                    // Add a small sphere to visualize the spring bone joint
                    const sphere = new THREE.Mesh(
                      new THREE.SphereGeometry(0.01, 8, 8),
                      new THREE.MeshBasicMaterial({ color: 0xff00ff }) // Magenta
                    );
                    sphere.position.copy(joint.node.position);
                    joint.node.add(sphere);
                  }
                });
              }
              // For VRM 1.0
              else if (springBone.hitRadius && springBone.center) {
                // Add a small sphere to visualize the spring bone
                const sphere = new THREE.Mesh(
                  new THREE.SphereGeometry(springBone.hitRadius, 8, 8),
                  new THREE.MeshBasicMaterial({ 
                    color: 0xff00ff, // Magenta
                    transparent: true,
                    opacity: 0.3,
                    wireframe: true
                  })
                );
                if (springBone.center) {
                  sphere.position.copy(springBone.center.position);
                  springBone.center.add(sphere);
                }
              }
            } catch (err) {
              console.error('Error creating spring bone visualization:', err);
            }
          });
        }
      }
    } catch (err) {
      console.error('Error creating skeleton helper:', err);
    }
  };

  // Update the skeleton visualization in the animation loop if needed
  const updateSkeletonVisualization = () => {
    // The SkeletonHelper automatically updates with the model
    // Custom spring bone visualization would update here if implemented
  };

  // Add a function to update expressions
  const updateExpression = (expressionName, weight) => {
    if (!vrmRef.current || !vrmRef.current.expressionManager) {
      console.warn('No VRM or expression manager available');
      return;
    }

    const expressionManager = vrmRef.current.expressionManager;
    
    // Find the target expression
    let targetExpression = null;
    Object.entries(expressionManager.expressions).forEach(([key, expression]) => {
      if (expression && expression.name === `VRMExpression_${expressionName}`) {
        targetExpression = expression;
      }
    });

    if (targetExpression) {
      // Ensure weight is between 0 and 1
      const clampedWeight = Math.max(0, Math.min(1, weight));
      
      // Set the weight
      targetExpression.weight = clampedWeight;
      
      // Apply the weight if the function exists
      if (typeof targetExpression.applyWeight === 'function') {
        targetExpression.applyWeight();
      }

      // Force update the expression manager
      if (typeof expressionManager.update === 'function') {
        expressionManager.update();
      }

      // Update all meshes with morph targets
      vrmRef.current.scene.traverse((node) => {
        if (node.isMesh && node.morphTargetInfluences && node.morphTargetDictionary) {
          let needsUpdate = false;
          const cleanExpressionName = expressionName.toLowerCase();
          
          // Get all morph targets that could match this expression
          const matchingMorphs = Object.entries(node.morphTargetDictionary).filter(([morphName]) => {
            const lowerMorphName = morphName.toLowerCase();
            // Check for exact matches first
            if (lowerMorphName === `blendshape1.funazushi_277_${cleanExpressionName}` ||
                lowerMorphName === `blendshape1.funazushi_276_${cleanExpressionName}`) {
              return true;
            }
            // Then check for partial matches
            return lowerMorphName.includes(cleanExpressionName);
          });

          // If we found matching morph targets, update them
          if (matchingMorphs.length > 0) {
            matchingMorphs.forEach(([morphName, morphIndex]) => {
              // Scale the weight based on the morph target's name pattern
              let scaledWeight = clampedWeight;
              
              // Some VRMs use binary expressions (0 or 1)
              const isBinaryExpression = morphName.toLowerCase().includes('binary_') || 
                                      targetExpression.isBinary;
              
              if (isBinaryExpression) {
                // For binary expressions, use a threshold
                scaledWeight = clampedWeight >= 0.5 ? 1 : 0;
              } else {
                // For continuous expressions, apply easing
                // This helps with more natural expression transitions
                scaledWeight = Math.pow(clampedWeight, 1.5); // Slight easing curve
              }

              // Only update if the weight has actually changed
              if (node.morphTargetInfluences[morphIndex] !== scaledWeight) {
                node.morphTargetInfluences[morphIndex] = scaledWeight;
                needsUpdate = true;
              }
            });
          }

          if (needsUpdate) {
            // Force geometry updates
            if (node.geometry) {
              node.geometry.attributes.position.needsUpdate = true;
              if (node.geometry.attributes.normal) {
                node.geometry.attributes.normal.needsUpdate = true;
              }
              node.geometry.computeBoundingSphere();
              node.geometry.computeBoundingBox();
            }

            // Force material update
            if (node.material) {
              node.material.needsUpdate = true;
            }

            // Force morph target update
            if (typeof node.updateMorphTargets === 'function') {
              node.updateMorphTargets();
            }
          }
        }
      });

      // Final expression manager update
      if (typeof expressionManager.update === 'function') {
        expressionManager.update();
      }
    } else {
      console.warn(`Expression ${expressionName} not found`);
    }
  };

  // Expose the updateExpression function
  useEffect(() => {
    if (vrmRef.current) {
      vrmRef.current.updateExpression = updateExpression;
    }
  }, [vrmRef.current]);

  // Update loading indicator visibility when URL changes
  useEffect(() => {
    if (loadingIndicatorRef.current) {
      loadingIndicatorRef.current.visible = !!url;
    }
  }, [url]);

  // Hide loading indicator when VRM is loaded
  const hideLoadingIndicator = () => {
    if (loadingIndicatorRef.current) {
      loadingIndicatorRef.current.visible = false;
    }
  };

  // Add event listeners for WebGL context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextLost = (event) => {
      event.preventDefault();
      contextLostRef.current = true;
    };

    const handleContextRestored = () => {
      contextLostRef.current = false;
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.setAnimationLoop(() => {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        });
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, []);

  // Preserve renderer during re-renders
  useEffect(() => {
    if (rendererRef.current && !contextLostRef.current) {
      const preserveDrawingBuffer = true;
      rendererRef.current.preserveDrawingBuffer = preserveDrawingBuffer;
    }
  });

  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ touchAction: "none" }}
      />
      
      {/* Control buttons group - style matching original VRMViewer */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-4">
        <button
          onClick={toggleWireframeMode}
          className={`px-6 py-2 rounded-md transition-all ${
            wireframeMode 
              ? 'bg-white text-black font-medium border border-gray-200' 
              : 'bg-white bg-opacity-90 text-black font-medium border border-gray-200 hover:bg-opacity-100'
          }`}
          style={{ 
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          {wireframeMode ? t('vrmviewer.buttons.hideWireframe') : t('vrmviewer.buttons.showWireframe')}
        </button>
        
        <button
          onClick={toggleSkeletonMode}
          className={`px-6 py-2 rounded-md transition-all ${
            skeletonMode 
              ? 'bg-white text-black font-medium border border-gray-200' 
              : 'bg-white bg-opacity-90 text-black font-medium border border-gray-200 hover:bg-opacity-100'
          }`}
          style={{ 
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          {skeletonMode ? t('vrmviewer.buttons.hideBones') : t('vrmviewer.buttons.showBones')}
        </button>
      </div>
      
      {/* Loading message - positioned at center like VRMViewer */}
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
          {t('vrmviewer.loading')}
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-red-500 bg-opacity-90 text-white px-4 py-2 rounded max-w-md text-center">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default VRMInspectorViewer; 