const screens = document.querySelectorAll(".screen");
const music = document.getElementById("backgroundMusic");
const musicButton = document.getElementById("musicButton");
const musicLabel = document.getElementById("musicLabel");

let visitorName = "Beautiful Soul";
let musicIsOn = false;

function showScreen(id) {
  screens.forEach((screen) => screen.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function startMusic() {
  try {
    await music.play();
    musicIsOn = true;
    musicLabel.textContent = "Music: ON";
    musicButton.setAttribute("aria-label", "Turn music off");
  } catch (error) {
    musicIsOn = false;
    musicLabel.textContent = "Tap for music";
    musicButton.setAttribute("aria-label", "Turn music on");
  }
}

musicButton.addEventListener("click", async () => {
  if (musicIsOn) {
    music.pause();
    musicIsOn = false;
    musicLabel.textContent = "Music: OFF";
    musicButton.setAttribute("aria-label", "Turn music on");
  } else {
    await startMusic();
  }
});

document.getElementById("startButton").addEventListener("click", async () => {
  const typedName = document.getElementById("visitorName").value.trim();
  visitorName = typedName || "Beautiful Soul";
  document.getElementById("helloName").textContent = visitorName;
  document.getElementById("letterName").textContent = visitorName;
  showScreen("hello");
  createHearts(14);
  await startMusic();
});

document.getElementById("visitorName").addEventListener("keydown", (event) => {
  if (event.key === "Enter") document.getElementById("startButton").click();
});

document.getElementById("openLetterButton").addEventListener("click", () => {
  showScreen("letter");
  createHearts(24);
});

document.getElementById("questionButton").addEventListener("click", () => {
  showScreen("question");
});

function answer(message) {
  document.getElementById("responseMessage").textContent = message;
  createHearts(20);
  window.setTimeout(() => showScreen("final"), 2200);
}

document.getElementById("yesButton").addEventListener("click", () => {
  answer("That makes me happy! Sending you a big virtual hug. 🫶");
});

document.getElementById("maybeButton").addEventListener("click", () => {
  answer("A little smile is a lovely start. Hope your day gets even better! 🌸");
});

document.getElementById("downloadButton").addEventListener("click", async () => {
  try {
    const pdf = await createNotePdf(visitorName);
    const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `A-Little-Note-For-${safeFileName(visitorName)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error("Could not create the note PDF.", error);
    window.alert("The PDF could not be created. Please try again.");
  }
});

async function createNotePdf(name) {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");

  const background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, "#100d29");
  background.addColorStop(0.55, "#26163f");
  background.addColorStop(1, "#120c25");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 193 + 71) % canvas.width;
    const y = (i * 317 + 43) % canvas.height;
    context.beginPath();
    context.arc(x, y, i % 9 === 0 ? 3 : 1.5, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = "rgba(255, 229, 248, 0.7)";
  context.lineWidth = 3;
  context.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);

  const safeName = name || "Beautiful Soul";
  context.textAlign = "center";
  context.fillStyle = "#e7c6ff";
  context.font = "600 24px Arial, sans-serif";
  context.fillText("✦  A LITTLE NOTE FOR YOU  ✦", canvas.width / 2, 200);

  context.fillStyle = "#ffb5d0";
  context.font = "italic 54px Georgia, serif";
  drawWrappedText(context, safeName, canvas.width / 2, 300, 920, 68);

  context.textAlign = "left";
  context.fillStyle = "#fff5fb";
  context.font = "32px Georgia, serif";
  const paragraphs = [
    `Dear ${safeName},`,
    "The world is full of small and beautiful things.",
    "A pretty sunset, a song you love, a kind message, or a smile that comes at the right time.",
    "I hope life gives you many such moments. You deserve kindness, peace, good people, and happy days.",
    "Keep smiling and keep being yourself. The world is better with your light in it.",
    "A little wish for you. ❤️",
    "Made with love and a little bit of magic."
  ];
  let y = 480;
  paragraphs.forEach((paragraph, index) => {
    y = drawWrappedText(context, paragraph, 150, y, 940, 48);
    y += index === 0 ? 56 : 34;
  });

  context.textAlign = "center";
  context.fillStyle = "#ffb5d0";
  context.font = "italic 30px Georgia, serif";
  context.fillText("Made with ♡ and a little bit of magic", canvas.width / 2, 1510);

  context.fillStyle = "#ffb5d0";
  context.font = "italic 36px Georgia, serif";
  context.fillText("Ankit", canvas.width / 2, 1650);

  const jpeg = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not render the PDF page."));
    }, "image/jpeg", 0.94);
  });
  return makeImagePdf(new Uint8Array(await jpeg.arrayBuffer()), canvas.width, canvas.height);
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  let line = "";
  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      context.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = nextLine;
    }
  }
  if (line) {
    context.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function makeImagePdf(jpeg, width, height) {
  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let length = 0;
  const append = (part) => {
    parts.push(part);
    length += part.length;
  };
  const appendText = (text) => append(encoder.encode(text));
  const addObject = (number, content) => {
    offsets[number] = length;
    appendText(`${number} 0 obj\n${content}\nendobj\n`);
  };

  appendText("%PDF-1.4\n");
  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
  offsets[4] = length;
  appendText(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  append(jpeg);
  appendText("\nendstream\nendobj\n");
  const content = "q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ";
  addObject(5, `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);

  const xrefOffset = length;
  appendText(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let i = 1; i < offsets.length; i += 1) {
    appendText(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }
  appendText(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const pdf = new Uint8Array(length);
  let position = 0;
  parts.forEach((part) => {
    pdf.set(part, position);
    position += part.length;
  });
  return pdf;
}

function safeFileName(value) {
  return value.replace(/[^a-z0-9-_]/gi, "-").replace(/-+/g, "-").slice(0, 30) || "You";
}

function createHearts(amount) {
  const symbols = ["♡", "💗", "💕", "✨", "🌸"];
  for (let i = 0; i < amount; i += 1) {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.fontSize = `${16 + Math.random() * 20}px`;
    heart.style.animationDuration = `${2.5 + Math.random() * 2}s`;
    document.body.appendChild(heart);
    window.setTimeout(() => heart.remove(), 5000);
  }
}

// Soft stars in the background
const canvas = document.getElementById("stars");
const context = canvas.getContext("2d");
let stars = [];

function resizeCanvas() {
  const scale = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * scale;
  canvas.height = window.innerHeight * scale;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  stars = Array.from({ length: 125 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.4 + 0.2,
    phase: Math.random() * Math.PI * 2
  }));
}

function drawStars() {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  stars.forEach((star) => {
    star.phase += 0.012;
    context.globalAlpha = 0.25 + Math.abs(Math.sin(star.phase)) * 0.7;
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fill();
  });
  context.globalAlpha = 1;
  requestAnimationFrame(drawStars);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawStars();
