"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Import useRouter

const Favourites = () => {
  const [favorites, setFavorites] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const { data: session } = useSession();
  const router = useRouter(); // Initialize useRouter

  // Fetch user's favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(
          `http://localhost:3000/api/favourite?email=${session.user.email}`,
          {
            method: "GET",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch favorites");
        }

        const data = await res.json();
        setFavorites(data.favorites);
      } catch (error) {
        console.error("Error fetching favorites:", error.message);
      }
    };

    fetchFavorites();
  }, [session?.user?.email]);

  // Fetch all content
  useEffect(() => {
    const fetchAllContent = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/video");
        const data = await res.json();

        if (data.success) {
          setAllContent(data.videos);
        } else {
          console.error("Error fetching videos:", data.message);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchAllContent();
  }, []);

  // Function to handle playing a video
  const playVideo = (item) => {
    console.log("Item received in playVideo:", item);
    sessionStorage.setItem("selectedContent", JSON.stringify(item)); // Save selected content to sessionStorage
    router.push("/watch"); // Navigate to the watch page
  };

  // Filter content to only include items in favorites
  const filteredContent = allContent.filter((content) =>
    favorites.some((fav) => fav.Content_id === content._id)
  );

  return (
    <div>
      <Navbar />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Favourites</h1>
        {filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredContent.map((content) => (
              <div key={content._id} className="border rounded-lg overflow-hidden shadow-lg">
                <div className="relative h-48">
                  <Image
                    src={content.thumbnail}
                    alt={content.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold">{content.name}</h2>
                  <p className="text-gray-600">{content.desc}</p>
                  <button
                    onClick={() => playVideo(content)} // Add play button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Play
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No favorites added yet.</p>
        )}
      </div>
    </div>
  );
};

export default Favourites;