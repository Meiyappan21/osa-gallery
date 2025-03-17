'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// Enhanced component to render Three.js textures to a canvas with additional information
const TextureRenderer = ({ texture, width = 200, height = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!texture || !canvasRef.current) return;

    // Create a temporary scene to render the texture
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Create a simple renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    
    // Create a plane geometry with the texture
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const plane = new THREE.Mesh(geometry, material);
    
    scene.add(plane);
    
    // Render the scene once
    renderer.render(scene, camera);
    
    // Clean up
    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [texture, width, height]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full object-contain"
    />
  );
};

export default TextureRenderer; 