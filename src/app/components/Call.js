"use client";

import SendBirdCall from "sendbird-calls";
import React, { useState, useEffect } from "react";
import Login from "./login";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from "react-icons/fa";

const Call = () => {
  const [userId, setUserId] = useState("");
  const [room, setRoom] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  const authenticate = async () => {
    try {
      const result = await new Promise((resolve, reject) => {
        SendBirdCall.authenticate({ userId }, (res, error) => {
          if (error) reject(error);
          else resolve(res);
        });
      });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const initiateSendbirdCalls = async () => {
    const APP_ID = process.env.NEXT_PUBLIC_APP_ID;
    SendBirdCall.init(APP_ID);
    try {
      setLoading(true);
      await authenticate();
      await SendBirdCall.connectWebSocket();
      setAuthenticated(true);
      setLoading(false);
    } catch {
      setLoading(false);
      setAuthenticated(false);
    }
  };

  const createRoom = async () => {
    try {
      const createdRoom = await SendBirdCall.createRoom({ roomType: "small_room_for_video" });
      setRoom(createdRoom);
      await createdRoom.enter({
        audioEnabled: false,
        videoEnabled: isVideoOn,
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
        removeRemoteVideo(participant)
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
        audioEnabled: isAudioOn,
        videoEnabled: isVideoOn,
        localMediaView: document.getElementById("local_video_element_id"),
      });
      setRoom(existingRoom);

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
        removeRemoteVideo(participant)
      });

      existingRoom.on("localParticipantExited", () => {
        setRoom(null); // Reset room state
      });
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const removeRemoteVideo = (participant) => {
    const ContainertId = `remote_video_${participant.participantId}`;
    const videoContainer = document.getElementById(ContainertId);
    
    if (videoContainer) {
      videoContainer.remove()
    }
  }

  const addRemoteVideo = (participant) => {
    const videoContainer = document.createElement("div");
    videoContainer.className = "relative w-[300px] h-[300px] rounded-md overflow-hidden";
  
    const videoElement = document.createElement("video");
    videoContainer.id = `remote_video_${participant.participantId}`;
    videoElement.autoplay = true;
    videoElement.className = "w-full h-full object-cover rounded-md";
  
    const userNameLabel = document.createElement("div");
    userNameLabel.className = "absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded";
    if(participant.user.userId === userId)
      userNameLabel.innerText = participant.user.userId + "(You)" || "Unknown User";
    else
      userNameLabel.innerText = participant.user.userId || "Unknown User";
  
    videoContainer.appendChild(videoElement);
    videoContainer.appendChild(userNameLabel);
    document.getElementById("remote_video_container").appendChild(videoContainer);
  
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
      }
    } catch (error) {
      console.error("Error toggling video:", error);
    }
  };

  const toggleAudio = () => {
    try {
      if (isAudioOn) {
        room.localParticipant.muteMicrophone();
      } else {
        room.localParticipant.unmuteMicrophone();
      }
      setIsAudioOn(!isAudioOn);
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  };

  const leaveRoom = async () => {
    if (room) {
      await room.exit();
      setRoom(null);
      // Clear remote video container
      const remoteVideoContainer = document.getElementById("remote_video_container");
      if (remoteVideoContainer) {
        remoteVideoContainer.innerHTML = "";
      }
    }
  };

  useEffect(() => {
    if (userId) initiateSendbirdCalls();
  }, [userId]);

  return (
    <div className="p-10">
      <div className="flex justify-center mt-28">
        {userId && (
          <div className="flex flex-col items-center space-y-6">
            <h1 className="font-bold text-xl">Authenticated as {userId}</h1>

            {authenticated && !room && (
              <div className="flex space-x-4">
                <button
                  onClick={createRoom}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
                >
                  <FaVideo className="mr-2" /> Create Room
                </button>
                <button
                  onClick={() => joinRoom(prompt("Enter Room ID"))}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
                >
                  <FaVideo className="mr-2" /> Join Room
                </button>
              </div>
            )}

            {room && (
              <div className="flex flex-col items-center space-y-3">
                <h2>In Room: {room.roomId}</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={toggleVideo}
                    className={`${
                      isVideoOn ? "bg-blue-500" : "bg-gray-500"
                    } text-white font-bold py-2 px-4 rounded flex items-center`}
                  >
                    {isVideoOn ? <FaVideo className="mr-2" /> : <FaVideoSlash className="mr-2" />}
                    {isVideoOn ? "Turn Off Video" : "Turn On Video"}
                  </button>
                  <button
                    onClick={toggleAudio}
                    className={`${
                      isAudioOn ? "bg-blue-500" : "bg-gray-500"
                    } text-white font-bold py-2 px-4 rounded flex items-center`}
                  >
                    {isAudioOn ? <FaMicrophone className="mr-2" /> : <FaMicrophoneSlash className="mr-2" />}
                    {isAudioOn ? "Mute" : "Unmute"}
                  </button>
                  <button
                    onClick={leaveRoom}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center"
                  >
                    <FaPhoneSlash className="mr-2" /> Leave Room
                  </button>
                </div>
              </div>
            )}

            <div className="relative h-[700px] w-screen flex rounded-md ml-[40px]">
              <div className="absolute top-0 left-0 w-[300px] h-[300px] rounded-md bg-gray-700">
                <video
                  className="w-full h-full rounded-md"
                  id="local_video_element_id"
                  autoPlay
                  muted
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  {userId} (You)
                </div>
              </div>
              <div id="remote_video_container" className="flex flex-wrap gap-2"></div>
            </div>
          </div>
        )}

        {!userId && (
          <div>
            <h1 className="font-bold text-[20px]">Not Authenticated</h1>
            <Login setUserId={setUserId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Call;