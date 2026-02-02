const OpenAI = require("openai");

const ollama = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
  timeout: 60000,
});

async function test() {
  console.log("Testing Ollama LLM...");
  
  try {
    const completion = await ollama.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello in Korean, keep it very short." }
      ],
      model: "gpt-oss:20b",
      temperature: 0.7,
      max_tokens: 100,
    });

    console.log("Response:", completion.choices[0]?.message?.content);
    console.log("Success!");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
