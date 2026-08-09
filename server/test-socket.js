const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected as", socket.id);
  socket.emit("join-board", "6a6f0c2d695c3705e11526bc"); // use your real board _id here
});

socket.on("card:created", (card) => {
  console.log("REAL-TIME EVENT — card created:", card);
});

socket.on("card:updated", (card) => {
  console.log("REAL-TIME EVENT — card updated:", card);
});