// SchemePreview.js
import React, { useState } from "react";
import SCHEMES from "./schemeData";

function SchemePreview({ showSaveButton = true }) {
  const [profileTags, setProfileTags] = useState([]); // tags from user profile
  const [matchedSchemes, setMatchedSchemes] = useState([]);

  // Save Profile: filter schemes by tags
  const saveProfile = (tags) => {
    setProfileTags(tags);

    const filtered = SCHEMES.filter((scheme) =>
      scheme.tags.some((tag) => tags.includes(tag))
    );
    setMatchedSchemes(filtered);
  };

  return (
    <div className="p-4">
      {/* Save Profile Button */}
      {showSaveButton && (
        <button
          onClick={() => saveProfile(["Women", "Education"])} // demo tags
          className="save-profile-btn"
        >
          Save Profile
        </button>
      )}

      {/* Show Eligible Schemes After Save */}
      {profileTags.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold">🎯 Eligible Schemes for You</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {matchedSchemes.length > 0 ? (
              matchedSchemes.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    {s.emoji} {s.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{s.desc}</p>
                  <p className="mt-2 font-medium text-yellow-700">
                    💰 {s.fund}
                  </p>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 px-2 py-1 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Apply button */}
                  <button className="Schemepreview-e-btn">
                    Apply
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No schemes match your profile yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SchemePreview;
