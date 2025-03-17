/// src/components/VRMviewer/VRMviewer.jsx
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { loadMixamoAnimation } from './utils/animationLoader';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { SkeletonHelper } from 'three';
import { useI18n } from '@/lib/i18n';

export const VRMViewer = ({ url, animationUrl, backgroundGLB, onMetadataLoad }) => {
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
  const boneMarkersRef = useRef([]);
  const boneConnectionsRef = useRef([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedUrl, setProcessedUrl] = useState('');
  const [wireframeMode, setWireframeMode] = useState(false);
  const [skeletonMode, setSkeletonMode] = useState(false);
  const [metadata, setMetadata] = useState(null);

  // Process URL when it changes
  useEffect(() => {
      if (!url) return;
      
    console.log('Processing URL:', url);
    setIsLoading(true);
      
      // For direct Arweave URLs, use them directly
      if (url.includes('arweave.net')) {
        console.log('Direct Arweave URL detected, using as is');
        setProcessedUrl(url);
        return;
      }
      
      // Handle voxel:// protocol for Arweave voxel models
      if (url.startsWith('voxel://')) {
          const filename = url.replace('voxel://', '');
          
      // Call the resolver API (asynchronous)
      fetch('/api/resolve-voxel-url', {
            method: 'POST',
        headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename }),
      })
      .then(response => response.json())
      .then(data => {
            if (data.url) {
          console.log('Voxel URL resolved:', data.url);
              setProcessedUrl(data.url);
            } else {
              console.error('No URL in response:', data);
          setProcessedUrl(url); // Fallback
        }
      })
      .catch(error => {
        console.error('Error resolving voxel URL:', error);
        setProcessedUrl(url); // Fallback
      });
      } else {
      // Regular URL
        console.log('Using original URL:', url);
        setProcessedUrl(url);
      }
  }, [url]);

  // Handle custom camera control events for mobile
  useEffect(() => {
    const handleResetCamera = () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    };

    const handleZoomIn = () => {
      if (cameraRef.current && controlsRef.current) {
        // Get current zoom level
        const distance = controlsRef.current.getDistance();
        // Zoom in by reducing distance
        const newDistance = Math.max(distance * 0.8, 0.5);
        controlsRef.current.minDistance = newDistance;
        controlsRef.current.maxDistance = newDistance;
        controlsRef.current.update();
        // Reset min/max after animation
        setTimeout(() => {
          if (controlsRef.current) {
            controlsRef.current.minDistance = 0.5;
            controlsRef.current.maxDistance = 10;
          }
        }, 100);
      }
    };

    const handleZoomOut = () => {
      if (cameraRef.current && controlsRef.current) {
        // Get current zoom level
        const distance = controlsRef.current.getDistance();
        // Zoom out by increasing distance
        const newDistance = Math.min(distance * 1.2, 10);
        controlsRef.current.minDistance = newDistance;
        controlsRef.current.maxDistance = newDistance;
        controlsRef.current.update();
        // Reset min/max after animation
        setTimeout(() => {
          if (controlsRef.current) {
            controlsRef.current.minDistance = 0.5;
            controlsRef.current.maxDistance = 10;
          }
        }, 100);
      }
    };

    const handleToggleWireframe = () => {
      // Call toggleWireframeMode to toggle state
      toggleWireframeMode();
      console.log('Wireframe mode toggled to:', !wireframeMode);
    };

    const handleToggleSkeleton = () => {
      // Call toggleSkeletonMode to toggle state
      toggleSkeletonMode();
      console.log('Skeleton mode toggled to:', !skeletonMode);
    };

    window.addEventListener('reset-camera', handleResetCamera);
    window.addEventListener('zoom-in', handleZoomIn);
    window.addEventListener('zoom-out', handleZoomOut);
    window.addEventListener('toggle-wireframe', handleToggleWireframe);
    window.addEventListener('toggle-skeleton', handleToggleSkeleton);

    return () => {
      window.removeEventListener('reset-camera', handleResetCamera);
      window.removeEventListener('zoom-in', handleZoomIn);
      window.removeEventListener('zoom-out', handleZoomOut);
      window.removeEventListener('toggle-wireframe', handleToggleWireframe);
      window.removeEventListener('toggle-skeleton', handleToggleSkeleton);
    };
  }, [wireframeMode, skeletonMode]); // Add wireframeMode and skeletonMode as dependencies to ensure latest values

  // Extract VRM metadata
  const extractVRMMetadata = (vrm, gltf) => {
    try {
      if (!vrm) return null;
      
      // Get model info
      const scene = vrm.scene;
      let triangleCount = 0;
      let materialCount = 0;
      const materials = new Set();
      
      // Count triangles and materials
      scene.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) {
            // Count triangles
            if (obj.geometry.index) {
              triangleCount += obj.geometry.index.count / 3;
            } else if (obj.geometry.attributes.position) {
              triangleCount += obj.geometry.attributes.position.count / 3;
            }
          }
          
          // Count unique materials
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
      
      // Extract VRM metadata
      const vrmMeta = vrm.meta || {};
      
      // Check if this is VRM 0.x by checking metaVersion
      const isVRM0 = vrmMeta.metaVersion === 0;
      
      // Detect license type based on different naming schemes
      let licenseType = vrmMeta.licenseType;
      let licenseName = vrmMeta.licenseName;
      
      // Map license name to type if needed
      if (!licenseType && licenseName) {
        const licenseMap = {
          'CC0': 1,
          'CC_BY': 2,
          'CC_BY_NC': 3,
          'CC_BY_SA': 4,
          'CC_BY_NC_SA': 5,
          'CC_BY_ND': 6,
          'CC_BY_NC_ND': 7,
          'Other': 8
        };
        licenseType = licenseMap[licenseName] || 8;
      }
      
      // Create metadata object with all possible fields
      const metadata = {
        triangleCount: Math.round(triangleCount),
        materialCount,
        format: 'VRM',
        vrmVersion: isVRM0 ? 0 : (vrm.meta?.version || 'Unknown'),
        title: vrmMeta.title || vrmMeta.name,
        version: vrmMeta.version,
        author: vrmMeta.author || vrmMeta.authors?.[0],
        contactInformation: vrmMeta.contactInformation,
        reference: vrmMeta.reference,
        license: vrmMeta.licenseUrl,
        licenseType: licenseName || getLicenseTypeName(licenseType),
        allowedUserName: vrmMeta.allowedUserName,
        violentUsageName: vrmMeta.violentUsageName || vrmMeta.violentUssageName,
        sexualUsageName: vrmMeta.sexualUsageName || vrmMeta.sexualUssageName,
        commercialUsageName: vrmMeta.commercialUsageName || vrmMeta.commercialUssageName,
        rawMetadata: JSON.parse(JSON.stringify(vrmMeta))
      };
      
      // Helper function to get license type name (for display purposes)
      function getLicenseTypeName(licenseType) {
        const licenseTypes = {
          0: 'Redistribution Prohibited',
          1: 'CC0',
          2: 'CC_BY',
          3: 'CC_BY_NC',
          4: 'CC_BY_SA',
          5: 'CC_BY_NC_SA',
          6: 'CC_BY_ND',
          7: 'CC_BY_NC_ND',
          8: 'Other'
        };
        return licenseTypes[licenseType] || undefined;
      }
      
      console.log('Extracted VRM metadata:', metadata);
      setMetadata(metadata);
      return metadata;
    } catch (err) {
      console.error('Error extracting VRM metadata:', err);
      return null;
    }
  };

  // Initialize scene and everything once
  useEffect(() => {
    if (!canvasRef.current) return;
  
    console.log('Initializing 3D scene');
    let isActive = true;
    const canvas = canvasRef.current;
  
    try {
      // Initialize renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
      const bgTexture = new THREE.CanvasTexture(createGradientBackground());
      scene.background = bgTexture;
      
      // Enhanced fog effect - adjusted for smoother grid fade-out
      const fogColor = new THREE.Color("#a6d8f7"); // Soft blue
      // Use standard fog instead of exponential fog for more control over the start/end distances
      scene.fog = new THREE.Fog(fogColor, 7, 18); // Near: 7, Far: 18 - creates gradual fade
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
      
      // Add floor with improved properties
      const floorGeometry = new THREE.PlaneGeometry(30, 30); // Larger floor (was 20x20)
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.05, // Slightly less metallic (was 0.1)
        roughness: 0.8, // More rough (was 0.7)
        transparent: true,
        opacity: 0.5 // More transparent (was 0.6)
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.receiveShadow = true;
      scene.add(floor);
      
      // Add improved grid with fade-out effect
      const gridSize = 30; // Larger grid (was 20)
      const divisions = 60; // More divisions for smoother grid (was 40)
      const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x888888, 0xaaaaaa);
      gridHelper.position.y = 0.01;
      
      // Apply vertex colors to create fade-out effect for grid
      const gridColors = gridHelper.geometry.attributes.color;
      const positionAttribute = gridHelper.geometry.attributes.position;
      const center = new THREE.Vector3(0, 0, 0);
      const maxDistance = gridSize / 2 * 0.8; // 80% of grid radius
      
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
      gridHelper.material.opacity = 0.7; // Overall grid opacity (was 1.0)
      
      scene.add(gridHelper);
      
      // Create loading indicator
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
      loadingSprite.position.set(0, 1.0, 0); // Lower position from 1.5 to 1.0
      scene.add(loadingSprite);
      loadingIndicatorRef.current = loadingSprite;
      
      // Setup controls - VERY IMPORTANT
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 1.8;
      controls.minPolarAngle = 0;
      controls.enableZoom = true;
      controls.minDistance = 1;
      controls.maxDistance = 5;
      controls.target.set(0, 1, 0);
      controls.update();
      controlsRef.current = controls;

      // Avatar direct rotation controls
      const handleMouseDown = (event) => {
        if (!vrmRef.current) return;
        
        // Get canvas-relative mouse coordinates
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        mouseRef.current.set(x, y);
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        
        // Check if we're clicking on the avatar
        const intersects = raycasterRef.current.intersectObject(vrmRef.current.scene, true);
        
        if (intersects.length > 0) {
          // We clicked on the avatar
          isDraggingAvatarRef.current = true;
          previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
          
          // Disable orbit controls while dragging the avatar
          controlsRef.current.enabled = false;
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
        if (!isActive) return;
        
        const delta = clockRef.current.getDelta();
        const time = clockRef.current.getElapsedTime();
        
        // Update controls even when model is not loaded
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        // Update VRM model if loaded
        if (mixerRef.current) {
          mixerRef.current.update(delta);
        }
        
        if (vrmRef.current) {
          vrmRef.current.update(delta);
          
          // Update bone visualizations if enabled
          if (skeletonMode) {
            updateBoneVisualizations();
          }
        }
        
        // Animate loading indicator
        if (loadingIndicatorRef.current && loadingIndicatorRef.current.visible) {
          // More pronounced bouncy animation with a catchier rhythm
          loadingIndicatorRef.current.position.y = 1.0 + Math.sin(time * 4) * 0.2;
          // More pronounced rotation
          loadingIndicatorRef.current.rotation.z = Math.sin(time * 3) * 0.4;
          // Add a slight side-to-side movement for more playfulness
          loadingIndicatorRef.current.position.x = Math.sin(time * 5) * 0.1;
        }
        
        renderer.render(scene, camera);
        frameIdRef.current = requestAnimationFrame(animate);
      };
      
      animate();
      
      return () => {
        isActive = false;
        resizeObserver.disconnect();
        
        // Remove event listeners
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        if (frameIdRef.current) {
          cancelAnimationFrame(frameIdRef.current);
        }
        
        if (controlsRef.current) {
          controlsRef.current.dispose();
        }
        
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        
        // Clean up materials and geometries
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(m => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      };
    } catch (err) {
      console.error('Scene initialization error:', err);
      setError(err.message);
    }
  }, []);

  // Create skeleton visualization with thick tubes
  const createSkeletonVisualization = (vrm) => {
    // Clean up existing visualizations
    if (skeletonHelperRef.current && sceneRef.current) {
      sceneRef.current.remove(skeletonHelperRef.current);
      skeletonHelperRef.current = null;
    }
    
    if (boneConnectionsRef.current.length > 0) {
      boneConnectionsRef.current.forEach(obj => {
        if (obj.parent) obj.parent.remove(obj);
      });
      boneConnectionsRef.current = [];
    }
    
    if (boneMarkersRef.current.length > 0) {
      boneMarkersRef.current.forEach(obj => {
        if (obj.parent) obj.parent.remove(obj);
      });
      boneMarkersRef.current = [];
    }
    
    if (!vrm || !sceneRef.current) return;
    
    console.log('Creating skeleton visualization with blue lines');
    
    // Use the built-in SkeletonHelper - enhanced for better visibility
    try {
      // Find the root object that contains bones
      let skeletonRoot = vrm.scene;
      
      // Primary skeleton - thinner cyan lines
      const helper = new THREE.SkeletonHelper(skeletonRoot);
      helper.material.linewidth = 3; // Note: linewidth may not work in all browsers/GPUs
      helper.visible = skeletonMode;
      helper.material.color = new THREE.Color(0x00ffff); // Bright cyan
      sceneRef.current.add(helper);
      skeletonHelperRef.current = helper;
      
      // Secondary skeleton - thicker blue lines with slight offset for better visibility
      const helperOutline = new THREE.SkeletonHelper(skeletonRoot);
      helperOutline.material.linewidth = 5;
      helperOutline.visible = skeletonMode;
      helperOutline.material.color = new THREE.Color(0x0000ff); // Blue
      
      // Add slight offset to create a thicker appearance
      helperOutline.position.z += 0.001;
      
      sceneRef.current.add(helperOutline);
      boneConnectionsRef.current.push(helperOutline); // Store in connections array for cleanup
      
      console.log('Added enhanced skeleton helper');
    } catch (err) {
      console.error('Error creating skeleton helper:', err);
    }
  };

  // Update the bone visualizations in the animation loop
  const updateBoneVisualizations = () => {
    // Nothing to update for SkeletonHelper as it updates automatically
    return;
  };

  // Toggle skeleton view mode
  const toggleSkeletonMode = () => {
    console.log('Toggle skeleton called, current mode:', skeletonMode);
    const newSkeletonMode = !skeletonMode;
    setSkeletonMode(newSkeletonMode);
    console.log('New skeleton mode:', newSkeletonMode);
    
    // Update skeleton helper visibility
    if (skeletonHelperRef.current) {
      skeletonHelperRef.current.visible = newSkeletonMode;
    }
    
    // Update bone connections visibility
    boneConnectionsRef.current.forEach(connection => {
      connection.visible = newSkeletonMode;
    });
    
    // Create visualizations if they don't exist and we're turning on the mode
    if (newSkeletonMode && vrmRef.current && !skeletonHelperRef.current) {
      createSkeletonVisualization(vrmRef.current);
    }
  };

  // Load or update VRM model when the URL changes
  useEffect(() => {
    // Don't try to load if we don't have a URL or scene isn't ready
    if (!processedUrl || !sceneRef.current) {
      console.log('Cannot load model: missing URL or scene not initialized');
      return;
    }
    
    setIsLoading(true);
    if (loadingIndicatorRef.current) {
      loadingIndicatorRef.current.visible = true;
    }
    
    console.log('Loading VRM from URL:', processedUrl);
    let isActive = true;
    
    // Cleanup previous model
    if (vrmRef.current && sceneRef.current) {
      console.log('Removing previous VRM model');
      sceneRef.current.remove(vrmRef.current.scene);
      vrmRef.current = null;
    }
    
    if (mixerRef.current) {
      mixerRef.current = null;
    }
    
    // Load new model
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

    try {
        loader.load(
          processedUrl,
          async (gltf) => {
            if (!isActive) return;

          console.log('GLTF loaded, checking for VRM data');
            const vrm = gltf.userData.vrm;
          
            if (!vrm) {
              console.error('No VRM data in loaded model');
            setError('Invalid VRM model - No VRM data found');
            setIsLoading(false);
              return;
            }

          console.log('VRM model loaded successfully');
          
          // Store reference and add to scene
            vrmRef.current = vrm;
            vrm.scene.traverse((obj) => {
              if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
              
              // Apply wireframe mode if it's currently enabled
              if (wireframeMode) {
                if (Array.isArray(obj.material)) {
                  obj.material.forEach(mat => {
                    mat.wireframe = true;
                  });
                } else {
                  obj.material.wireframe = true;
                }
              }
            }
          });
          
          if (sceneRef.current) {
            sceneRef.current.add(vrm.scene);
          } else {
            console.error("Scene reference lost, can't add model");
            setError("Scene reference lost, can't add model");
            setIsLoading(false);
            return;
          }
          
          // Position model
            vrm.humanoid.resetNormalizedPose();
            VRMUtils.rotateVRM0(vrm);

            const box = new THREE.Box3().setFromObject(vrm.scene);
            const center = box.getCenter(new THREE.Vector3());
            vrm.scene.position.sub(center);
            vrm.scene.position.y = 0;
            
          // Create skeleton visualization if skeleton mode is on
          if (skeletonMode) {
            createSkeletonVisualization(vrm);
          }
          
          // Extract and share metadata
            const metadata = extractVRMMetadata(vrm, gltf);
            if (metadata && typeof onMetadataLoad === 'function') {
              onMetadataLoad(metadata);
            }

            // Load animation if provided
            if (animationUrl) {
              try {
                const clip = await loadMixamoAnimation(animationUrl, vrm);
                mixerRef.current = new THREE.AnimationMixer(vrm.scene);
                const action = mixerRef.current.clipAction(clip);
                action.play();
              } catch (error) {
                console.error('Animation load error:', error);
              }
            }

            setIsLoading(false);
          },
          (progress) => {
          const percentage = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;
          console.log(`Loading progress: ${percentage}%`);
          },
          (error) => {
          console.error('Error loading VRM model:', error);
          setError(`Failed to load 3D model: ${error.message}`);
            setIsLoading(false);
          }
        );
    } catch (err) {
      console.error('Exception during model loading setup:', err);
      setError(`Exception loading model: ${err.message}`);
      setIsLoading(false);
    }
    
    return () => {
      isActive = false;
    };
  }, [processedUrl, animationUrl, onMetadataLoad, skeletonMode, wireframeMode]);

  // Update loading indicator visibility
  useEffect(() => {
    if (loadingIndicatorRef.current) {
      loadingIndicatorRef.current.visible = isLoading;
      console.log('Loading state changed:', isLoading);
    }
  }, [isLoading]);

  // Toggle wireframe mode function
  const toggleWireframeMode = () => {
    console.log('Toggle wireframe called, current mode:', wireframeMode);
    const newWireframeMode = !wireframeMode;
    setWireframeMode(newWireframeMode);
    console.log('New wireframe mode:', newWireframeMode);
    
    if (!vrmRef.current) return;
    
    // Apply wireframe mode to all meshes in the model
    vrmRef.current.scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          // Handle multi-material objects
          obj.material.forEach(mat => {
            mat.wireframe = newWireframeMode;
          });
        } else {
          // Handle single material objects
          obj.material.wireframe = newWireframeMode;
        }
      }
    });
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{
            display: 'block',
            touchAction: 'none',
          }}
        />
      </div>
      
      {/* Control buttons group - hide on mobile */}
      {window.innerWidth >= 768 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-4">
          {/* Wireframe toggle button */}
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
            {wireframeMode ? t('avatar.controls.wireframe') : t('avatar.controls.wireframe')}
          </button>
          
          {/* Skeleton toggle button */}
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
            {skeletonMode ? t('avatar.controls.showBones') : t('avatar.controls.showBones')}
          </button>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="bg-red-900/50 p-4 rounded-lg text-white max-w-md">
            <p className="font-bold mb-2">Error loading model</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to create a dreamy gradient background canvas
function createGradientBackground() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Radial gradient matching the highlighted area in the reference image
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width
  );

  // Color stops based on the highlighted blue area in the image
  gradient.addColorStop(0, '#ffffff');      // Center white
  gradient.addColorStop(0.3, '#e0f2ff');    // Very light blue
  gradient.addColorStop(0.5, '#a6d8f7');    // Medium light blue
  gradient.addColorStop(0.65, '#5d9ad5');   // Medium blue
  gradient.addColorStop(0.75, '#3373b8');   // Medium-deep blue
  gradient.addColorStop(0.85, '#1a4d99');   // Deep royal blue
  gradient.addColorStop(0.95, '#183a80');   // Deep blue
  gradient.addColorStop(1, '#0a2966');      // Navy blue edge

  // Fill the canvas with the simple gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add a few subtle star-like sparkles as seen in the highlighted area
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 1.5 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

export default VRMViewer;