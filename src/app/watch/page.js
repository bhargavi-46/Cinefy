"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, SkipForward, SkipBack, ChevronDown, Info, Clock, List
} from "lucide-react";
import Navbar from "../components/navbar";

export default function AnimeWatchPage() {
  const [videoData, setVideoData] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [seasons, setSeasons] = useState([]);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerSettings, setPlayerSettings] = useState({
    autoPlay: false,
    autoNext: true
  });
  const videoRef = useRef(null);
  
  // Detect if content is a movie (single season with single episode)
  const isMovie = seasons.length === 1 && seasons[0]?.episodes?.length === 1;

  useEffect(() => {
    const fetchVideoData = async () => {
      const storedData = sessionStorage.getItem("selectedContent");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setVideoData(parsedData);
        setSeasons(parsedData.seasons || []); 
      }
    };
  
    fetchVideoData();

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const selectedSeasonData = seasons.find((season) => season.seasonNumber === selectedSeason);
  const selectedEpisodeData = selectedSeasonData?.episodes[selectedEpisode - 1];

  const toggleSetting = (setting) => {
    setPlayerSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handlePreviousEpisode = () => {
    if (isMovie) return;
    
    if (selectedEpisode > 1) {
      setSelectedEpisode(prev => prev - 1);
    } else if (selectedSeason > 1) {
      const prevSeason = seasons.find(s => s.seasonNumber === selectedSeason - 1);
      if (prevSeason) {
        setSelectedSeason(selectedSeason - 1);
        setSelectedEpisode(prevSeason.episodes.length);
      }
    }
  };

  const handleNextEpisode = () => {
    if (isMovie) return;

    if (selectedEpisode < selectedSeasonData?.episodes.length) {
      setSelectedEpisode(prev => prev + 1);
    } else if (selectedSeason < seasons.length) {
      setSelectedSeason(selectedSeason + 1);
      setSelectedEpisode(1);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Auto-play next episode if enabled
  useEffect(() => {
    if (!videoRef.current || !playerSettings.autoNext || isMovie) return;

    const handleEnded = () => {
      if (selectedEpisode < selectedSeasonData?.episodes.length) {
        setSelectedEpisode(prev => prev + 1);
      } else if (selectedSeason < seasons.length) {
        setSelectedSeason(selectedSeason + 1);
        setSelectedEpisode(1);
      }
    };

    videoRef.current.addEventListener('ended', handleEnded);
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [selectedEpisode, selectedSeason, playerSettings.autoNext, isMovie]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="container mx-auto flex flex-col lg:flex-row gap-6">
        {/* Season & Episode List - Hidden for movies */}
        {!isMovie && (
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:w-1/4 bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700"
          >
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
                          setSelectedSeason(season.seasonNumber);
                          setSelectedEpisode(1);
                          setIsSeasonDropdownOpen(false);
                        }}
                        className={`w-full p-3 text-left hover:bg-gray-700 transition rounded-lg flex items-center gap-2 ${
                          selectedSeason === season.seasonNumber ? 'bg-gray-700' : ''
                        }`}
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
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {selectedSeasonData?.episodes.map((episode, i) => (
                <motion.button
                  key={episode._id}
                  onClick={() => setSelectedEpisode(i + 1)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className={`w-full flex justify-between items-center p-3 rounded-lg ${
                    selectedEpisode === i + 1
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600 transition"
                  }`}
                >
                  <span>{i + 1}. {episode.name}</span>
                  <div className="flex gap-2">
                    {selectedEpisode === i + 1 && <Play className="text-white" size={16} />}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Video Player & Controls */}
        <div className={`w-full ${isMovie ? 'lg:w-full' : 'lg:w-3/4'} space-y-6`}>
          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-[400px] lg:h-[500px] bg-black rounded-xl shadow-2xl border-2 border-cyan-500 overflow-hidden relative"
          >
            {selectedEpisodeData?.link ? (
              <video
                ref={videoRef}
                className="w-full h-full"
                src={`${selectedEpisodeData.link}`}
                controls
                autoPlay={playerSettings.autoPlay}
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <p className="text-gray-400">No video URL provided.</p>
              </div>
            )}
          </motion.div>

          {/* Episode/Movie Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700"
          >
            <div className="flex items-center gap-2 mb-4">
              <Info size={20} className="text-cyan-400" />
              <h3 className="text-xl font-semibold">
                {isMovie ? "Movie Description" : "Episode Description"}
              </h3>
            </div>
            <p className="text-gray-300">
              {selectedEpisodeData?.desc || "No description available."}
            </p>
          </motion.div>

          {/* Player Controls - Simplified for movies */}
          {!isMovie ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700"
            >
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-4 flex-wrap">
                  <button 
                    onClick={() => toggleSetting('autoPlay')}
                    className={`flex items-center gap-2 text-sm transition ${
                      playerSettings.autoPlay 
                        ? "text-cyan-400 hover:text-cyan-300" 
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <Play size={16} /> Auto Play: {playerSettings.autoPlay ? "On" : "Off"}
                  </button>
                  <button 
                    onClick={() => toggleSetting('autoNext')}
                    className={`flex items-center gap-2 text-sm transition ${
                      playerSettings.autoNext 
                        ? "text-cyan-400 hover:text-cyan-300" 
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <SkipForward size={16} /> Auto Next: {playerSettings.autoNext ? "On" : "Off"}
                  </button>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={handlePreviousEpisode}
                    disabled={selectedEpisode === 1 && selectedSeason === 1}
                    className={`flex items-center gap-2 text-sm transition ${
                      selectedEpisode === 1 && selectedSeason === 1
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-cyan-400 hover:text-cyan-300"
                    }`}
                  >
                    <SkipBack size={16} /> Prev
                  </button>
                  <button
                    onClick={handleNextEpisode}
                    disabled={
                      selectedEpisode === selectedSeasonData?.episodes.length && 
                      selectedSeason === seasons.length
                    }
                    className={`flex items-center gap-2 text-sm transition ${
                      selectedEpisode === selectedSeasonData?.episodes.length && 
                      selectedSeason === seasons.length
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-cyan-400 hover:text-cyan-300"
                    }`}
                  >
                    Next <SkipForward size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}