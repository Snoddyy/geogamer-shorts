import { useEffect } from "react";
import io from "socket.io-client";

const SocketComponent = () => {
  useEffect(() => {
    const socket = io("http://92.141.138.206:8080");

    socket.on("imageUpdated", (index) => {
      console.log("Received updated image index:", index);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null;
};

export default SocketComponent;
