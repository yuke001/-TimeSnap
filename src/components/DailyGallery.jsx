import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";

const DailyGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // 👉 Touch states
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);

  const minSwipeDistance = 50;

  // 📸 Fetch Images
  const fetchImages = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.storage
        .from("yuke-daily")
        .list("", {
          limit: 1000,
          sortBy: { column: "name", order: "desc" },
        });

      if (error) throw error;

      const formattedImages = data
        .filter(
          (file) =>
            file.name.toLowerCase().endsWith(".jpg") ||
            file.name.toLowerCase().endsWith(".jpeg")
        )
        .map((file) => ({
          name: file.name.replace(/\.[^/.]+$/, ""),
          url: supabase.storage
            .from("yuke-daily")
            .getPublicUrl(file.name).data.publicUrl,
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

  // 📤 Upload
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only images allowed");
      return;
    }

    setUploading(true);
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.storage
      .from("yuke-daily")
      .upload(`${today}.jpg`, file, { upsert: true });

    if (error) {
      alert("Upload failed ❌");
    } else {
      setImages((prev) => [
        {
          name: today,
          url: supabase.storage
            .from("yuke-daily")
            .getPublicUrl(`${today}.jpg`).data.publicUrl,
        },
        ...prev,
      ]);
    }

    setUploading(false);
  };

  // ⌨️ Keyboard nav
  useEffect(() => {
    const handleKey = (e) => {
      if (selectedIndex === null) return;

      if (e.key === "ArrowRight")
        setSelectedIndex((prev) => (prev + 1) % images.length);

      if (e.key === "ArrowLeft")
        setSelectedIndex((prev) =>
          prev === 0 ? images.length - 1 : prev - 1
        );

      if (e.key === "Escape") setSelectedIndex(null);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, images]);

  // 👆 Touch Handlers
  const onTouchStart = (e) => {
    setTouchEndX(null);
    setTouchEndY(null);

    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX || !touchStartY || !touchEndY) return;

    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;

    // 👇 Vertical swipe → close
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY < -minSwipeDistance) {
        setSelectedIndex(null);
      }
      return;
    }

    // 👉 Horizontal swipe → navigate
    if (deltaX > minSwipeDistance) {
      setSelectedIndex((prev) => (prev + 1) % images.length);
    }

    if (deltaX < -minSwipeDistance) {
      setSelectedIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="container">
      <header className="upload-section">
        <label className="custom-file-upload">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          {uploading ? "Uploading..." : "Add Today's Snapshot"}
        </label>

        <p className="status-text">
          {loading ? "Syncing timeline..." : `${images.length} days recorded`}
        </p>
      </header>

      {/* Empty state */}
      {!loading && images.length === 0 && (
        <p style={{ textAlign: "center", opacity: 0.6 }}>
          No snapshots yet. Start today 📸
        </p>
      )}

      <div className="gallery">
        {images.map((img, index) => (
          <div
            key={img.name}
            className="card"
            onClick={() => setSelectedIndex(index)}
          >
            <div className="image-container">
              <img src={img.url} alt={img.name} loading="lazy" />
            </div>
            <div className="card-info">
              <p className="date">{img.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div className="lightbox" onClick={() => setSelectedIndex(null)}>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="nav-btn prev"
              onClick={() =>
                setSelectedIndex(
                  selectedIndex === 0
                    ? images.length - 1
                    : selectedIndex - 1
                )
              }
            >
              ◀
            </button>

            <img
              src={images[selectedIndex].url}
              className="lightbox-img"
              alt="Preview"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />

            <button
              className="nav-btn next"
              onClick={() =>
                setSelectedIndex((selectedIndex + 1) % images.length)
              }
            >
              ▶
            </button>

            <p style={{ marginTop: "15px" }}>
              {images[selectedIndex].name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyGallery;