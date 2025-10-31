const axios = require("axios");

// Free model from HuggingFace (no API key required for simple inference)
const HF_API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-small";

exports.processQuery = async (query, customerId) => {
  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: query },
      { headers: { "Content-Type": "application/json" } }
    );

    const reply = response.data?.[0]?.generated_text || "I'm not sure, but I’ll find out!";
    return { known: false, answer: reply };
  } catch (err) {
    console.error("AI Error:", err.message);
    return { error: "AI service unavailable right now." };
  }
};
