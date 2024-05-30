// Viewer360.js
import "@/styles/viewer.scss";
import { Viewer } from "@photo-sphere-viewer/core";
import { useEffect, useRef } from "react";

const Viewer360 = ({ imageUrl }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !imageUrl) return;

    console.log("Initializing viewer with image URL:", imageUrl);

    const options = {
      container: containerRef.current,
      panorama: imageUrl,
      navbar: false,
    };

    try {
      if (!viewerRef.current) {
        viewerRef.current = new Viewer(options);
        console.log("Viewer initialized successfully");
      } else {
        console.log("Updating panorama to:", imageUrl);
        viewerRef.current.setPanorama(imageUrl);
      }
    } catch (error) {
      console.error("Error initializing viewer:", error);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        console.log("Viewer destroyed");
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    console.log("Viewer imageUrl prop changed to:", imageUrl);
  }, [imageUrl]);

  return (
    <div ref={containerRef} style={{ width: "1080px", height: "1080px" }} />
  );
};

export default Viewer360;
