import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";

const getDates = () => {
  const start = new Date("2025-01-01");
  const today = new Date();
  const dates = [];

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }

  return dates.reverse();
};

const DailyGallery = () => {
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const dates = getDates();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.storage
      .from("yuke-daily")
      .upload(`${today}.jpg`, file, { upsert: true });

    if (error) {
      alert("Upload failed ❌");
      setLoading(false);
      return;
    }

    alert("Uploaded 🔥");
    setLoading(false);
    window.location.reload();
  };

  const getImageUrl = (date) => {
    return `https://iqiykkwixlnwdeviuxgy.supabase.co/storage/v1/object/public/yuke-daily/${date}.jpg`;
  };

  // 🔥 Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (selectedIndex === null) return;

      if (e.key === "ArrowRight") {
        setSelectedIndex((prev) => (prev + 1) % dates.length);
      }

      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev === 0 ? dates.length - 1 : prev - 1
        );
      }

      if (e.key === "Escape") {
        setSelectedIndex(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, dates.length]);

  return (
    <div>
      {/* Upload */}
      <div className="upload-box">
        <input type="file" accept="image/*" onChange={handleUpload} />
        <p>{loading ? "Uploading..." : "Upload today's selfie 📸"}</p>
      </div>

      {/* Gallery */}
      <div className="gallery">
        {dates.map((date, index) => {
          const imgUrl = getImageUrl(date);

          return (
            <div key={date} className="card">
              <img
                src={imgUrl}
                alt={date}
                onClick={() => setSelectedIndex(index)}
                onError={(e) => (e.target.style.display = "none")}
              />
              <p className="date">{date}</p>
              <p className="day">Day {dates.length - index}</p>
            </div>
          );
        })}
      </div>

      {/* 🔥 Advanced Lightbox */}
      {selectedIndex !== null && (
        <div className="lightbox" onClick={() => setSelectedIndex(null)}>
          <span className="close">✕</span>

          <span
            className="prev"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(
                selectedIndex === 0 ? dates.length - 1 : selectedIndex - 1
              );
            }}
          >
            ◀
          </span>

          <img
            src={getImageUrl(dates[selectedIndex])}
            alt="preview"
            onClick={(e) => e.stopPropagation()}
          />

          <span
            className="next"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex((selectedIndex + 1) % dates.length);
            }}
          >
            ▶
          </span>
        </div>
      )}
    </div>
  );
};

export default DailyGallery;