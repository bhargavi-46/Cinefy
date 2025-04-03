"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Navbar from "../components/navbar";
import { redirect, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Footer from "../components/footer";
import "./home.css";
import Call from "../components/Call";

export default function Home() {
  const nextBtnRef = useRef(null);
  const prevBtnRef = useRef(null);
  const sliderRef = useRef(null);
  const sliderListRef = useRef(null);
  const thumbnailRef = useRef(null);
  const [sliderData, setVideos] = useState([]);
  const [play, setplay] = useState(null);
  const [stream, setStream] = useState(null);
  const [user, setUser] = useState();

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(
          `http://localhost:3000/api/login?email=${session.user.email}`,
          {
            method: "GET",
          }
        );

        if (!res.ok) {
          throw new Error("Something went wrong");
        }

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user details:", error.message);
      }
    };

    if (session) fetchUserDetails();
  }, [session?.user?.email, session]);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch("http://localhost:3000/api/video");
        const data = await res.json();

        if (data.success) {
          if (user?.premium) {
            setVideos(data.videos);
          } else {
            setVideos(data.videos.filter((e) => e.premium === false));
          }
        } else {
          console.error("Error fetching videos:", data.message);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }

    if (user !== undefined) {
      fetchVideos();
    }
  }, [user]);

  const moveSlider = (direction) => {
    let sliderItems = sliderListRef.current.querySelectorAll(".item");
    let thumbnailItems = thumbnailRef.current.querySelectorAll(".item");

    if (direction === "next") {
      sliderListRef.current.appendChild(sliderItems[0]);
      thumbnailRef.current.appendChild(thumbnailItems[0]);
      sliderRef.current.classList.add("next");
    } else {
      sliderListRef.current.prepend(sliderItems[sliderItems.length - 1]);
      thumbnailRef.current.prepend(thumbnailItems[thumbnailItems.length - 1]);
      sliderRef.current.classList.add("prev");
    }

    sliderRef.current.addEventListener(
      "animationend",
      function () {
        if (direction === "next") {
          sliderRef.current.classList.remove("next");
        } else {
          sliderRef.current.classList.remove("prev");
        }
      },
      { once: true }
    );
  };

  useEffect(() => {
    if (session) {
      let thumbnailItems = thumbnailRef.current?.querySelectorAll(".item");
      if (thumbnailItems && thumbnailItems.length > 0) {
        thumbnailRef.current.appendChild(thumbnailItems[0]);
      }
    }
  }, [session]);

  const playVideo = (item) => {
    setplay(item);
    sessionStorage.setItem("selectedContent", JSON.stringify(item));
    router.push("/watch");
  };

  const streamVideo = (item) => {
    setStream(item);
    sessionStorage.setItem("selectedContent", JSON.stringify(item));
    router.push("/stream");
  };

  const toggleLike = async (id) => {
    if (!user) return;

    const isLiked = user.fav.some((fav) => fav.Content_id === id);

    try {
      const response = await fetch(`http://localhost:3000/api/favourite`, {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email, id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update favorites");
      }

      const updatedUser = await response.json();
      setUser(updatedUser.user);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  return (
    <>
      {session ? (
        <div className="min-h-screen bg-black text-gray-100">
          <Navbar />

          <div className="container mx-auto px-4 py-8">
            {/* Featured Content Slider */}
            <div className="relative mb-16">
              <div
                className="slider rounded-xl overflow-hidden shadow-2xl"
                ref={sliderRef}
              >
                <div className="list" ref={sliderListRef}>
                  {sliderData.map((item) => (
                    <div className="item relative group" key={item._id}>
                      {/* Increased image size */}
                      <div className="w-full h-[80vh] relative">
                        <Image
                          src={item.thumbnail}
                          alt={`${item.name}`}
                          fill
                          className="object-cover"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-90" />
                      </div>

                      {/* Content container */}
                      <div className="absolute bottom-0 left-0 w-full">
                        <div className="p-8">
                          <h3 className="text-3xl font-bold mb-2 text-white">
                            {item.name}
                          </h3>
                          <p className="text-gray-300 mb-6 line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* Navigation buttons positioned above stream buttons */}
                        <div className="flex justify-between w-full px-8">
                          <div className="flex space-x-4">
                            {/* Play button with hover info */}
                            <div className="relative group/play">
                              <button
                                onClick={() => playVideo(item)}
                                className="relative px-8 py-3 bg-black border-2 border-white text-white font-medium rounded-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-white/20"
                              >
                                <span className="relative z-10 flex items-center">
                                  <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span>Play Now</span>
                                </span>
                                {/* Background hover effect */}
                                <span className="absolute inset-0 bg-white/10 transform origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover/play:scale-x-100"></span>
                              </button>

                              {/* Glassmorphism info popup */}
                              <div className="absolute bottom-full -right-[11vw] mb-2 w-80 bg-black/40 backdrop-blur-lg border border-blue-400/20 rounded-md p-4 opacity-0 group-hover/play:opacity-100 transition-opacity duration-300 pointer-events-none z-20 text-left shadow-lg shadow-black/50">
                                <div className="flex items-start">
                                  <div className="w-full">
                                    <h4 className="text-white font-semibold text-lg mb-2">
                                      {item.name}
                                    </h4>
                                    <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                                      {item.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <span className="text-blue-300 text-sm">
                                        {item.genre || "Drama"}
                                      </span>
                                      {item.premium && (
                                        <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold px-2 py-0.5 rounded text-xs">
                                          PREMIUM
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Stream button with hover info */}
                            <div className="relative group/stream">
                              <button
                                onClick={() => streamVideo(item)}
                                className="relative px-8 py-3 bg-black border-2 border-blue-400 text-blue-400 font-medium rounded-md overflow-hidden transition-all duration-300"
                                onMouseEnter={(e) =>
                                  e.currentTarget.classList.add(
                                    "hover:shadow-lg",
                                    "hover:shadow-blue-400/20"
                                  )
                                }
                                onMouseLeave={(e) =>
                                  e.currentTarget.classList.remove(
                                    "hover:shadow-lg",
                                    "hover:shadow-blue-400/20"
                                  )
                                }
                              >
                                <span className="relative z-10 flex items-center">
                                  <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span>Stream Live</span>
                                </span>
                                <span
                                  className="absolute inset-0 bg-blue-400/10 transform origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]"
                                  onMouseEnter={(e) =>
                                    e.currentTarget.parentElement.classList.add(
                                      "scale-x-100"
                                    )
                                  }
                                  onMouseLeave={(e) =>
                                    e.currentTarget.parentElement.classList.remove(
                                      "scale-x-100"
                                    )
                                  }
                                ></span>
                              </button>

                              {/* Glassmorphism info popup */}
                              <div className="absolute bottom-full right-0 mb-2 w-80 bg-black/40 backdrop-blur-lg border border-blue-400/20 rounded-md p-4 opacity-0 group-hover/stream:opacity-100 transition-opacity duration-300 pointer-events-none z-20 text-left shadow-lg shadow-black/50">
                                <div className="flex items-start">
                                  <div className="w-full">
                                    <h4 className="text-white font-semibold text-lg mb-2">
                                      {item.name}
                                    </h4>
                                    <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                                      {item.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <span className="text-blue-300 text-sm">
                                        {item.genre || "Drama"}
                                      </span>
                                      {item.premium && (
                                        <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold px-2 py-0.5 rounded text-xs">
                                          PREMIUM
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Left/Right navigation buttons */}
                          <div className="flex space-x-2">
                            <button
                              ref={prevBtnRef}
                              className="bg-black bg-opacity-60 hover:bg-opacity-90 p-3 rounded-full border border-gray-600"
                              onClick={() => moveSlider("prev")}
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>
                            <button
                              ref={nextBtnRef}
                              className="bg-black bg-opacity-60 hover:bg-opacity-90 p-3 rounded-full border border-gray-600"
                              onClick={() => moveSlider("next")}
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Thumbnail section */}
                <div className="thumbnail-container">
                  <div className="thumbnail" ref={thumbnailRef}>
                    {sliderData.map((item) => (
                      <div
                        className="item relative cursor-pointer hover:opacity-100 opacity-70 transition-opacity"
                        key={item._id}
                      >
                        <Image
                          src={item.thumbnail}
                          alt={`Thumbnail ${item._id}`}
                          width={160}
                          height={90}
                          className="rounded-md"
                        />
                        <div className="absolute inset-0 bg-blue-900 opacity-0 hover:opacity-20 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Categories */}
            <div className="mb-16">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                Recommended For You
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sliderData.slice(0, 8).map((item) => (
                  <div
                    key={item._id}
                    className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow group border border-gray-800 hover:border-blue-500 relative"
                  >
                    <div className="relative h-48">
                      <Image
                        src={item.thumbnail}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:opacity-80 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />
                      <button
                        onClick={() => toggleLike(item._id)}
                        className="absolute top-2 right-2 z-10 p-2 bg-gray-900 bg-opacity-60 rounded-full hover:bg-opacity-80 transition-all"
                      >
                        {user?.fav.some(
                          (fav) => fav.Content_id === item._id
                        ) ? (
                          <span className="text-red-500">❤</span>
                        ) : (
                          <span>🤍</span>
                        )}
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 text-white">
                        {item.name}
                      </h3>
                      <div className="flex justify-between items-center mt-4 relative">
                        {/* Play button with hover info */}
                        <div className="relative group/play">
                          <button
                            onClick={() => playVideo(item)}
                            className="relative px-3 py-1.5 bg-black border border-white text-white text-sm rounded-none overflow-hidden transition-all duration-300"
                            onMouseEnter={(e) => {
                              e.currentTarget.classList.add(
                                "hover:shadow-white/20"
                              );
                              e.currentTarget
                                .querySelector(".play-hover")
                                .classList.add("scale-x-100");
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.classList.remove(
                                "hover:shadow-white/20"
                              );
                              e.currentTarget
                                .querySelector(".play-hover")
                                .classList.remove("scale-x-100");
                            }}
                          >
                            <span className="relative z-10 flex items-center">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Play
                            </span>
                            <span className="play-hover absolute inset-0 bg-white/10 transform origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]"></span>
                          </button>

                          {/* Glassmorphism info popup */}
                          <div className="absolute bottom-full left-0 mb-2 w-64 bg-black/40 backdrop-blur-md border border-white/20 rounded p-3 opacity-0 group-hover/play:opacity-100 transition-opacity duration-300 pointer-events-none z-20 text-left">
                            <h4 className="text-white font-medium text-sm mb-1">
                              {item.name}
                            </h4>
                            <p className="text-gray-300 text-xs mb-2 line-clamp-3">
                              {item.description}
                            </p>
                            <div className="flex text-xs text-blue-300">
                              <span className="mr-2">
                                {item.genre || "Drama"}
                              </span>
                              {item.premium && (
                                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold px-2 rounded-sm">
                                  PREMIUM
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stream button with hover info */}
                        <div className="relative group/stream">
                          <button
                            onClick={() => streamVideo(item)}
                            className="relative px-3 py-1.5 bg-black border border-blue-400 text-blue-400 text-sm rounded-none overflow-hidden transition-all duration-300"
                            onMouseEnter={(e) => {
                              e.currentTarget.classList.add(
                                "hover:shadow-blue-400/20"
                              );
                              e.currentTarget
                                .querySelector(".stream-hover")
                                .classList.add("scale-x-100");
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.classList.remove(
                                "hover:shadow-blue-400/20"
                              );
                              e.currentTarget
                                .querySelector(".stream-hover")
                                .classList.remove("scale-x-100");
                            }}
                          >
                            <span className="relative z-10 flex items-center">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Stream
                            </span>
                            <span className="stream-hover absolute inset-0 bg-blue-400/10 transform origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]"></span>
                          </button>

                          {/* Glassmorphism info popup */}
                          <div className="absolute bottom-full right-0 mb-2 w-64 bg-black/40 backdrop-blur-md border border-blue-400/20 rounded p-3 opacity-0 group-hover/stream:opacity-100 transition-opacity duration-300 pointer-events-none z-20 text-left">
                            <h4 className="text-white font-medium text-sm mb-1">
                              {item.name}
                            </h4>
                            <p className="text-gray-300 text-xs mb-2 line-clamp-3">
                              {item.description}
                            </p>
                            <div className="flex text-xs text-blue-300">
                              <span className="mr-2">
                                {item.genre || "Drama"}
                              </span>
                              {item.premium && (
                                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold px-2 rounded-sm">
                                  PREMIUM
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Footer />
        </div>
      ) : (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
      )}
    </>
  );
}
