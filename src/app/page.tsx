// src/app/page.tsx
import React from "react";
import AvatarGallery from "@/components/avatar/AvatarGallery";

const Home = () => {
  return (
    <main className="min-h-screen bg-white">
      <AvatarGallery />
    </main>
  );
};

export default Home;