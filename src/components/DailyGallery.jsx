import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";

const DailyGallery = () => {
  const [images, setImages] = useState([]); // Stores { name, url }
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // 1. Fetch images that actually exist in the bucket
 const fetchImages = async () => {
  try {
    setLoading(true);
    
    // 1. Increased limit to 1000 so old images don't get cut off
    const { data, error } = await supabase.storage
      .from("yuke-daily")
      .list("", {
        limit: 1000, 
        sortBy: { column: "name", order: "desc" },
      });

    if (error) throw error;

    // 2. Make the filter case-insensitive (.jpg and .JPG)
    // 3. Filter out the '.emptyFolderPlaceholder' file if it exists
    const formattedImages = data
      .filter((file) => 
        file.name.toLowerCase().endsWith(".jpg") || 
        file.name.toLowerCase().endsWith(".jpeg")
      )
      .map((file) => ({
        name: file.name.replace(/\.[^/.]+$/, ""), // Removes any extension correctly
        url: supabase.storage.from("yuke-daily").getPublicUrl(file.name).data.publicUrl,
      }));

    setImages(formattedImages);
  } catch (err) {
    console.error("Error fetching images:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchImages();
  }, []);

  // 2. Handle Upload
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.storage
      .from("yuke-daily")
      .upload(`${today}.jpg`, file, { upsert: true });

    if (error) {
      alert("Upload failed ❌");
    } else {
      // Refresh list without reloading page
      await fetchImages();
    }
    setUploading(false);
  };

  // 3. Keyboard Nav
  useEffect(() => {
    const handleKey = (e) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") setSelectedIndex((prev) => (prev + 1) % images.length);
      if (e.key === "ArrowLeft") setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, images]);

  return (
    <div className="container">
      <header className="upload-section">
        <label className="custom-file-upload">
          <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
          {uploading ? "Uploading..." : "Add Today's Snapshot"}
        </label>
        <p className="status-text">
          {loading ? "Syncing timeline..." : `${images.length} days recorded`}
        </p>
      </header>

      <div className="gallery">
        {images.map((img, index) => (
          <div key={img.name} className="card" onClick={() => setSelectedIndex(index)}>
            <div className="image-container">
              <img src={img.url} alt={img.name} loading="lazy" />
            </div>
            <div className="card-info">
              <p className="date">{img.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Aesthetic Lightbox */}
      {selectedIndex !== null && (
        <div className="lightbox" onClick={() => setSelectedIndex(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="nav-btn prev" onClick={() => setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1)}>◀</button>
            
            <img src={images[selectedIndex].url} className="lightbox-img" alt="Preview" />
            
            <button className="nav-btn next" onClick={() => setSelectedIndex((selectedIndex + 1) % images.length)}>▶</button>
            
            <p style={{ textAlign: "center", marginTop: "15px" }}>{images[selectedIndex].name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyGallery;