"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/navbar";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Expand,
  Bookmark,
  ChevronDown,
  Info,
  Clock,
  List,
} from "lucide-react";
import SendBirdCall from "sendbird-calls";
import {
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
} from "react-icons/fa";

import { signOut, useSession } from "next-auth/react";

import { socket } from "@/app/socket";
import { Typewriter } from "react-simple-typewriter";

const Stream = () => {
  // Video Player State
  const [videoData, setVideoData] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [bookmarkedEpisodes, setBookmarkedEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const videoRef = useRef(null);

  // Call State
  const [user, setUser] = useState();
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState("");
  const [room, setRoom] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(false);

  // Check if content is a movie (1 season with 1 episode)
  const isMovie = seasons.length === 1 && seasons[0].episodes.length === 1;

  useEffect(() => {
    const APP_ID = process.env.NEXT_PUBLIC_APP_ID;
    if (APP_ID) {
      SendBirdCall.init(APP_ID);
    } else {
      console.error("SendBird APP_ID is missing");
    }
  }, []);

  // Fetch User Details
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(
          `http://localhost:3000/api/login?email=${session.user.email}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
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

  // Call Functionality
  const authenticate = async (userId) => {
    if (!userId) {
      console.error("UserId is required for authentication");
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        SendBirdCall.authenticate({ userId }, (res, error) => {
          if (error) reject(error);
          else resolve(res);
          setUserId(user.name);
        });
      });
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  // Authenticate when user data is set
  useEffect(() => {
    if (user?.name) {
      authenticate(user.name);
    }
  }, [user?.name]);

  // Fetch Video Data
  useEffect(() => {
    const fetchVideoData = async () => {
      const storedData = sessionStorage.getItem("selectedContent");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setVideoData(parsedData);
        setSeasons(parsedData.seasons || []);
        socket.emit("VideoData : ", videoData);
        createRoom();
      } else {
        console.log("No video data found in sessionStorage");
      }
    };
    fetchVideoData();
  }, []);

  useEffect(() => {
    if (videoData) {
      socket.emit("videoData", videoData);
      console.log("Sent videoData to server:", videoData);
    }
  }, [videoData]);

  useEffect(() => {
    function onConnect() {
      console.log("Connected through socket");
      socket.emit("videoData from client");
    }

    function onDisconnect() {
      console.log("Disconnected from server");
    }

    function onServerMessage(data) {
      console.log("videoData from server:", data);
      setMessage(data);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("server-message", onServerMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("server-message", onServerMessage);
    };
  }, []);

  const initiateSendbirdCalls = async () => {
    try {
      setLoading(true);
      if (!user?.name) {
        console.error("User not available for authentication");
        setLoading(false);
        return;
      }

      await authenticate(user.name);
      await SendBirdCall.connectWebSocket();
      setAuthenticated(true);
    } catch (error) {
      console.error("Error initializing SendBird calls:", error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!authenticated) {
      return new Error("No user Found");
    }
    try {
      const createdRoom = await SendBirdCall.createRoom({
        roomType: "small_room_for_video",
      });
      setRoom(createdRoom);

      // Create a socket room and emit videoData
      socket.emit("createRoom", { roomId: createdRoom.roomId, videoData });

      await createdRoom.enter({
        audioEnabled: false,
        videoEnabled: false,
        localMediaView: document.getElementById("local_video_element_id"),
      });

      // Handle existing participants
      createdRoom.participants.forEach((participant) => {
        if (participant.user.userId == userId) {
          addRemoteVideo(participant);
        }
      });

      // Handle new participants
      createdRoom.on("remoteParticipantEntered", (participant) => {
        addRemoteVideo(participant);
      });

      // Handle participants leaving
      createdRoom.on("remoteParticipantExited", (participant) => {
        removeRemoteVideo(participant);
      });

      // Handle local participant exiting
      createdRoom.on("localParticipantExited", () => {
        setRoom(null); // Reset room state
      });
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const joinRoom = async (roomId) => {
    try {
      const existingRoom = await SendBirdCall.fetchRoomById(roomId);
      await existingRoom.enter({
        audioEnabled: false,
        videoEnabled: true,
        localMediaView: document.getElementById("local_video_element_id"),
      });
      setRoom(existingRoom);

      // Join the socket room and request videoData
      socket.emit("joinRoom", { roomId });

      // Handle existing participants
      existingRoom.participants.forEach((participant) => {
        if (participant.userId !== userId) {
          addRemoteVideo(participant);
        }
      });

      // Handle new participants
      existingRoom.on("remoteParticipantEntered", (participant) => {
        addRemoteVideo(participant);
      });

      existingRoom.on("remoteParticipantExited", (participant) => {
        removeRemoteVideo(participant);
      });

      existingRoom.on("localParticipantExited", () => {
        setRoom(null); // Reset room state
      });
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  useEffect(() => {
    socket.on("requestVideoData", (callback) => {
      callback(videoData);
    });

    return () => {
      socket.off("requestVideoData");
    };
  }, [videoData]);

  useEffect(() => {
    socket.on("videoData", (data) => {
      setVideoData(data);
      setSeasons(data.seasons || []);
    });

    return () => {
      socket.off("videoData");
    };
  }, []);

  const removeRemoteVideo = (participant) => {
    const containerId = `remote_video_${participant.participantId}`;
    const videoContainer = document.getElementById(containerId);
    if (videoContainer) {
      videoContainer.remove();
    }
  };

  const addRemoteVideo = (participant) => {
    const videoContainer = document.createElement("div");
    videoContainer.className =
      "relative w-full h-[150px] rounded-md overflow-hidden mb-2";
    videoContainer.id = `remote_video_${participant.participantId}`;

    const videoElement = document.createElement("video");
    videoElement.autoplay = true;
    videoElement.className = "w-full h-full object-cover rounded-md";

    // Add participant name label
    const userNameLabel = document.createElement("div");
    userNameLabel.className =
      "absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded";
    userNameLabel.innerText =
      participant.user.userId === userId
        ? `${participant.user.userId} (You)`
        : participant.user.userId || "Unknown User";

    videoContainer.appendChild(videoElement);
    videoContainer.appendChild(userNameLabel);
    document
      .getElementById("remote_video_container")
      .appendChild(videoContainer);

    participant.setMediaView(videoElement);
  };

  const toggleVideo = () => {
    try {
      if (room && room.localParticipant) {
        if (isVideoOn) {
          room.localParticipant.stopVideo();
        } else {
          room.localParticipant.startVideo();
        }
        setIsVideoOn(!isVideoOn);
        refreshLocalVideoContainer();
      }
    } catch (error) {
      console.error("Error toggling video:", error);
    }
  };

  const toggleAudio = () => {
    try {
      if (room && room.localParticipant) {
        if (isAudioOn) {
          room.localParticipant.muteMicrophone();
        } else {
          room.localParticipant.unmuteMicrophone();
        }
        setIsAudioOn(!isAudioOn);
        refreshLocalVideoContainer();
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  };

  const leaveRoom = async () => {
    if (room) {
      await room.exit();
      setRoom(null);
      const remoteVideoContainer = document.getElementById(
        "remote_video_container"
      );
      if (remoteVideoContainer) {
        remoteVideoContainer.innerHTML = "";
      }
    }
  };

  useEffect(() => {
    if (userId) initiateSendbirdCalls();
  }, [userId]);

  const selectedSeasonData = seasons.find(
    (season) => season.seasonNumber === selectedSeason
  );
  const selectedEpisodeData = selectedSeasonData?.episodes[selectedEpisode - 1];

  // Socket event listeners for synchronized controls
  useEffect(() => {
    // Play event
    socket.on("play", () => {
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    });

    // Pause event
    socket.on("pause", () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    });

    // Seek event
    socket.on("seek", ({ currentTime }) => {
      if (
        typeof currentTime !== "number" ||
        isNaN(currentTime) ||
        !isFinite(currentTime)
      ) {
        console.error("Invalid currentTime received from server:", currentTime);
        return;
      }

      if (videoRef.current && !isSeeking) {
        videoRef.current.currentTime = currentTime;
        setCurrentTime(currentTime);
      }
    });

    // Change episode event
    socket.on("changeEpisode", ({ season, episode }) => {
      setSelectedSeason(season);
      setSelectedEpisode(episode);
    });

    // Cleanup
    return () => {
      socket.off("play");
      socket.off("pause");
      socket.off("seek");
      socket.off("changeEpisode");
    };
  }, [isSeeking]);

  const handlePlayPause = () => {
    if (!room?.roomId) {
      console.error("Room ID is missing");
      return;
    }

    if (isPlaying) {
      socket.emit("pause", {
        roomId: room.roomId,
        currentTime: videoRef.current?.currentTime || 0,
      });
    } else {
      socket.emit("play", {
        roomId: room.roomId,
        currentTime: videoRef.current?.currentTime || 0,
      });
    }

    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time) => {
    if (!room?.roomId) {
      console.error("Room ID is missing");
      return;
    }

    if (typeof time !== "number" || isNaN(time) || !isFinite(time)) {
      console.error("Invalid currentTime:", time);
      return;
    }

    socket.emit("seek", {
      roomId: room.roomId,
      currentTime: time,
    });

    setCurrentTime(time);
  };

  const handleEpisodeChange = (episode, season = selectedSeason) => {
    if (!room?.roomId) {
      console.error("Room ID is missing");
      return;
    }

    socket.emit("changeEpisode", {
      roomId: room.roomId,
      season,
      episode,
    });

    setSelectedSeason(season);
    setSelectedEpisode(episode);
  };

  const handleSeasonChange = (season) => {
    socket.emit("changeSeason", season);
  };

  if (!authenticated) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="flex flex-col">
        {/* Main Content Area */}
        <div className="flex overflow-hidden">
          {/* Left Side (75% width) - Video Player and Controls */}
          <div className="w-3/4 pr-6 overflow-y-auto">
            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full h-[600px] lg:h-[725px] bg-black rounded-xl shadow-2xl border-2 border-cyan-500 overflow-hidden relative"
            >
              {selectedEpisodeData?.link ? (
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  src={selectedEpisodeData?.link || ""}
                  controls
                  onPlay={() => {
                    setIsPlaying(true);
                    handlePlayPause();
                  }}
                  onPause={() => {
                    setIsPlaying(false);
                    handlePlayPause();
                  }}
                  onSeeking={() => setIsSeeking(true)}
                  onSeeked={() => {
                    setIsSeeking(false);
                    handleSeek(videoRef.current?.currentTime || 0);
                  }}
                  onTimeUpdate={(e) => {
                    if (!isSeeking) {
                      setCurrentTime(e.target.currentTime);
                    }
                  }}
                ></video>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <p className="text-gray-400">No video URL provided.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Side (25% width) - Call Feature */}
          <div className="rounded-lg w-1/4 bg-gradient-to-b from-gray-800 to-gray-900 p-6 border-2 border-cyan-500 overflow-y-auto h-[725px]">
            {userId ? (
              <div className="flex flex-col space-y-4">
                {authenticated && !room && (
                  <div className="flex flex-col space-y-2">
                    {videoData ? (
                      <button
                        onClick={createRoom}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-transform hover:scale-105"
                      >
                        <FaVideo className="mr-2" /> Create Room
                      </button>
                    ) : (
                      <button
                        onClick={() => joinRoom(prompt("Enter Room ID"))}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-transform hover:scale-105"
                      >
                        <FaVideo className="mr-2" /> Join Room
                      </button>
                    )}
                  </div>
                )}

                {room && (
                  <div className="flex flex-col space-y-3">
                    <h2 className="text-xs text-gray-400">
                      Room ID: {room.roomId}
                    </h2>
                    <div className="flex space-x-4">
                      <button
                        onClick={toggleVideo}
                        className={`${
                          isVideoOn
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-gray-600 hover:bg-gray-700"
                        } text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-transform hover:scale-105`}
                      >
                        {isVideoOn ? (
                          <FaVideo className="mr-2" />
                        ) : (
                          <FaVideoSlash className="mr-2" />
                        )}
                      </button>
                      <button
                        onClick={toggleAudio}
                        className={`${
                          isAudioOn
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-gray-600 hover:bg-gray-700"
                        } text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-transform hover:scale-105`}
                      >
                        {isAudioOn ? (
                          <FaMicrophone className="mr-2" />
                        ) : (
                          <FaMicrophoneSlash className="mr-2" />
                        )}
                      </button>
                      <button
                        onClick={leaveRoom}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-transform hover:scale-105"
                      >
                        <FaPhoneSlash className="mr-2" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-2">
                  <div
                    id="remote_video_container"
                    className="flex flex-col space-y-2"
                  ></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">loading</div>
            )}
          </div>
        </div>

        {/* Season & Episode List - Full width below main content */}
        {/* Episode Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`mt-6 bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700 ${
            isMovie ? "my-10" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Info size={20} className="text-cyan-400" />
            <h3 className="text-xl font-semibold">
              {isMovie ? "Movie Details" : "Episode Description"}
            </h3>
          </div>
          <p className="text-gray-300">
            {selectedEpisodeData?.desc || "No description available."}
          </p>
        </motion.div>

        {/* Player Controls - Simplified for movies */}
        {!isMovie && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`mt-6 bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700 ${
              isMovie ? "my-10" : ""
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={handlePlayPause}
                  className="flex items-center gap-2 text-sm hover:text-cyan-400 transition"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <>
                  <button className="flex items-center gap-2 text-sm hover:text-cyan-400 transition">
                    <SkipForward size={16} /> Auto Next: On
                  </button>
                  <button className="flex items-center gap-2 text-sm hover:text-cyan-400 transition">
                    <Clock size={16} /> Auto Skip Intro: On
                  </button>
                </>
              </div>
              <div className="flex gap-4">
                <>
                  <button
                    onClick={() =>
                      handleEpisodeChange(Math.max(selectedEpisode - 1, 1))
                    }
                    className="flex items-center gap-2 text-sm hover:text-cyan-400 transition"
                  >
                    <SkipBack size={16} /> Prev
                  </button>
                  <button
                    onClick={() =>
                      handleEpisodeChange(
                        Math.min(
                          selectedEpisode + 1,
                          selectedSeasonData?.episodes.length || 1
                        )
                      )
                    }
                    className="flex items-center gap-2 text-sm hover:text-cyan-400 transition"
                  >
                    Next <SkipForward size={16} />
                  </button>
                </>
              </div>
            </div>
          </motion.div>
        )}
        {!isMovie && (
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-gradient-to-b from-gray-800 to-gray-900 p-6 border-t border-gray-700 my-10 rounded-lg"
          >
            <div className="max-w-full mx-auto">
              {/* Season Dropdown */}
              <div className="mb-6 relative">
                <button
                  onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                  className="w-full flex justify-between items-center p-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <List size={18} />
                    Season {selectedSeason}
                  </span>
                  <ChevronDown
                    className={`transform transition-transform ${
                      isSeasonDropdownOpen ? "rotate-180" : ""
                    }`}
                    size={18}
                  />
                </button>
                <AnimatePresence>
                  {isSeasonDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-10 w-full mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700"
                    >
                      {seasons.map((season) => (
                        <button
                          key={season.seasonNumber}
                          onClick={() => {
                            handleSeasonChange(season.seasonNumber);
                            setIsSeasonDropdownOpen(false);
                          }}
                          className="w-full p-3 text-left hover:bg-gray-700 transition rounded-lg flex items-center gap-2"
                        >
                          <Play size={16} />
                          Season {season.seasonNumber}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Episode List */}
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock size={18} />
                Episodes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedSeasonData?.episodes.map((episode, i) => (
                  <motion.button
                    key={episode._id}
                    onClick={() => handleEpisodeChange(i + 1)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      selectedEpisode === i + 1
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600 transition"
                    }`}
                  >
                    <span>
                      {i + 1}. {episode.name}
                    </span>
                    <div className="flex gap-2">
                      {bookmarkedEpisodes.includes(i + 1) && (
                        <Bookmark size={16} />
                      )}
                      {selectedEpisode === i + 1 && (
                        <Play className="text-white" size={16} />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Stream;
