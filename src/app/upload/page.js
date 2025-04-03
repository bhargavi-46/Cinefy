"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  FaUpload,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSave,
  FaTimes,
  FaSpinner,
  FaFilm,
  FaVideo,
  FaArrowLeft,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Upload = () => {
  const [content, setContent] = useState([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [genre, setGenre] = useState("");
  const [premium, setPremium] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [current, setCurrent] = useState("main");
  const [expandedElement, setExpandedElement] = useState(null);
  const [addSeasons, setAddSeasons] = useState(false);
  const [seasonNumber, setSeasonNumber] = useState("");
  const [episodeName, setEpisodeName] = useState("");
  const [episodeDesc, setEpisodeDesc] = useState("");
  const [episodeVideo, setEpisodeVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const [fileSize, setFileSize] = useState(0);
  const [uploadedSize, setUploadedSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchContent = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/upload", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error fetching content");
      }

      const data = await response.json();
      setContent(data.content);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const addContent = async (formData) => {
    try {
      const response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error adding content");
      }

      const result = await response.json();
      toast.success("Content added successfully!");

      setName("");
      setDesc("");
      setGenre("");
      setThumbnail(null);
      setThumbnailPreview(null);
      setPremium(false);
      setCurrent("main");
      fetchContent();
    } catch (error) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
      setUploadProgress(0);
      setUploadSpeed(0);
      setEstimatedTime(0);
      setUploadStartTime(null);
      setFileSize(0);
      setUploadedSize(0);
    }
  };

  const addData = async (episode, expandedElement, seasonNumber) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("_id", expandedElement);
      formData.append("seasonNumber", seasonNumber);
      formData.append("episodes[0][name]", episode.name);
      formData.append("episodes[0][desc]", episode.desc);
      if (episode.video) {
        formData.append("episodes[0][file]", episode.video);
      }

      const response = await fetch("http://localhost:3000/api/upload", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Could not add the episode");
      }

      toast.success("Episode added successfully!");
      fetchContent();
    } catch (error) {
      toast.error(
        "❌ Error: " + (error.message || "An unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (_id) => {
    if (!_id) {
      toast.warning("Must Have an Id to delete content");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:3000/api/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id }),
      });

      if (!response.ok) {
        throw new Error("Error Deleting Content");
      } else {
        toast.success("Deleted Successfully!");
        fetchContent();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEpisode = async () => {
    if (!episodeName || !episodeDesc || !episodeVideo) {
      toast.warning("Please fill out all fields for the episode.");
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setUploadStartTime(Date.now());
    setFileSize(episodeVideo.size);

    const formData = new FormData();
    formData.append("_id", expandedElement);
    formData.append("seasonNumber", seasonNumber);
    formData.append("episodeName", episodeName);
    formData.append("episodeDesc", episodeDesc);
    formData.append("episodeVideo", episodeVideo);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setUploadProgress(percentComplete);
        setUploadedSize(event.loaded);
        
        // Calculate upload speed (bytes per second)
        const elapsedTime = (Date.now() - uploadStartTime) / 1000; // in seconds
        const speed = event.loaded / elapsedTime; // bytes per second
        setUploadSpeed(speed);
        
        // Calculate estimated time remaining in seconds
        const remaining = (event.total - event.loaded) / speed;
        setEstimatedTime(remaining);
      }
    });

    xhr.open("PUT", "http://localhost:3000/api/upload");
    xhr.onload = () => {
      if (xhr.status === 200) {
        toast.success("Episode added successfully!");
        fetchContent();
      } else {
        toast.error("Failed to add episode");
      }
      setIsSubmitting(false);
      setIsLoading(false);
      setEpisodeName("");
      setEpisodeDesc("");
      setEpisodeVideo(null);
      setUploadProgress(0);
      setUploadSpeed(0);
      setEstimatedTime(0);
    };

    xhr.onerror = () => {
      toast.error("Upload failed");
      setIsSubmitting(false);
      setIsLoading(false);
      setUploadProgress(0);
      setUploadSpeed(0);
      setEstimatedTime(0);
    };

    xhr.send(formData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !desc || !genre || !thumbnail) {
      toast.warning("Please fill out all fields and select a thumbnail.");
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setUploadStartTime(Date.now());
    setFileSize(thumbnail.size);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("desc", desc);
    formData.append("genre", genre);
    formData.append("thumbnail", thumbnail);
    formData.append("premium", premium);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setUploadProgress(percentComplete);
        setUploadedSize(event.loaded);
        
        // Calculate upload speed (bytes per second)
        const elapsedTime = (Date.now() - uploadStartTime) / 1000; // in seconds
        const speed = event.loaded / elapsedTime; // bytes per second
        setUploadSpeed(speed);
        
        // Calculate estimated time remaining in seconds
        const remaining = (event.total - event.loaded) / speed;
        setEstimatedTime(remaining);
      }
    });

    xhr.open("POST", "http://localhost:3000/api/upload", true);
    xhr.send(formData);

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        toast.success("Content added successfully!");

        setName("");
        setDesc("");
        setGenre("");
        setThumbnail(null);
        setThumbnailPreview(null);
        setPremium(false);
        setCurrent("main");
        fetchContent();
      } else {
        toast.error("Upload failed");
      }
      setIsSubmitting(false);
      setIsLoading(false);
      setUploadProgress(0);
      setUploadSpeed(0);
      setEstimatedTime(0);
      setUploadStartTime(null);
      setFileSize(0);
      setUploadedSize(0);
    };

    xhr.onerror = () => {
      toast.error("Upload failed");
      setIsSubmitting(false);
      setIsLoading(false);
      setUploadProgress(0);
      setUploadSpeed(0);
      setEstimatedTime(0);
      setUploadStartTime(null);
    };
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format time in seconds to MM:SS format
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds === Infinity) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle thumbnail preview
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Loader Component
  const LoaderOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <FaSpinner className="text-blue-500 text-4xl animate-spin mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Please wait</h3>
          <p className="text-gray-300">Content is being added to the platform...</p>
          
          {(isSubmitting && uploadProgress > 0) && (
            <div className="w-full mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Upload Progress</span>
                <span className="text-sm text-gray-400">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <ToastContainer />
      
      {isLoading && <LoaderOverlay />}
      
      {current === "main" ? (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-blue-400">Content Management System</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Upload, edit, and manage your media content with ease.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <div 
              onClick={() => setCurrent("add")}
              className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="p-8 flex flex-col items-center justify-center h-full">
                <div className="bg-blue-500 p-6 rounded-full mb-6">
                  <FaUpload className="text-white text-4xl" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-center">Add New Content</h2>
                <p className="text-gray-200 text-center">
                  Upload new movies, shows, or series to your content library
                </p>
              </div>
            </div>
            
            <div 
              onClick={() => setCurrent("edit")}
              className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="p-8 flex flex-col items-center justify-center h-full">
                <div className="bg-green-500 p-6 rounded-full mb-6">
                  <FaEdit className="text-white text-4xl" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-center">Edit Content</h2>
                <p className="text-gray-200 text-center">
                  Manage existing content, add episodes, or remove media
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center text-gray-400">
            <p>Total content items: {content.length}</p>
          </div>
        </div>
      ) : current === "edit" ? (
        <div className="w-full max-w-4xl mx-auto mt-8">
          <div className="flex items-center mb-8">
            <button
              onClick={() => setCurrent("main")}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2 mr-4"
            >
              <FaArrowLeft />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold">Edit Content</h1>
          </div>
          
          {content.length === 0 ? (
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
              <FaFilm className="text-4xl text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Content Available</h2>
              <p className="text-gray-400 mb-4">You haven't added any content yet.</p>
              <button
                onClick={() => setCurrent("add")}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 inline-flex items-center"
              >
                <FaPlus className="mr-2" />
                Add Your First Content
              </button>
            </div>
          ) : (
            content.map((element, index) => (
              <div
                key={index}
                className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6 transition-all duration-300 hover:shadow-xl"
              >
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="flex-shrink-0 relative w-40 h-40 rounded-lg overflow-hidden">
                    <Image
                      src={element.thumbnail}
                      alt={element.name}
                      fill
                      className="object-cover"
                    />
                    {element.premium && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                        PREMIUM
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold">{element.name}</h2>
                    <p className="text-gray-400 text-sm mt-1">Genre: {element.genre}</p>
                    <div className="mt-2 max-w-md">
                      <p className="text-gray-300 line-clamp-2">{element.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() =>
                        setExpandedElement(
                          expandedElement === element._id ? null : element._id
                        )
                      }
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center space-x-2"
                    >
                      {expandedElement === element._id ? <FaTimes /> : <FaEdit />}
                      <span>
                        {expandedElement === element._id ? "Close" : "Edit"}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(element._id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center space-x-2"
                    >
                      <FaTrash />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {expandedElement === element._id && (
                  <div className="mt-6 space-y-6 border-t border-gray-700 pt-6">
                    {element.seasons && element.seasons.length > 0 ? (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-3">Content Seasons & Episodes:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {element.seasons.map((season, sIndex) => (
                            <div key={sIndex} className="bg-gray-700 rounded-lg p-4">
                              <h4 className="text-md font-medium flex items-center">
                                <FaVideo className="mr-2 text-blue-400" />
                                Season {season.seasonNumber}
                              </h4>
                              <ul className="mt-2 space-y-1">
                                {season.episodes.map((episode, eIndex) => (
                                  <li key={eIndex} className="text-gray-300 flex items-center py-1 px-2 rounded hover:bg-gray-600">
                                    <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs mr-2">
                                      {eIndex + 1}
                                    </span>
                                    {episode.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">No seasons or episodes added yet.</div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <button
                        onClick={() => setAddSeasons(!addSeasons)}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center space-x-2"
                      >
                        {addSeasons ? <FaTimes /> : <FaPlus />}
                        <span>
                          {addSeasons ? "Cancel Add Episode" : "Add Episode"}
                        </span>
                      </button>
                    </div>

                    {addSeasons && (
                      <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                        <h2 className="text-lg font-bold mb-4 flex items-center">
                          <FaPlus className="mr-2 text-purple-400" />
                          Add New Episode
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Season Number
                            </label>
                            <input
                              type="number"
                              className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => setSeasonNumber(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Episode Name
                            </label>
                            <input
                              type="text"
                              className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={episodeName}
                              onChange={(e) => setEpisodeName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Episode Description
                            </label>
                            <textarea
                              className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={episodeDesc}
                              onChange={(e) => setEpisodeDesc(e.target.value)}
                              rows="3"
                            ></textarea>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Episode Video
                            </label>
                            <input
                              type="file"
                              accept="video/mp4, video/webm, video/ogg, video/x-matroska"
                              className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => setEpisodeVideo(e.target.files[0])}
                            />
                          </div>
                          
                          <button
                            className={`bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center space-x-2 w-full ${
                              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={saveEpisode}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <FaSpinner className="animate-spin mr-2" />
                                Uploading Episode...
                              </>
                            ) : (
                              <>
                                <FaSave />
                                <span>Save Episode</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Create New Content</h1>
              <button
                onClick={() => setCurrent("main")}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2"
              >
                <FaArrowLeft />
                <span>Back</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Enter content name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Genre</label>
                  <input
                    type="text"
                    placeholder="Enter content genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter content description"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="premium-check"
                  checked={premium}
                  onChange={(e) => setPremium(e.target.checked)}
                  className="w-5 h-5 rounded bg-gray-700 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="premium-check" className="font-medium cursor-pointer">
                  Premium Content
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Thumbnail
                  </label>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!thumbnail}
                    />
                  </div>
                </div>
                
                <div>
                  {thumbnailPreview && (
                    <div className="relative mt-6 h-32 rounded-lg overflow-hidden">
                      <Image
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnail(null);
                          setThumbnailPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-bold transition duration-300 flex items-center justify-center ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Uploading Content...
                  </>
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    Create Content
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;