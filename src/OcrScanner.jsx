import React, { useState } from "react";
import Tesseract from "tesseract.js";

/**
 * Improved Aadhaar OCR Scanner - Better extraction for Aadhaar cards
 */

function OcrScanner() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  // Improved regex patterns
  const dobRegex = /DOB[\s:\-/]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i;
  const aadhaarRegex = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
  const genderRegex = /(Male|Female|M|F|पुरुष|महिला)/i;
  const nameRegex = /^[A-Za-z\s\.]{3,}$/;

  // Function to clean and extract proper text
  const cleanText = (text) => {
    return text
      .replace(/[^\w\s\/:\-\d\.@]/g, ' ') // Remove special chars but keep basic ones
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Function to extract fields from OCR text
  const extractFields = (text) => {
    const cleanedText = cleanText(text);
    const lines = cleanedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    let extractedName = "";
    let extractedDob = "";
    let extractedAadhaar = "";
    let extractedGender = "";

    console.log("OCR Lines:", lines); // Debug log

    // Extract Aadhaar Number
    const aadhaarMatch = cleanedText.match(aadhaarRegex);
    if (aadhaarMatch) {
      extractedAadhaar = aadhaarMatch[0].replace(/\s/g, '');
    }

    // Extract DOB
    const dobMatch = cleanedText.match(dobRegex);
    if (dobMatch) {
      extractedDob = dobMatch[1]; // Get the date part only
    } else {
      // Fallback: look for date pattern near DOB keyword
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('dob')) {
          const dateMatch = lines[i].match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
          if (dateMatch) {
            extractedDob = dateMatch[0];
            break;
          }
          // Check next line if current line doesn't have date
          if (i + 1 < lines.length) {
            const nextLineMatch = lines[i + 1].match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
            if (nextLineMatch) {
              extractedDob = nextLineMatch[0];
              break;
            }
          }
        }
      }
    }

    // Extract Gender
    const genderMatch = cleanedText.match(genderRegex);
    if (genderMatch) {
      extractedGender = genderMatch[0];
    }

    // Improved Name Extraction
    // Strategy: Look for lines that appear to be names based on position and content
    
    // Method 1: Look for name above DOB line
    if (!extractedName) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('dob') && i > 0) {
          // Check lines above DOB for potential name
          for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
            const candidate = lines[j].replace(/[^A-Za-z\s\.]/g, '').trim();
            if (nameRegex.test(candidate) && candidate.length > 2) {
              extractedName = candidate;
              break;
            }
          }
          if (extractedName) break;
        }
      }
    }

    // Method 2: Look for typical name patterns in clean lines
    if (!extractedName) {
      for (let line of lines) {
        const cleanLine = line.replace(/[^A-Za-z\s\.]/g, '').trim();
        if (nameRegex.test(cleanLine) && 
            cleanLine.length >= 3 && 
            cleanLine.length <= 50 &&
            !cleanLine.toLowerCase().includes('government') &&
            !cleanLine.toLowerCase().includes('india') &&
            !cleanLine.toLowerCase().includes('aadhaar') &&
            !cleanLine.toLowerCase().includes('dob') &&
            !cleanLine.toLowerCase().includes('male') &&
            !cleanLine.toLowerCase().includes('female')) {
          extractedName = cleanLine;
          break;
        }
      }
    }

    // Method 3: Look for lines with title case (first letter of each word capital)
    if (!extractedName) {
      for (let line of lines) {
        const cleanLine = line.replace(/[^A-Za-z\s\.]/g, '').trim();
        const words = cleanLine.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
          const hasTitleCase = words.every(word => 
            word.length > 0 && 
            /[A-Z]/.test(word[0]) && 
            word.slice(1).toLowerCase() === word.slice(1)
          );
          if (hasTitleCase && cleanLine.length >= 3) {
            extractedName = cleanLine;
            break;
          }
        }
      }
    }

    // Clean up name
    if (extractedName) {
      extractedName = extractedName
        .replace(/^(name|nam|nama|nom|nome)[\s:\-]*/i, '')
        .replace(/[0-9]/g, '')
        .trim();
    }

    return { 
      name: extractedName || "Not found", 
      dob: extractedDob || "Not found",
      aadhaar: extractedAadhaar || "Not found",
      gender: extractedGender || "Not found"
    };
  };

  // Image upload handler
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setName("");
    setDob("");
    setAadhaarNumber("");
    setGender("");
    setNote("");

    // Configure Tesseract for better results
    Tesseract.recognize(file, "eng", {
      logger: m => console.log(m.status, m.progress),
      tessedit_pageseg_mode: 6, // Uniform block of text
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /:-.,@'
    })
      .then((res) => {
        const text = res.data.text || "";
        console.log("Raw OCR Text:", text); // Debug log
        
        const { name, dob, aadhaar, gender } = extractFields(text);

        setName(name);
        setDob(dob);
        setAadhaarNumber(aadhaar);
        setGender(gender);

        const successCount = [name, dob, aadhaar, gender].filter(field => field !== "Not found").length;
        setNote(successCount >= 2 ? "✅ Extraction Successful" : "⚠️ Partial Extraction");
        setLoading(false);
      })
      .catch((err) => {
        console.error("OCR Error:", err);
        setNote("❌ OCR Failed");
        setLoading(false);
      });
  };

  // UI
  return (
    <div style={{
      textAlign: "center",
      marginTop: "20px",
      backgroundColor: "LightYellow",
      padding: "18px",
      borderRadius: "8px",
      maxWidth: "600px",
      margin: "auto"
    }}>
      <h2>📘 Aadhaar OCR Scanner</h2>
      <p style={{ fontSize: "0.9em", color: "#666", marginBottom: "15px" }}>
        Upload Aadhaar card image to extract details
      </p>
      
      <input type="file" accept="image/*" onChange={handleUpload} />

      {loading && <p>⏳ Scanning... Please wait.</p>}

      {!loading && (name || dob || aadhaarNumber || gender) && (
        <div style={{
          marginTop: "20px",
          textAlign: "left",
          backgroundColor: "white",
          padding: "15px",
          borderRadius: "5px",
          border: "1px solid #ddd"
        }}>
          <h3>Extracted Details:</h3>
          <p><strong>Name:</strong> {name}</p>
          <p><strong>Date of Birth:</strong> {dob}</p>
          <p><strong>Aadhaar Number:</strong> {aadhaarNumber}</p>
          <p><strong>Gender:</strong> {gender}</p>
          <p style={{ color: "gray", fontSize: "0.9em", marginTop: "10px" }}>{note}</p>
        </div>
      )}
    </div>
  );
}

export default OcrScanner;